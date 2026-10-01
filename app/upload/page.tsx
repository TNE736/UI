'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  UploadCloud,
  X,
} from 'lucide-react';
import { checkFile, missingHeaders, previewCsv, uploadCsvFiles, MAX_FILE_BYTES, type CsvPreview } from '@/lib/upload';
import { useLive } from '@/lib/live';
import { useSystemStatus } from '@/lib/useSystemStatus';
import { cn } from '@/lib/format';
import type { IngestSummary } from '@/lib/types';
import { PageHeader, pillPrimary } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/Number';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { configureLogging, failSpan, runInsideSpan, startRun, startStep } from '@/lib/frontend_logging';

configureLogging(); // browser only; before the first run, so the upload's fetch is traced

interface Queued {
  id: string;
  file: File;
  preview: CsvPreview | null;
  error: string | null;
}

const STEPS = ['Select', 'Validate', 'Preview', 'Import', 'Complete'] as const;

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function UploadPage() {
  const [queue, setQueue] = useState<Queued[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refresh } = useLive();
  const ingest = useSystemStatus().services.find((s) => s.key === 'ingest');

  const update = (id: string, changes: Partial<Queued>) =>
    setQueue((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  function addFiles(files: FileList | File[]) {
    setSummary(null);
    const added = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      preview: null,
      error: checkFile(file),
    }));
    if (!added.length) return;
    setQueue((items) => [...items, ...added]);
    setPreviewId((current) => current ?? added.find((item) => !item.error)?.id ?? null);
    added
      .filter((item) => !item.error)
      .forEach((item) =>
        previewCsv(item.file)
          .then((preview) => update(item.id, { preview }))
          .catch((error: unknown) => update(item.id, { error: error instanceof Error ? error.message : 'Unreadable file' }))
      );
  }

  function remove(id: string) {
    setQueue((items) => {
      const rest = items.filter((q) => q.id !== id);
      if (previewId === id) setPreviewId(rest.find((q) => q.preview)?.id ?? null);
      return rest;
    });
  }

  function reset() {
    setQueue([]);
    setSummary(null);
    setPreviewId(null);
  }

  const parsing = queue.some((item) => !item.preview && !item.error);
  const ready = queue.length > 0 && !parsing && queue.every((item) => !item.error);
  const totalRows = queue.reduce((sum, item) => sum + (item.preview?.rows ?? 0), 0);
  const step = summary ? 4 : uploading ? 3 : ready ? 2 : queue.length ? 1 : 0;
  const shown = queue.find((item) => item.id === previewId && item.preview) ?? queue.find((item) => item.preview);

  async function upload() {
    if (!ready || uploading) return;
    setUploading(true);
    setSummary(null);
    // One run per upload; its trace id travels to the ingest API (traceparent) and from there
    // onto every saved consultant (trace_id), where bench-outreach's Email Agent picks it up.
    const run = startRun('upload_consultants', { files: queue.length, rows: totalRows });

    const checking = startStep('check_files', { 'inputs.files': queue.length });
    queue.forEach((queued, index) => {
      const item = startStep(
        'check_file',
        { item: index + 1, of: queue.length, key: queued.file.name },
        checking
      );
      if (queued.error) failSpan(item, queued.error);
      else item.setAttribute('outputs.rows', queued.preview?.rows ?? 0);
      item.end();
    });
    checking.setAttribute('outputs.rows', totalRows);
    checking.end();

    const sending = startStep('send_upload', { 'inputs.files': queue.length, 'inputs.rows': totalRows });
    const request = runInsideSpan(sending, () => uploadCsvFiles(queue.map((item) => item.file)));
    toast.promise(request, {
      loading: `Saving ${totalRows} row${totalRows === 1 ? '' : 's'} to MongoDB…`,
      success: (result) =>
        result.inserted
          ? `${result.insertedCount ?? 0} saved · ${result.skippedDuplicate ?? 0} already in the database`
          : 'Nothing was saved — see the details',
      error: (error: Error) => error.message,
    });
    try {
      const result = await request;
      sending.setAttribute('outputs.total', result.total);
      sending.setAttribute('outputs.inserted_count', result.insertedCount ?? 0);
      if (!result.inserted) failSpan(sending, result.dbError ?? 'nothing was saved');
      sending.end();

      const showing = startStep('show_result', { 'inputs.inserted': result.inserted });
      setSummary(result);
      showing.setAttribute('outputs.message', result.inserted ? `${result.insertedCount ?? 0} saved` : 'nothing saved');
      showing.setAttribute('outputs.rejected_rows', result.errors.length);
      showing.end();

      run.setAttribute('outputs.saved', result.insertedCount ?? 0);
      run.setAttribute('outputs.skipped_duplicate', result.skippedDuplicate ?? 0);
      run.setAttribute('outputs.invalid', result.invalid);
      if (!result.inserted) failSpan(run, 'nothing was saved');
      if (result.inserted) {
        setQueue([]);
        setPreviewId(null);
        refresh(); // every open view refetches straight away
      }
    } catch (error) {
      // the toast already shows the message
      const reason = error instanceof Error ? error.message : 'upload failed';
      failSpan(sending, reason);
      sending.end();
      failSpan(run, reason);
    } finally {
      run.end();
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        index="02"
        eyebrow="Ingestion"
        title="Upload"
        accent="consultants."
        description="Drop a consultant CSV. New people are saved to MongoDB as “loaded”; anyone already there is skipped, never overwritten."
        actions={
          ingest && (
            <StatusBadge tone={ingest.state === 'up' ? 'success' : ingest.state === 'down' ? 'danger' : 'warning'}>
              Ingest API {ingest.state === 'up' ? 'ready' : ingest.state === 'down' ? 'unreachable' : 'checking'}
            </StatusBadge>
          )
        }
      >
        <Stepper step={step} failed={summary !== null && !summary.inserted} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          {/* Drop zone: large when empty, compact once files are queued. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            disabled={uploading}
            className={cn(
              'rise group relative flex w-full items-center overflow-hidden rounded-panel border border-dashed text-center',
              'transition-[border-color,background-color] duration-200 ease-out disabled:opacity-60',
              queue.length ? 'flex-row gap-4 px-5 py-4 text-left' : 'flex-col justify-center px-6 py-16',
              dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface hover:border-ink/40'
            )}
          >
            {!queue.length && <span aria-hidden className="flow-grid absolute inset-0 opacity-60" />}
            <span
              className={cn(
                'relative grid shrink-0 place-items-center rounded-full bg-ink text-on-ink shadow-glow transition-transform duration-200 ease-out',
                queue.length ? 'h-10 w-10' : 'mb-4 h-14 w-14',
                dragging && 'scale-105'
              )}
            >
              <UploadCloud className={queue.length ? 'h-4 w-4' : 'h-6 w-6'} />
            </span>
            <span className="relative">
              <span className={cn('font-display block font-semibold text-ink', queue.length ? 'text-[17px]' : 'text-[22px]')}>
                {dragging ? 'Drop to add' : queue.length ? 'Add more files' : 'Drop CSV files here, or click to browse'}
              </span>
              <span className="mt-1 block text-[13px] text-muted">
                CSV only · up to {MAX_FILE_BYTES / 1024 / 1024} MB each · checked in your browser first
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {/* Files with their pre-checks */}
          {queue.length > 0 && (
            <Card
              eyebrow="Validate"
              title="Files"
              description={`${queue.length} file${queue.length === 1 ? '' : 's'} · ${totalRows.toLocaleString()} row${totalRows === 1 ? '' : 's'}`}
              flush
              className="rise overflow-hidden"
            >
              <ul className="divide-y divide-line border-t border-line">
                {queue.map((item) => (
                  <FileRow
                    key={item.id}
                    item={item}
                    selected={shown?.id === item.id}
                    onSelect={() => setPreviewId(item.id)}
                    onRemove={() => remove(item.id)}
                    disabled={uploading}
                  />
                ))}
              </ul>

              {/* Import progress: the ingest API doesn't stream progress, so this is honestly indeterminate. */}
              {uploading && (
                <div className="border-t border-line px-5 py-4">
                  <div className="mb-2 flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-ink">Importing {totalRows.toLocaleString()} rows…</span>
                    <span className="text-faint">Validating and saving on the server</span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span className="progress-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/60 px-5 py-4">
                <Button variant="ghost" size="sm" onClick={reset} disabled={uploading}>
                  Clear all
                </Button>
                <Button variant="primary" onClick={upload} disabled={!ready || uploading}>
                  {uploading || parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading ? 'Importing…' : parsing ? 'Reading files…' : `Import ${totalRows.toLocaleString()} rows`}
                </Button>
              </div>
            </Card>
          )}

          {/* Preview table */}
          {shown?.preview && <PreviewTable name={shown.file.name} preview={shown.preview} />}
        </div>

        {/* Side: result, or requirements */}
        <aside className="space-y-5">
          {summary ? <ResultPanel summary={summary} onReset={reset} /> : <Requirements />}
        </aside>
      </div>
    </>
  );
}

/* ─────────────────────────── Stepper ─────────────────────────── */

function Stepper({ step, failed }: { step: number; failed: boolean }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Upload progress">
      {STEPS.map((label, index) => {
        const done = index < step || (index === step && step === 4 && !failed);
        const current = index === step && !done;
        const error = failed && index === step;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2" aria-current={index === step ? 'step' : undefined}>
            <span
              className={cn(
                'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12.5px] font-medium transition-colors duration-200 ease-out',
                error
                  ? 'bg-danger-soft text-danger'
                  : done
                    ? 'bg-accent-soft text-accent'
                    : current
                      ? 'bg-ink text-on-ink'
                      : 'bg-surface-2 text-faint'
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full text-[10.5px] font-semibold',
                  error ? 'bg-danger text-white' : done ? 'bg-accent text-on-ink' : current ? 'bg-on-ink/15' : 'bg-surface-3'
                )}
              >
                {error ? <X className="h-3 w-3" /> : done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden className={cn('h-px w-5 sm:w-8', index < step ? 'bg-accent' : 'bg-line-strong')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────── File row ─────────────────────────── */

function FileRow({
  item,
  selected,
  onSelect,
  onRemove,
  disabled,
}: {
  item: Queued;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const p = item.preview;
  const missing = p ? missingHeaders(p.headers) : [];
  const warnings = p
    ? [
        missing.length && `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
        p.checks.missingName && `${p.checks.missingName} without first name`,
        p.checks.missingEmail && `${p.checks.missingEmail} without email`,
        p.checks.malformedEmail && `${p.checks.malformedEmail} malformed email${p.checks.malformedEmail > 1 ? 's' : ''}`,
        p.checks.duplicateEmail && `${p.checks.duplicateEmail} duplicate email${p.checks.duplicateEmail > 1 ? 's' : ''} in file`,
        !p.looksLikeConsultants && !missing.length && 'Looks like a lead file, not a consultant roster',
      ].filter((w): w is string => Boolean(w))
    : [];

  return (
    <li className={cn('rise flex items-start gap-3 px-5 py-3.5 transition-colors duration-150', selected && 'bg-surface-2/70')}>
      <span
        className={cn(
          'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-control',
          item.error ? 'bg-danger-soft text-danger' : warnings.length ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent'
        )}
      >
        {item.error ? (
          <AlertTriangle className="h-4 w-4" />
        ) : !p ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
      </span>
      <button type="button" onClick={onSelect} disabled={!p} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13.5px] font-medium text-ink">{item.file.name}</span>
        <span className={cn('block text-[12px]', item.error ? 'text-danger' : 'text-faint')}>
          {item.error ??
            (p
              ? `${p.rows.toLocaleString()} row${p.rows === 1 ? '' : 's'} · ${p.headers.length} columns · ${formatBytes(item.file.size)}`
              : 'Reading and checking…')}
        </span>
        {p && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {warnings.length ? (
              warnings.map((w) => (
                <StatusBadge key={w} tone="warning" className="text-[11.5px]">
                  {w}
                </StatusBadge>
              ))
            ) : (
              <StatusBadge tone="success" className="text-[11.5px]">
                Pre-checks passed
              </StatusBadge>
            )}
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label={`Remove ${item.file.name}`}
        onClick={onRemove}
        disabled={disabled}
        className="press grid h-8 w-8 shrink-0 place-items-center rounded-control text-faint hover:bg-surface-3 hover:text-ink disabled:opacity-40"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

/* ─────────────────────────── Preview table ─────────────────────────── */

function PreviewTable({ name, preview }: { name: string; preview: CsvPreview }) {
  const columns = preview.headers.slice(0, 8);
  return (
    <Card
      eyebrow="Preview"
      title={name}
      description={`First ${preview.sample.length} of ${preview.rows.toLocaleString()} rows${
        preview.headers.length > columns.length ? ` · ${columns.length} of ${preview.headers.length} columns` : ''
      }`}
      flush
      className="rise overflow-hidden"
    >
      <div className="thin-scroll overflow-x-auto border-t border-line">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="bg-surface-2 text-faint">
            <tr>
              <th className="w-10 px-4 py-2.5 font-medium">#</th>
              {columns.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {preview.sample.map((row, i) => (
              <tr key={i} className="hover:bg-surface-2/60">
                <td className="num px-4 py-2.5 text-faint">{i + 1}</td>
                {columns.map((h) => (
                  <td key={h} className="max-w-[220px] truncate whitespace-nowrap px-4 py-2.5 text-ink">
                    {row[h] || <span className="text-faint">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─────────────────────────── Result ─────────────────────────── */

function ResultPanel({ summary, onReset }: { summary: IngestSummary; onReset: () => void }) {
  const stats = [
    { label: 'Rows seen', value: summary.total, tone: 'text-ink' },
    { label: 'Saved', value: summary.insertedCount ?? 0, tone: 'text-success' },
    { label: 'Already saved', value: summary.skippedDuplicate ?? 0, tone: 'text-muted' },
    { label: 'Invalid', value: summary.invalid, tone: summary.invalid ? 'text-danger' : 'text-muted' },
  ];

  return (
    <Card
      className="rise"
      eyebrow="Complete"
      title={
        <span className="flex items-center gap-2">
          {summary.inserted ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-danger" />}
          {summary.inserted ? 'Import complete' : 'Nothing was saved'}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-field bg-line">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-2 px-4 py-3.5">
            <p className="t-label">{stat.label}</p>
            <p className={cn('t-figure mt-1.5 text-[28px]', stat.tone)}>
              <AnimatedNumber value={stat.value} />
            </p>
          </div>
        ))}
      </div>

      {(summary.skippedNonDecisionMaker > 0 || summary.skippedNotLead > 0) && (
        <p className="mt-3 text-[12.5px] text-muted">
          Also skipped: {summary.skippedNonDecisionMaker} non-decision-maker, {summary.skippedNotLead} not a lead.
        </p>
      )}

      {summary.dbError && (
        <p className="mt-4 rounded-field bg-danger-soft px-3 py-2 text-[12.5px] text-danger">Database error: {summary.dbError}</p>
      )}

      {summary.errors.length > 0 && (
        <div className="mt-5">
          <p className="t-label mb-2">Rejected rows</p>
          <div className="thin-scroll max-h-72 overflow-auto rounded-field border border-line">
            <table className="w-full text-left text-[12.5px]">
              <thead className="sticky top-0 bg-surface-2 text-faint">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {summary.errors.map((error, index) => (
                  <tr key={index}>
                    <td className="num px-3 py-2 align-top text-muted">
                      {error.row ?? '—'}
                      <span className="block max-w-[110px] truncate text-[11px] text-faint">{error.file}</span>
                    </td>
                    <td className="px-3 py-2 text-danger">{error.issues.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summary.errorsOmitted > 0 && <p className="mt-2 text-[12px] text-faint">+{summary.errorsOmitted} more not shown</p>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        {summary.inserted && (
          <Link href="/consultants" className={pillPrimary}>
            View consultants <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Button onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Upload another
        </Button>
      </div>
    </Card>
  );
}

/* ─────────────────────────── Requirements ─────────────────────────── */

function Requirements() {
  const steps = [
    ['Check', 'Each file is read in your browser: rows, columns, missing fields and duplicate emails.'],
    ['Import', 'The ingest API validates every row and saves new consultants to MongoDB as “loaded”.'],
    ['Skip', 'Anyone whose email is already stored is skipped, so their progress is never touched.'],
    ['Outreach', 'Set decision_maker to true in Compass and bench-outreach emails them.'],
  ];
  return (
    <>
      <Card eyebrow="Format" title="What a roster needs">
        <ul className="space-y-2.5 text-[13px]">
          {[
            ['first_name', 'Required'],
            ['email', 'Required · used to skip duplicates'],
            ['last_name', 'Optional'],
            ['technology, title, seniority, visa_status, phone', 'Optional'],
          ].map(([column, note]) => (
            <li key={column} className="flex items-baseline justify-between gap-4">
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-ink">{column}</code>
              <span className="text-right text-muted">{note}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card eyebrow="How it works" title="From CSV to outreach">
        <ol className="space-y-4">
          {steps.map(([title, text], index) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                {index + 1}
              </span>
              <span className="text-[13px]">
                <span className="font-medium text-ink">{title}.</span> <span className="text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
