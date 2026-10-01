'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import type { Breakdowns, Consultant, ConsultantPage, Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { ALL_STAGES, STAGE_META } from '@/lib/stages';
import { cn, relativeTime } from '@/lib/format';
import { PageHeader, pillSecondary } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StagePill } from '@/components/ui/StagePill';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DataStamp } from '@/components/ui/DataStamp';
import { Drawer } from '@/components/ui/Drawer';
import { FilterSelect, type FilterOption } from '@/components/ui/FilterSelect';
import { ConsultantSheet } from '@/components/consultants/ConsultantSheet';

type SortKey = 'created' | 'name' | 'technology' | 'title' | 'stage';

interface Filters {
  stage: string;
  dm: string;
  technology: string;
  seniority: string;
  visa: string;
  email: string;
}
const NO_FILTERS: Filters = { stage: '', dm: '', technology: '', seniority: '', visa: '', email: '' };
const FILTER_LABELS: Record<keyof Filters, string> = {
  stage: 'Stage',
  dm: 'Decision maker',
  technology: 'Technology',
  seniority: 'Seniority',
  visa: 'Visa',
  email: 'Email status',
};
const PAGE_SIZES = [20, 50, 100];

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: 'name', label: 'Consultant' },
  { key: 'technology', label: 'Technology', className: 'hidden md:table-cell' },
  { key: 'title', label: 'Title', className: 'hidden lg:table-cell' },
  { key: null, label: 'Visa', className: 'hidden xl:table-cell' },
  { key: 'stage', label: 'Stage' },
  { key: null, label: 'Approval', className: 'hidden sm:table-cell' },
  { key: 'created', label: 'Added', className: 'hidden lg:table-cell text-right' },
];
const SORT_LABELS: Record<SortKey, string> = {
  created: 'Date added',
  name: 'Name',
  technology: 'Technology',
  title: 'Title',
  stage: 'Stage',
};

/** Breakdown rows → select options ("Other (n)" is a roll-up, not a value). */
const toOptions = (rows: { label: string; count: number }[] | undefined): FilterOption[] =>
  (rows ?? []).filter((r) => !r.label.startsWith('Other (')).map((r) => ({ value: r.label, label: r.label, count: r.count }));

