'use client';

import type { BreakdownRow, Breakdowns } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { cn, percent } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DataStamp } from '@/components/ui/DataStamp';
import { BreakdownChart } from '@/components/charts/BreakdownChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart3 } from 'lucide-react';

const FIELDS: { key: keyof Breakdowns; label: string; noun: string }[] = [
  { key: 'technology', label: 'Technology', noun: 'technology' },
  { key: 'title', label: 'Title', noun: 'title' },
  { key: 'seniority', label: 'Seniority', noun: 'seniority level' },
  { key: 'visaStatus', label: 'Visa status', noun: 'visa status' },
];

const known = (rows: BreakdownRow[]) => rows.filter((r) => r.label !== 'Not set' && !r.label.startsWith('Other ('));
const notSet = (rows: BreakdownRow[]) => rows.find((r) => r.label === 'Not set')?.count ?? 0;

/**
 * Sentences computed from the breakdowns — each one is a direct reading of a
 * number on this page, nothing inferred or predicted.
 */
function storyFrom(data: Breakdowns, total: number): string[] {
  const lines: string[] = [];
  const tech = known(data.technology);
  const top = tech[0];
  if (top) {
    lines.push(`${top.label} is the largest group: ${top.count} of ${total} consultants (${percent(top.count, total)}).`);
    const top3 = tech.slice(0, 3).reduce((s, r) => s + r.count, 0);
    if (tech.length > 3) lines.push(`The top three technologies cover ${percent(top3, total)} of the bench.`);
  }
  const dm = data.technology.reduce((s, r) => s + r.decisionMakers, 0);
  if (dm) {
    const withDm = tech.filter((r) => r.decisionMakers > 0);
    lines.push(
      withDm.length === 1
        ? dm === 1
          ? `The only decision maker so far is in ${withDm[0]!.label}.`
          : `All ${dm} decision makers so far are in ${withDm[0]!.label}.`
        : `${dm} decision makers so far, spread across ${withDm.length} technologies.`
    );
  } else {
    lines.push('No one has been approved as a decision maker yet.');
  }
  const gaps = FIELDS.map((f) => ({ ...f, missing: notSet(data[f.key]) })).sort((a, b) => b.missing - a.missing);
  if (gaps[0] && gaps[0].missing) {
    lines.push(`${gaps[0].label} is the least complete field — missing for ${percent(gaps[0].missing, total)} of consultants.`);
  }
  const visa = known(data.visaStatus)[0];
  if (visa) lines.push(`The most common visa status is ${visa.label} (${visa.count}).`);
  return lines;
}

export default function InsightsPage() {
  const { data, error, fetching, updatedAt, retry } = useResource<Breakdowns>('/api/breakdowns');
  const total = data ? data.technology.reduce((sum, row) => sum + row.count, 0) : 0;
  const empty = data !== null && total === 0;

  return (
    <>
      <PageHeader
        index="06"
        eyebrow="Bench mix"
        title="Who is"
        accent="on the bench."
        description="Technology, title, seniority and visa mix, and how complete each field is."
      >
        <DataStamp updatedAt={updatedAt} fetching={fetching} onRefresh={retry} />
      </PageHeader>

      {error && (
        <div className="mb-5">
          <ErrorState title={data ? 'Showing the last good data' : 'Couldn’t read the breakdowns'} message={error} onRetry={retry} />
        </div>
      )}

      {empty ? (
        <Card>
          <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="Nothing to analyse yet" description="Upload a consultant CSV and the mix appears here." />
        </Card>
      ) : (
        <>
          {/* Story + completeness */}
          <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="relative overflow-hidden rounded-panel bg-ink p-7 text-on-ink shadow-glow lg:col-span-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                style={{ background: 'var(--accent-2)' }}
              />
              <p className="t-label relative text-on-ink-muted">Read from the data</p>
              {data ? (
                <ol className="relative mt-5 space-y-4">
                  {storyFrom(data, total).map((line, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="font-display pt-0.5 text-[14px] text-accent-2">{String(i + 1).padStart(2, '0')}</span>
                      <p className="font-display text-[19px] leading-snug sm:text-[21px]">{line}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="relative mt-5 space-y-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span key={i} className="block h-6 w-full animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" />
                  ))}
                </div>
              )}
            </section>

            <Card className="lg:col-span-5" eyebrow="Data quality" title="Field completeness" description="Share of consultants with each field filled in.">
              {data ? (
                <ul className="space-y-4">
                  {FIELDS.map(({ key, label }) => {
                    const filled = total - notSet(data[key]);
                    const share = total ? filled / total : 0;
                    return (
                      <li key={key}>
                        <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                          <span className="font-medium text-ink">{label}</span>
                          <span className="num text-muted">
                            <span className="font-semibold text-ink">{percent(filled, total)}</span> · {filled}/{total}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className={cn(
                              'h-full origin-left rounded-full transition-transform duration-500 ease-out',
                              share >= 0.9 ? 'bg-accent' : share >= 0.5 ? 'bg-accent-2' : 'bg-warning'
                            )}
                            style={{ transform: `scaleX(${share})` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </Card>
          </div>

          {/* Rankings */}
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card className="rise" eyebrow="Ranking" title="Technology" description="Decision makers in forest green, everyone else in sage.">
              {data ? <BreakdownChart rows={data.technology} /> : <Skeleton className="h-64 w-full" />}
            </Card>
            <Card className="rise" eyebrow="Ranking" title="Title" description="The role each consultant holds today.">
              {data ? <BreakdownChart rows={data.title} /> : <Skeleton className="h-64 w-full" />}
            </Card>
          </div>

          {/* Shares + approval rate */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <Card className="rise lg:col-span-6 xl:col-span-4" eyebrow="Share" title="Seniority">
              {data ? <DonutChart rows={data.seniority} centerLabel="people" /> : <Skeleton className="h-48 w-full" />}
            </Card>
            <Card className="rise lg:col-span-6 xl:col-span-4" eyebrow="Share" title="Visa status">
              {data ? <DonutChart rows={data.visaStatus} centerLabel="people" /> : <Skeleton className="h-48 w-full" />}
            </Card>
            <Card className="rise lg:col-span-12 xl:col-span-4" eyebrow="Approval" title="Decision-maker rate" description="By technology, largest groups first.">
              {data ? (
                <table className="w-full text-[13px]">
                  <thead className="text-left text-[11.5px] text-faint">
                    <tr>
                      <th className="pb-2 font-medium">Technology</th>
                      <th className="pb-2 text-right font-medium">Approved</th>
                      <th className="pb-2 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {known(data.technology)
                      .slice(0, 7)
                      .map((row) => (
                        <tr key={row.label}>
                          <td className="max-w-[140px] truncate py-2 text-ink" title={row.label}>
                            {row.label}
                          </td>
                          <td className="num py-2 text-right text-muted">
                            {row.decisionMakers}/{row.count}
                          </td>
                          <td className={cn('num py-2 text-right font-semibold', row.decisionMakers ? 'text-accent' : 'text-faint')}>
                            {percent(row.decisionMakers, row.count)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <Skeleton className="h-48 w-full" />
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
