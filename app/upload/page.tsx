'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react';
import { checkFile, previewCsv, uploadCsvFiles, type CsvPreview } from '@/lib/upload';
import { useLive } from '@/lib/live';
import { cn } from '@/lib/format';
import type { IngestSummary } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/Number';

interface Queued {
  id: string;
  file: File;
  preview: CsvPreview | null;
  error: string | null;
}

export default function UploadPage() {
  const [queue, setQueue] = useState<Queued[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refresh } = useLive();

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
    setQueue((items) => [...items, ...added]);
    added
      .filter((item) => !item.error)
      .forEach((item) =>
        previewCsv(item.file)
          .then((preview) => update(item.id, { preview }))
          .catch((error: unknown) => update(item.id, { error: error instanceof Error ? error.message : 'Unreadable file' }))
      );
  }

  const parsing = queue.some((item) => !item.preview && !item.error);
  const ready = queue.length > 0 && !parsing && queue.every((item) => !item.error);
  const totalRows = queue.reduce((sum, item) => sum + (item.preview?.rows ?? 0), 0);

  async function upload() {
    if (!ready || uploading) return;
    setUploading(true);
    setSummary(null);
    const request = uploadCsvFiles(queue.map((item) => item.file));
    toast.promise(request, {
      loading: `Saving ${totalRows} row${totalRows === 1 ? '' : 's'} to MongoDB…`,
      success: (result) =>
        result.inserted
          ? `${result.insertedCount ?? 0} saved · ${result.skippedDuplicate ?? 0} already in the database`
          : 'Nothing was saved — see the details below',
      error: (error: Error) => error.message,
    });
    try {
      const result = await request;
      setSummary(result);
      if (result.inserted) {
        setQueue([]);
        refresh(); // every open view refetches straight away
      }
    } catch {
      // the toast already shows the message
    } finally {
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
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          {/* Drop zone */}
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
            className={cn(
              'rise group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed px-6 py-16 text-center',
              'transition-[border-color,background-color] duration-200 ease-out',
              dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface hover:border-ink/40'
            )}
          >
            <span
              className={cn(
                'relative mb-4 grid h-14 w-14 place-items-center rounded-full bg-ink text-[#f5f2ed] shadow-glow',
                'transition-transform duration-200 ease-out',
                dragging && 'scale-105'
              )}
            >
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="font-display relative text-[22px] font-semibold text-ink">
              {dragging ? 'Drop to add' : 'Drop CSV files here, or click to browse'}
            </span>
            <span className="relative mt-1 text-[13px] text-muted">CSV only · up to 15 MB · checked in your browser first</span>
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

          {/* Queue */}
          {queue.length > 0 && (
            <Card title="Ready to upload" description={`${queue.length} file${queue.length === 1 ? '' : 's'} · ${totalRows} row${totalRows === 1 ? '' : 's'}`} flush className="rise">
              <ul className="divide-y divide-line border-t border-line">
                {queue.map((item) => (
                  <li key={item.id} className="rise flex items-center gap-3 px-5 py-3">
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        item.error ? 'bg-danger/12 text-danger' : 'bg-accent-soft text-accent'
                      )}
                    >
                      {item.error ? <AlertTriangle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-fg">{item.file.name}</span>
                      <span className={cn('block text-[12px]', item.error ? 'text-danger' : 'text-faint')}>
                        {item.error ??
                          (item.preview
                            ? `${item.preview.rows} row${item.preview.rows === 1 ? '' : 's'} · ${item.preview.looksLikeConsultants ? 'consultant roster' : 'lead file'} · ${item.preview.headers.length} columns`
                            : 'Reading…')}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => setQueue((items) => items.filter((q) => q.id !== item.id))}
                      className="press grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                <Button variant="ghost" size="sm" onClick={() => setQueue([])} disabled={uploading}>
                  Clear
                </Button>
                <Button variant="primary" onClick={upload} disabled={!ready || uploading}>
                  {uploading || parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading ? 'Saving…' : parsing ? 'Reading files…' : 'Save to MongoDB'}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Result */}
        <div className="xl:col-span-2">
          {summary ? <ResultPanel summary={summary} /> : <HowItWorks />}
        </div>
      </div>
    </>
  );
}

function ResultPanel({ summary }: { summary: IngestSummary }) {
  const stats = [
    { label: 'Rows seen', value: summary.total, tone: 'text-fg' },
    { label: 'Saved', value: summary.insertedCount ?? 0, tone: 'text-success' },
    { label: 'Already saved', value: summary.skippedDuplicate ?? 0, tone: 'text-muted' },
    { label: 'Invalid', value: summary.invalid, tone: summary.invalid ? 'text-danger' : 'text-muted' },
  ];

  return (
    <Card
      className="rise"
      eyebrow="Result"
      title={
        <span className="flex items-center gap-2">
          {summary.inserted ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-danger" />
          )}
          {summary.inserted ? 'Upload complete' : 'Nothing was saved'}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
            <p className="text-[12px] text-muted">{stat.label}</p>
            <p className={cn('mt-1 text-[24px] font-semibold tracking-tight', stat.tone)}>
              <AnimatedNumber value={stat.value} />
            </p>
          </div>
        ))}
      </div>

      {summary.dbError && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/8 px-3 py-2 text-[12.5px] text-danger">
          Database error: {summary.dbError}
        </p>
      )}

      {summary.errors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-faint">Rejected rows</p>
          <div className="thin-scroll max-h-72 overflow-auto rounded-xl border border-line">
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
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {error.row ?? '—'}
                      <span className="block truncate text-[11px] text-faint">{error.file}</span>
                    </td>
                    <td className="px-3 py-2 text-danger">{error.issues.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summary.errorsOmitted > 0 && (
            <p className="mt-2 text-[12px] text-faint">+{summary.errorsOmitted} more not shown</p>
          )}
        </div>
      )}
    </Card>
  );
}

function HowItWorks() {
  const steps = [
    ['Check', 'Each file is read in your browser: rows are counted and the type is detected.'],
    ['Save', 'The ingest API validates every row and saves new consultants to MongoDB as “loaded”.'],
    ['Skip', 'Anyone whose email is already stored is skipped, so their progress is never touched.'],
    ['Outreach', 'Set decision_maker to true in Compass and bench-outreach emails them.'],
  ];
  return (
    <Card className="rise" eyebrow="How it works" title="From CSV to outreach">
      <ol className="space-y-4">
        {steps.map(([title, text], index) => (
          <li key={title} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
              {index + 1}
            </span>
            <span className="text-[13px]">
              <span className="font-medium text-fg">{title}.</span> <span className="text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
