'use client';

import { BarChart3 } from 'lucide-react';
import type { BreakdownRow, Breakdowns } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { percent } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/States';
import { BreakdownChart } from '@/components/charts/BreakdownChart';

const SECTIONS: { key: keyof Breakdowns; title: string; description: string }[] = [
  { key: 'technology', title: 'Technology', description: 'Primary skill of each consultant.' },
  { key: 'title', title: 'Title', description: 'The role they hold today.' },
  { key: 'seniority', title: 'Seniority', description: 'Experience level, where known.' },
  { key: 'visaStatus', title: 'Visa status', description: 'Work authorisation, where known.' },
];

export default function InsightsPage() {
  const { data, error } = useResource<Breakdowns>('/api/breakdowns');
  const total = data ? data.technology.reduce((sum, row) => sum + row.count, 0) : 0;

  return (
    <>
      <PageHeader
        tone="brand"
        icon={BarChart3}
        eyebrow="Bench mix"
        title="Insights"
        description="Who is on the bench. Each bar splits decision makers (green) from everyone else."
      />
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {data && (
        <div className="stagger mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SECTIONS.map(({ key, title }) => (
            <Leader key={key} label={`Top ${title.toLowerCase()}`} row={data[key].find((row) => row.label !== 'Not set')} total={total} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {SECTIONS.map(({ key, title, description }) => (
          <Card key={key} className="rise" eyebrow="Breakdown" title={title} description={description}>
            {data ? <BreakdownChart rows={data[key]} /> : <Skeleton className="h-64 w-full" />}
          </Card>
        ))}
      </div>
    </>
  );
}

function Leader({ label, row, total }: { label: string; row?: BreakdownRow; total: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card backdrop-blur">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--grad-brand)' }} />
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1.5 truncate bg-clip-text text-[17px] font-semibold tracking-tight text-transparent" style={{ backgroundImage: 'var(--grad-brand)' }} title={row?.label}>
        {row?.label ?? '—'}
      </p>
      <p className="mt-0.5 text-[12px] tabular-nums text-faint">
        {row ? `${row.count} people · ${percent(row.count, total)}` : 'No data yet'}
      </p>
    </div>
  );
}
