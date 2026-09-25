'use client';

import { ArrowDown, Mail, TrendingDown, Trophy, UserCheck } from 'lucide-react';
import type { Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { CLOSING_STAGES, PROGRESS_STAGES, STAGE_META } from '@/lib/stages';
import { percent } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/States';
import { AnimatedNumber } from '@/components/ui/Number';
import { StagePill } from '@/components/ui/StagePill';

export default function FunnelPage() {
  const { data, error } = useResource<Overview>('/api/overview');

  const steps = data
    ? PROGRESS_STAGES.map((stage, index) => {
        const count = data.reached[stage] ?? 0;
        const previous = index === 0 ? data.total : (data.reached[PROGRESS_STAGES[index - 1]!] ?? 0);
        return { stage, count, previous, dropped: Math.max(previous - count, 0) };
      })
    : [];
  // Biggest leak between two consecutive stages (ignoring the first step, which is everyone).
  const worst = steps.slice(1).reduce<(typeof steps)[number] | null>(
    (worst, step) => (step.previous && (!worst || step.count / step.previous < worst.count / worst.previous) ? step : worst),
    null
  );
  const closedTotal = data ? CLOSING_STAGES.reduce((sum, stage) => sum + data.byStage[stage], 0) : 0;

  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Conversion"
        title="Where people"
        accent="drop off."
        description="Each bar counts consultants who reached that stage or went further. Arrows show how many continued from the stage before."
      />
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="stagger mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UserCheck} label="Decision makers" value={data?.decisionMakers} hint={data && percent(data.decisionMakers, data.total)} />
        <Stat icon={Mail} label="Emailed" value={data?.reached.emailed} hint={data && `${percent(data.reached.emailed ?? 0, data.total)} of everyone`} />
        <Stat
          icon={Trophy}
          label="Loaded → qualified"
          value={data ? Number((((data.reached.qualified ?? 0) / Math.max(data.total, 1)) * 100).toFixed(1)) : undefined}
          suffix="%"
          hint={data && `${data.reached.qualified ?? 0} of ${data.total}`}
        />
        <Stat
          icon={TrendingDown}
          label="Biggest drop-off"
          text={worst ? `${STAGE_META[PROGRESS_STAGES[PROGRESS_STAGES.indexOf(worst.stage) - 1]!].label} → ${STAGE_META[worst.stage].label}` : data ? 'None yet' : undefined}
          hint={worst ? `${percent(worst.count, worst.previous)} continued` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rise xl:col-span-2" eyebrow="Pipeline" title="Stage by stage">
          {!data ? (
            <div className="space-y-4">
              {PROGRESS_STAGES.map((stage) => (
                <Skeleton key={stage} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ol className="flex flex-col items-center">
              {steps.map(({ stage, count, previous, dropped }, index) => {
                const { label, color, description } = STAGE_META[stage];
                const share = data.total ? count / data.total : 0;
                return (
                  <li key={stage} className="w-full">
                    {index > 0 && (
                      <div className="flex items-center justify-center gap-2 py-1.5 text-[11.5px] text-faint">
                        <ArrowDown className="h-3 w-3" />
                        <span className="tabular-nums">{percent(count, previous, 1)} continued</span>
                        {dropped > 0 && <span className="tabular-nums text-danger/80">· {dropped} stopped</span>}
                      </div>
                    )}
                    <div className="grid grid-cols-[110px_1fr_90px] items-center gap-3 sm:grid-cols-[140px_1fr_110px]">
                      <span className="text-[13px] font-medium text-fg" title={description}>
                        {label}
                      </span>
                      <div className="relative h-11 overflow-hidden rounded-xl bg-surface-2">
                        {/* Scaled from the centre so the shape reads as a funnel. */}
                        <div
                          className="absolute inset-y-0 left-0 right-0 origin-center rounded-xl transition-transform duration-[250ms] ease-out"
                          style={{
                            transform: `scaleX(${Math.max(share, count ? 0.02 : 0)})`,
                            background: color,
                          }}
                        />
                      </div>
                      <span className="text-right tabular-nums">
                        <span className="text-[15px] font-semibold text-fg">
                          <AnimatedNumber value={count} />
                        </span>
                        <span className="ml-1.5 text-[12px] text-faint">{percent(count, data.total)}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="rise" eyebrow="Closed early" title="Left the pipeline" description={data ? `${closedTotal} consultants` : undefined}>
            <ul className="space-y-2.5">
              {CLOSING_STAGES.map((stage) => (
                <li key={stage} className="flex items-center justify-between gap-3">
                  <StagePill stage={stage} />
                  <span className="text-[13px] tabular-nums text-fg">{data ? data.byStage[stage] : '—'}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rise" eyebrow="Mailgun" title="Email status" description="From delivery and reply webhooks.">
            {data && Object.keys(data.emailStatus).length ? (
              <ul className="space-y-2.5">
                {Object.entries(data.emailStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      <span className="tabular-nums text-fg">{count}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[13px] text-faint">No emails sent yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  text,
  suffix,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  text?: string;
  suffix?: string;
  hint?: string | false | null;
}) {
  const ready = value !== undefined || text !== undefined;
  return (
    <div className="rounded-[22px] bg-surface p-6 shadow-card">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </p>
      <div className="font-display mt-4 min-h-10 text-[36px] font-semibold leading-none text-ink">
        {!ready ? <Skeleton className="h-8 w-24" /> : text !== undefined ? <span className="text-[21px]">{text}</span> : <AnimatedNumber value={value!} suffix={suffix} />}
      </div>
      <p className="mt-1 h-4 text-[12px] text-faint">{hint || ''}</p>
    </div>
  );
}