export default function ConsultantsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]!);
  const [selected, setSelected] = useState<Consultant | null>(null);
  const [picked, setPicked] = useState<Map<string, Consultant>>(new Map());
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce typing so every keystroke doesn't hit MongoDB.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ sort: sort.key, dir: sort.dir, page: String(page), pageSize: String(pageSize) });
    if (query) p.set('q', query);
    for (const [key, value] of Object.entries(filters)) if (value) p.set(key, value);
    return p;
  }, [query, filters, sort, page, pageSize]);

  const { data, error, loading, fetching, updatedAt, retry } = useResource<ConsultantPage>(`/api/consultants?${params}`);
  const breakdowns = useResource<Breakdowns>('/api/breakdowns', null);
  const overview = useResource<Overview>('/api/overview', null);
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const options: Record<keyof Filters, FilterOption[]> = {
    stage: ALL_STAGES.map((s) => ({ value: s, label: STAGE_META[s].label, count: overview.data?.byStage[s] })),
    dm: [
      { value: 'yes', label: 'Approved' },
      { value: 'no', label: 'Not yet' },
    ],
    technology: toOptions(breakdowns.data?.technology),
    seniority: toOptions(breakdowns.data?.seniority),
    visa: toOptions(breakdowns.data?.visaStatus),
    email: [
      ...Object.entries(overview.data?.emailStatus ?? {}).map(([value, count]) => ({ value, label: value, count })),
      { value: 'Not set', label: 'Not set' },
    ],
  };
  const active = (Object.keys(filters) as (keyof Filters)[]).filter((key) => filters[key]);

  function setFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }
  function clearAll() {
    setFilters(NO_FILTERS);
    setSearch('');
    setPage(1);
  }
  function toggleSort(key: SortKey) {
    setPage(1);
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'created' ? 'desc' : 'asc' }
    );
  }
  function togglePick(c: Consultant) {
    setPicked((m) => {
      const next = new Map(m);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });
  }
  const pageRows = data?.rows ?? [];
  const allOnPage = pageRows.length > 0 && pageRows.every((c) => picked.has(c.id));
  function togglePage() {
    setPicked((m) => {
      const next = new Map(m);
      pageRows.forEach((c) => (allOnPage ? next.delete(c.id) : next.set(c.id, c)));
      return next;
    });
  }

  async function exportAll() {
    const all = new URLSearchParams(params);
    all.set('page', '1');
    all.set('pageSize', '1000');
    const response = await fetch(`/api/consultants?${all}`);
    if (!response.ok) return;
    const { rows } = (await response.json()) as ConsultantPage;
    downloadCsv(rows, 'consultants.csv');
  }

  const filterFields = (block: boolean) =>
    (Object.keys(FILTER_LABELS) as (keyof Filters)[]).map((key) => (
      <FilterSelect
        key={key}
        block={block}
        label={FILTER_LABELS[key]}
        value={filters[key]}
        onChange={(value) => setFilter(key, value)}
        options={options[key]}
        anyLabel={key === 'stage' ? 'All' : 'Any'}
      />
    ));

  return (
    <>
      <PageHeader
        index="03"
        eyebrow="Directory"
        title="Every"
        accent="consultant."
        description="Search, filter and open anyone in the pipeline. Click a row for the full profile."
        actions={
          <button type="button" className={pillSecondary} onClick={exportAll} disabled={!data?.total}>
            <Download className="h-4 w-4" /> Export {active.length || query ? 'filtered' : 'all'}
          </button>
        }
      >
        <DataStamp updatedAt={updatedAt} fetching={fetching} onRefresh={retry} />
      </PageHeader>

      {error && (
        <div className="mb-5">
          <ErrorState title={data ? 'Showing the last good results' : 'Couldn’t load consultants'} message={error} onRetry={retry} />
        </div>
      )}

      <Card flush className="rise overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex items-center gap-2.5">
            <label className="relative block min-w-0 flex-1 lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, technology, title…"
                aria-label="Search consultants"
                className="h-10 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-[14px] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent/60 focus:shadow-[0_0_0_3px_var(--accent-soft)] sm:text-[13.5px]"
              />
            </label>
            {/* Desktop: filters inline. */}
            <div className="hidden flex-1 flex-wrap items-center gap-2 lg:flex">{filterFields(false)}</div>
            {/* Below lg: one button opens the filter drawer. */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="press inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {active.length > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-on-ink">{active.length}</span>
              )}
            </button>
          </div>

          {/* Result line: count, active chips, clear */}
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="mr-1 text-muted">
              {data ? (
                <>
                  <span className="num font-semibold text-ink">{data.total.toLocaleString()}</span> match{data.total === 1 ? '' : 'es'}
                </>
              ) : (
                'Loading…'
              )}
            </span>
            {query && <ActiveChip label={`“${query}”`} onRemove={() => setSearch('')} />}
            {active.map((key) => (
              <ActiveChip
                key={key}
                label={`${FILTER_LABELS[key]}: ${options[key].find((o) => o.value === filters[key])?.label ?? filters[key]}`}
                onRemove={() => setFilter(key, '')}
              />
            ))}
            {(active.length > 0 || query) && (
              <button type="button" onClick={clearAll} className="press ml-1 font-medium text-accent hover:text-ink">
                Clear all
              </button>
            )}
            {/* Sort control for small screens, where column headers are hidden. */}
            <label className="relative ml-auto inline-flex items-center gap-1.5 text-muted sm:hidden">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="font-medium text-ink">{SORT_LABELS[sort.key]}</span>
              <select
                aria-label="Sort by"
                value={`${sort.key}:${sort.dir}`}
                onChange={(event) => {
                  const [key, dir] = event.target.value.split(':') as [SortKey, 'asc' | 'desc'];
                  setSort({ key, dir });
                  setPage(1);
                }}
                className="absolute inset-0 opacity-0"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).flatMap((key) => [
                  <option key={`${key}:asc`} value={`${key}:asc`}>
                    {SORT_LABELS[key]} ↑
                  </option>,
                  <option key={`${key}:desc`} value={`${key}:desc`}>
                    {SORT_LABELS[key]} ↓
                  </option>,
                ])}
              </select>
            </label>
          </div>
        </div>

        {/* Selection bar */}
        {picked.size > 0 && (
          <div className="flex items-center gap-3 border-b border-line bg-accent-soft px-5 py-2.5 text-[13px]">
            <span className="font-medium text-ink">
              <span className="num">{picked.size}</span> selected
            </span>
            <Button size="sm" variant="primary" onClick={() => downloadCsv([...picked.values()], 'consultants-selected.csv')}>
              <Download className="h-3.5 w-3.5" /> Export selected
            </Button>
            <button type="button" onClick={() => setPicked(new Map())} className="press ml-auto text-muted hover:text-ink">
              Clear selection
            </button>
          </div>
        )}

        {/* Table (sm+) */}
        <div className="thin-scroll hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead className="sticky top-0 z-10 border-b border-line bg-surface-2/80 text-[12px] text-faint backdrop-blur">
              <tr>
                <th scope="col" className="w-10 py-3 pl-5">
                  <Checkbox checked={allOnPage} onChange={togglePage} label="Select all on this page" />
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={sort.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('px-4 py-3 font-medium', column.className)}
                  >
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key!)}
                        className={cn(
                          'inline-flex items-center gap-1 transition-colors duration-150 hover:text-ink',
                          sort.key === column.key && 'text-ink'
                        )}
                      >
                        {column.label}
                        {sort.key === column.key ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y divide-line transition-opacity duration-150', fetching && data && 'opacity-70')}>
              {loading && !data ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-5 py-4">
                    <SkeletonRows rows={8} />
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      'group cursor-pointer transition-colors duration-150 hover:bg-surface-2',
                      picked.has(c.id) && 'bg-accent-soft/60'
                    )}
                  >
                    <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={picked.has(c.id)} onChange={() => togglePick(c)} label={`Select ${c.name}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={32} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(c);
                            }}
                            className="block max-w-[240px] truncate text-left font-medium text-ink group-hover:text-accent"
                          >
                            {c.name}
                          </button>
                          <p className="max-w-[240px] truncate text-[12px] text-faint">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{c.technology ?? '—'}</td>
                    <td className="hidden max-w-[220px] px-4 py-3 lg:table-cell">
                      <p className="truncate text-muted">{c.title ?? '—'}</p>
                      {c.seniority && <p className="truncate text-[12px] text-faint">{c.seniority}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-muted xl:table-cell">{c.visaStatus ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StagePill stage={c.stage} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {c.optedOut ? (
                        <StatusBadge tone="danger">Opted out</StatusBadge>
                      ) : c.decisionMaker ? (
                        <StatusBadge tone="success">Approved</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Awaiting</StatusBadge>
                      )}
                    </td>
                    <td
                      className="num hidden px-4 py-3 text-right text-[12.5px] text-faint lg:table-cell"
                      title={new Date(c.createdAt).toLocaleString()}
                    >
                      {relativeTime(c.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (phones) */}
        <ul className="divide-y divide-line sm:hidden">
          {loading && !data ? (
            <li className="p-4">
              <SkeletonRows rows={6} />
            </li>
          ) : (
            pageRows.map((c) => (
              <li key={c.id} className={cn('flex items-center gap-3 px-4 py-3', picked.has(c.id) && 'bg-accent-soft/60')}>
                <Checkbox checked={picked.has(c.id)} onChange={() => togglePick(c)} label={`Select ${c.name}`} />
                <button type="button" onClick={() => setSelected(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Avatar name={c.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{c.name}</span>
                    <span className="block truncate text-[12px] text-faint">
                      {[c.technology, c.title].filter(Boolean).join(' · ') || c.email}
                    </span>
                  </span>
                  <StagePill stage={c.stage} />
                </button>
              </li>
            ))
          )}
        </ul>

        {data && data.rows.length === 0 && (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={data.total === 0 && !active.length && !query ? 'No consultants yet' : 'No consultants match'}
            description={
              data.total === 0 && !active.length && !query
                ? 'Upload a consultant CSV to fill the pipeline.'
                : 'Try a different search, or clear the filters.'
            }
            action={
              (active.length > 0 || query) && (
                <Button size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              )
            }
          />
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[12.5px] text-muted">
            <span className="num">
              {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 sm:flex">
                Rows
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-control border border-line-strong bg-surface px-2 text-ink"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="num px-1.5">
                  Page {page} of {pageCount}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile / tablet filters */}
      <Drawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        description={data ? `${data.total.toLocaleString()} match${data.total === 1 ? '' : 'es'}` : undefined}
        width={400}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        }
      >
        <div className="grid gap-2.5 p-5">{filterFields(true)}</div>
      </Drawer>

      <ConsultantSheet consultant={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="rise inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-3 pr-1 font-medium text-ink ring-1 ring-line">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="press grid h-5 w-5 place-items-center rounded-full text-faint hover:bg-surface-3 hover:text-ink"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-line-strong accent-[var(--accent)]"
    />
  );
}

function downloadCsv(rows: Consultant[], filename: string) {
  const header = ['first_name', 'last_name', 'email', 'phone', 'technology', 'title', 'seniority', 'visa_status', 'stage', 'decision_maker'];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((c) =>
    [c.firstName, c.lastName, c.email, c.phone, c.technology, c.title, c.seniority, c.visaStatus, c.stage, c.decisionMaker]
      .map(escape)
      .join(',')
  );
  const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}
