'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search, Users } from 'lucide-react';
import type { Consultant, ConsultantPage } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { ALL_STAGES, STAGE_META, type Stage } from '@/lib/stages';
import { cn, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StagePill } from '@/components/ui/StagePill';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorBanner } from '@/components/ui/States';
import { ConsultantSheet } from '@/components/consultants/ConsultantSheet';

type SortKey = 'created' | 'name' | 'technology' | 'title' | 'stage';
type DmFilter = 'all' | 'yes' | 'no';
const PAGE_SIZE = 20;

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: 'name', label: 'Consultant' },
  { key: 'technology', label: 'Technology', className: 'hidden md:table-cell' },
  { key: 'title', label: 'Title', className: 'hidden lg:table-cell' },
  { key: null, label: 'Visa', className: 'hidden xl:table-cell' },
  { key: 'stage', label: 'Stage' },
  { key: null, label: 'Decision maker', className: 'hidden sm:table-cell' },
  { key: 'created', label: 'Added', className: 'hidden lg:table-cell text-right' },
];

export default function ConsultantsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage | 'all'>('all');
  const [dm, setDm] = useState<DmFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Consultant | null>(null);

  // Debounce typing so every keystroke doesn't hit MongoDB.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ sort: sort.key, dir: sort.dir, page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) p.set('q', query);
    if (stage !== 'all') p.set('stage', stage);
    if (dm !== 'all') p.set('dm', dm);
    return p;
  }, [query, stage, dm, sort, page]);

  const { data, error, loading } = useResource<ConsultantPage>(`/api/consultants?${params}`);
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function toggleSort(key: SortKey) {
    setPage(1);
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'created' ? 'desc' : 'asc' }
    );
  }

  async function exportCsv() {
    const all = new URLSearchParams(params);
    all.set('page', '1');
    all.set('pageSize', '1000');
    const response = await fetch(`/api/consultants?${all}`);
    if (!response.ok) return;
    const { rows } = (await response.json()) as ConsultantPage;
    const header = ['first_name', 'last_name', 'email', 'phone', 'technology', 'title', 'seniority', 'visa_status', 'stage', 'decision_maker'];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((c) =>
      [c.firstName, c.lastName, c.email, c.phone, c.technology, c.title, c.seniority, c.visaStatus, c.stage, c.decisionMaker].map(escape).join(',')
    );
    const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: 'consultants.csv' });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Consultants"
        description={data ? `${data.total} match${data.total === 1 ? '' : 'es'}` : 'Everyone in the pipeline, searchable.'}
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!data?.total}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <Card flush className="rise overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, technology, title…"
              aria-label="Search consultants"
              className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-[14px] text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent/60 focus:shadow-[0_0_0_3px_var(--accent-soft)] sm:text-[13.5px]"
            />
          </label>

          <div className="thin-scroll flex gap-1.5 overflow-x-auto lg:flex-1">
            <FilterChip active={stage === 'all'} onClick={() => { setStage('all'); setPage(1); }}>
              All stages
            </FilterChip>
            {ALL_STAGES.map((s) => (
              <FilterChip key={s} active={stage === s} color={STAGE_META[s].color} onClick={() => { setStage(s); setPage(1); }}>
                {STAGE_META[s].label}
              </FilterChip>
            ))}
          </div>

          <div className="flex shrink-0 rounded-xl border border-line bg-surface-2 p-0.5 text-[12.5px]" role="group" aria-label="Decision maker filter">
            {(['all', 'yes', 'no'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => { setDm(value); setPage(1); }}
                aria-pressed={dm === value}
                className={cn(
                  'press rounded-[10px] px-3 py-1.5 font-medium',
                  dm === value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg'
                )}
              >
                {value === 'all' ? 'Everyone' : value === 'yes' ? 'Decision makers' : 'Not yet'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <thead className="border-b border-line text-[12px] text-faint">
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column.label} scope="col" className={cn('px-4 py-3 font-medium first:pl-5', column.className)}>
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key!)}
                        className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-fg"
                      >
                        {column.label}
                        {sort.key === column.key &&
                          (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && !data
                ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={COLUMNS.length} className="px-5 py-3">
                        <Skeleton className="h-7 w-full" />
                      </td>
                    </tr>
                  ))
                : data?.rows.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-surface-2"
                    >
                      <td className="py-2.5 pl-5 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size={30} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">{c.name}</p>
                            <p className="truncate text-[12px] text-faint">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-2.5 text-muted md:table-cell">{c.technology ?? '—'}</td>
                      <td className="hidden max-w-[220px] truncate px-4 py-2.5 text-muted lg:table-cell">{c.title ?? '—'}</td>
                      <td className="hidden px-4 py-2.5 text-muted xl:table-cell">{c.visaStatus ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <StagePill stage={c.stage} />
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        {c.decisionMaker ? (
                          <span className="rounded-full bg-success/12 px-2 py-0.5 text-[12px] font-medium text-success">Yes</span>
                        ) : (
                          <span className="text-[12px] text-faint">No</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right text-[12.5px] tabular-nums text-faint lg:table-cell">
                        {relativeTime(c.createdAt)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {data && data.rows.length === 0 && (
            <EmptyState icon={<Users className="h-5 w-5" />} title="No consultants match" description="Try a different search or clear the filters." />
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[12.5px] text-muted">
            <span className="tabular-nums">
              {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 tabular-nums">
                {page} / {pageCount}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConsultantSheet consultant={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150',
        active ? 'border-accent/50 bg-accent-soft text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'
      )}
    >
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />}
      {children}
    </button>
  );
}
