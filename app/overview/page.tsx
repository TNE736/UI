'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BadgeCheck, MailCheck, UploadCloud, UserCheck, Users } from 'lucide-react';
import type { Breakdowns, Consultant, Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { percent, relativeTime } from '@/lib/format';
import { PageHeader, pillPrimary } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { StagePill } from '@/components/ui/StagePill';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { FunnelBars } from '@/components/dashboard/FunnelBars';
import { StageDonut } from '@/components/dashboard/StageDonut';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ConsultantSheet } from '@/components/consultants/ConsultantSheet';

export default function OverviewPage() {
  const overview = useResource<Overview>('/api/overview');
  const breakdowns = useResource<Breakdowns>('/api/breakdowns');
  const [selected, setSelected] = useState<Consultant | null>(null);
  const data = overview.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Live pipeline"
        title="Pipeline"
        accent="overview."
        description={
          data ? (
            <>
              {total} consultants in MongoDB · updated {relativeTime(data.generatedAt)}
            </>
          ) : (
            'Live view of the consultant outreach pipeline.'
          )
        }
        actions={
          <Link href="/upload" className={pillPrimary}>
            <UploadCloud className="h-4 w-4" /> Upload CSV
          </Link>
        }
      />

      {overview.error && (
        <div className="mb-5">
          <ErrorBanner message={overview.error} />
        </div>
      )}

      {/* KPI row — staggered 40 ms apart on first paint only. */}
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard featured label="Consultants" value={data ? total : null} icon={Users} caption="Everyone in the pipeline" />
        <KpiCard
          label="Decision makers"
          value={data?.decisionMakers ?? null}
          icon={UserCheck}
          share={total ? (data?.decisionMakers ?? 0) / total : 0}
          caption={data ? `${percent(data.decisionMakers, total)} approved for outreach` : undefined}
        />
        <KpiCard
          label="Emailed"
          value={data?.reached.emailed ?? null}
          icon={MailCheck}
          share={total ? (data?.reached.emailed ?? 0) / total : 0}
          caption={data ? `${percent(data.reached.emailed ?? 0, total)} reached by email` : undefined}
        />
        <KpiCard
          label="Qualified"
          value={data?.reached.qualified ?? null}
          icon={BadgeCheck}
          share={total ? (data?.reached.qualified ?? 0) / total : 0}
          caption={data ? `${percent(data.reached.qualified ?? 0, total, 1)} conversion` : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card
          className="rise xl:col-span-3"
          eyebrow="Conversion"
          title="Pipeline funnel"
          description="How many consultants reached each stage or went past it."
          actions={
            <Link href="/funnel" className="press inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-fg">
              Details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {data ? <FunnelBars reached={data.reached} total={total} /> : <ListSkeleton rows={7} />}
        </Card>

        <Card className="rise xl:col-span-2" eyebrow="Right now" title="Where everyone is" description="Current stage, including closed.">
          {data ? <StageDonut byStage={data.byStage} total={total} /> : <Skeleton className="mx-auto h-48 w-48 rounded-full" />}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rise" eyebrow="Mix" title="Top technologies" flush>
          <div className="px-5 pb-5">
            {breakdowns.data ? (
              <TopList rows={breakdowns.data.technology.slice(0, 6)} total={total} />
            ) : (
              <ListSkeleton rows={6} />
            )}
          </div>
        </Card>

        <Card className="rise" eyebrow="Newest" title="Recently added" flush>
          {data ? (
            <ul className="divide-y divide-line border-t border-line">
              {data.recent.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(person)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-150 hover:bg-surface-2"
                  >
                    <Avatar name={person.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-fg">{person.name}</span>
                      <span className="block truncate text-[12px] text-faint">{person.technology ?? person.email}</span>
                    </span>
                    <StagePill stage={person.stage} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 pb-5">
              <ListSkeleton rows={6} />
            </div>
          )}
        </Card>

        <Card className="rise" eyebrow="Live" title="Activity" flush>
          <div className="border-t border-line">
            <ActivityFeed />
          </div>
        </Card>
      </div>

      <ConsultantSheet consultant={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function TopList({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="space-y-3 border-t border-line pt-4">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]">
            <span className="truncate text-fg">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {row.count} <span className="text-faint">{percent(row.count, total)}</span>
            </span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full origin-left rounded-full bg-accent transition-transform duration-[250ms] ease-out"
              style={{ transform: `scaleX(${row.count / max})` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}
