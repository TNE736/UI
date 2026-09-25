'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, UploadCloud } from 'lucide-react';
import type { Breakdowns, Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { useLive } from '@/lib/live';
import { percent, relativeTime } from '@/lib/format';
import { STAGE_META } from '@/lib/stages';
import { PageHeader, pillPrimary } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedNumber } from '@/components/ui/Number';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Tile } from '@/components/overview/Tile';
import { StageRibbon } from '@/components/overview/StageRibbon';
import { RateRing } from '@/components/overview/RateRing';
import { StageStepper } from '@/components/overview/StageStepper';

/**
 * Bento layout, 12 columns. One hero tile carries the headline figure; the
 * rest step down in size and weight so the eye has an order to follow:
 * total → approval rate → what to do next → the journey → the details.
 */
export default function OverviewPage() {
  const overview = useResource<Overview>('/api/overview');
  const breakdowns = useResource<Breakdowns>('/api/breakdowns');
  const { status } = useLive();
  const data = overview.data;
  const total = data?.total ?? 0;
  const awaitingReview = data ? Math.max(total - data.decisionMakers, 0) : 0;

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Live pipeline"
        title="Pipeline"
        accent="overview."
        description={data ? `Updated ${relativeTime(data.generatedAt)} · refreshes live` : 'Reading MongoDB…'}
        actions={
          <Link href="/upload" className={pillPrimary}>
            <UploadCloud className="h-4 w-4" /> Upload CSV
          </Link>
        }
      />

      {overview.error && (
        <div className="mb-6">
          <ErrorBanner message={overview.error} />
        </div>
      )}

      <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ── Hero: the headline figure and where everyone is ── */}
        <Tile
          tone="ink"
          label="Consultants in the pipeline"
          aside={
            <span className="flex items-center gap-2 text-[12px] text-on-ink-muted">
              <span className="live-dot relative h-1.5 w-1.5 rounded-full bg-accent-2 text-accent-2" />
              {status === 'live' ? 'Live' : 'Polling'}
            </span>
          }
          className="lg:col-span-8"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--accent-2)' }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <p className="font-display text-[88px] font-semibold leading-[0.95] tracking-[-0.04em] sm:text-[104px]">
              {data ? <AnimatedNumber value={total} /> : <span className="block h-24 w-48 animate-pulse rounded-2xl bg-white/10" />}
            </p>
            <dl className="grid grid-cols-3 gap-8 pb-3">
              {[
                ['Decision makers', data?.decisionMakers ?? 0],
                ['Emailed', data?.reached.emailed ?? 0],
                ['Opted out', data?.optedOut ?? 0],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[11.5px] text-on-ink-faint">{label}</dt>
                  <dd className="font-display mt-1 text-[28px] font-semibold leading-none">
                    <AnimatedNumber value={value as number} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mt-9">{data && <StageRibbon byStage={data.byStage} total={total} />}</div>
        </Tile>

        {/* ── The approval rate ── */}
        <Tile
          label="Approved for outreach"
          aside={
            <Link href="/consultants" className="press text-muted transition-colors duration-150 hover:text-ink" aria-label="Open consultants">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
          className="items-center justify-center lg:col-span-4"
        >
          {data ? (
            <RateRing
              rate={total ? data.decisionMakers / total : 0}
              caption={`${data.decisionMakers} of ${total} marked as decision makers`}
            />
          ) : (
            <Skeleton className="h-[168px] w-[168px] rounded-full" />
          )}
        </Tile>

        {/* ── What to do next ── */}
        <Tile tone="soft" label="Next step" className="justify-between lg:col-span-4">
          <p className="font-display text-[30px] font-semibold leading-[1.1] text-ink">
            {data ? (
              awaitingReview > 0 ? (
                <>
                  <AnimatedNumber value={awaitingReview} /> consultants are{' '}
                  <em className="font-medium italic text-accent">waiting</em> for review.
                </>
              ) : (
                <>
                  Everyone has been <em className="font-medium italic text-accent">reviewed.</em>
                </>
              )
            ) : (
              <span className="block h-20 w-full animate-pulse rounded-xl bg-white/50" />
            )}
          </p>
          <div className="mt-8">
            <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
              Mark decision makers in Compass and bench-outreach emails them a matching role.
            </p>
            <Link href="/consultants" className={pillPrimary}>
              Review consultants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Tile>

        {/* ── The journey, station by station ── */}
        <Tile
          label="Journey"
          aside={
            <Link href="/funnel" className="press flex items-center gap-1 text-[12.5px] text-muted transition-colors duration-150 hover:text-ink">
              Funnel <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          className="lg:col-span-8"
        >
          {data ? (
            <>
              <StageStepper reached={data.reached} total={total} />
              <p className="mt-6 border-t border-line pt-5 text-[13.5px] text-muted">
                {percent(data.reached.emailed ?? 0, total, 1)} of consultants have been emailed ·{' '}
                {percent(data.reached.qualified ?? 0, total, 1)} have qualified. Percentages between stations show how many
                continued from the stage before.
              </p>
            </>
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </Tile>

        {/* ── Details row: three smaller tiles of different widths ── */}
        <Tile label="Top technologies" className="lg:col-span-5">
          {breakdowns.data ? (
            <ul className="space-y-4">
              {breakdowns.data.technology.slice(0, 5).map((row, index) => {
                const max = breakdowns.data!.technology[0]?.count || 1;
                return (
                  <li key={row.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="flex items-baseline gap-3">
                        <span className="font-display w-5 text-[13px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-[14px] font-medium text-ink">{row.label}</span>
                      </span>
                      <span className="text-[13px] tabular-nums text-muted">
                        {row.count} <span className="text-faint">· {percent(row.count, total)}</span>
                      </span>
                    </div>
                    <div className="ml-8 h-[3px] overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full origin-left rounded-full bg-accent transition-transform duration-[250ms] ease-out"
                        style={{ transform: `scaleX(${row.count / max})` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </Tile>

        <Tile label="Newest" className="lg:col-span-4">
          {data ? (
            <ul className="-mx-2 space-y-1">
              {data.recent.slice(0, 5).map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/journey?id=${person.id}`}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors duration-150 hover:bg-surface-2"
                  >
                    <Avatar name={person.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{person.name}</span>
                      <span className="block truncate text-[12px] text-faint">
                        {person.title ?? person.technology ?? person.email}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: STAGE_META[person.stage].color }} title={STAGE_META[person.stage].label} />
                      <span className="text-[11px] tabular-nums text-faint">{relativeTime(person.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </Tile>

        <Tile label="Activity" className="lg:col-span-3">
          <div className="-mx-7 -mb-7 flex-1">
            <ActivityFeed />
          </div>
        </Tile>
      </div>
    </>
  );
}
