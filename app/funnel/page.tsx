'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { Mail, TrendingDown, Trophy, UserCheck } from 'lucide-react';
import type { Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { PROGRESS_STAGES, STAGE_META, type ProgressStage } from '@/lib/stages';
import { cn, percent } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { AnimatedNumber } from '@/components/ui/Number';
import { DataStamp } from '@/components/ui/DataStamp';
import { EmailStatus } from '@/components/overview/EmailStatus';
import { ClosedPaths } from '@/components/overview/ClosedPaths';

interface Step {
  stage: ProgressStage;
  count: number;
  previous: number;
  dropped: number;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function FunnelPage() {
  const { data, error, fetching, updatedAt, retry } = useResource<Overview>('/api/overview');
  const [hover, setHover] = useState<ProgressStage | null>(null);

  const steps: Step[] = data
    ? PROGRESS_STAGES.map((stage, index) => {
        const count = data.reached[stage] ?? 0;
        const previous = index === 0 ? data.total : (data.reached[PROGRESS_STAGES[index - 1]!] ?? 0);
        return { stage, count, previous, dropped: Math.max(previous - count, 0) };
      })
    : [];
  // Biggest leak between two consecutive stages (ignoring the first step, which is everyone).
  const worst = steps
    .slice(1)
    .reduce<Step | null>(
      (w, step) => (step.previous && (!w || step.count / step.previous < w.count / w.previous) ? step : w),
      null
    );
  const worstFrom = worst ? PROGRESS_STAGES[PROGRESS_STAGES.indexOf(worst.stage) - 1]! : null;

  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Conversion"
        title="Where people"
        accent="drop off."
        description="Each band counts consultants who reached that stage or went further. The narrowing between bands is the drop-off."
      >
        <DataStamp updatedAt={updatedAt} fetching={fetching} onRefresh={retry} />
      </PageHeader>

      {error && (
        <div className="mb-5">
          <ErrorState title={data ? 'Showing the last good data' : 'Couldn’t read the funnel'} message={error} onRetry={retry} />
        </div>
      )}

      <div className="stagger mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-panel bg-line shadow-card xl:grid-cols-4">
        <Stat icon={UserCheck} label="Approved" value={data?.decisionMakers} hint={data && `${percent(data.decisionMakers, data.total)} of everyone`} />
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
          text={worst && worstFrom ? `${STAGE_META[worstFrom].label} → ${STAGE_META[worst.stage].label}` : data ? 'None yet' : undefined}
          hint={worst ? `${percent(worst.count, worst.previous)} continued · ${worst.dropped} stopped` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rise" eyebrow="Pipeline" title="Stage by stage" description="Hover a band for its numbers.">
          {!data ? (
            <div className="space-y-6">
              {PROGRESS_STAGES.map((stage) => (
                <Skeleton key={stage} className="mx-auto h-11 w-3/4" />
              ))}
            </div>
          ) : (
            <Funnel steps={steps} total={data.total} hover={hover} onHover={setHover} />
          )}
        </Card>

        <div className="space-y-5">
          <Card className="rise" eyebrow="Outreach" title="Email status" description="As written by the Email Agent.">
            {data ? <EmailStatus emailStatus={data.emailStatus} /> : <Skeleton className="h-40 w-full" />}
          </Card>
          <Card className="rise" eyebrow="Closed early" title="Left the pipeline">
            {data ? <ClosedPaths byStage={data.byStage} /> : <Skeleton className="h-40 w-full" />}
          </Card>
        </div>
      </div>
    </>
  );
}

/**
 * A real funnel: centred bands sized by share of everyone, joined by
 * trapezoids whose narrowing *is* the drop-off. Widths retarget smoothly when
 * the data changes (transform / path morph, 500 ms ease-out).
 */
function Funnel({
  steps,
  total,
  hover,
  onHover,
}: {
  steps: Step[];
  total: number;
  hover: ProgressStage | null;
  onHover: (stage: ProgressStage | null) => void;
}) {
  const width = (count: number) => (total ? Math.max((count / total) * 100, count ? 3 : 0.6) : 0.6);

  return (
    <ol onMouseLeave={() => onHover(null)}>
      {steps.map((step, index) => {
        const { label, color, description } = STAGE_META[step.stage];
        const w = width(step.count);
        const next = steps[index + 1];
        const dim = hover !== null && hover !== step.stage;
        return (
          <li key={step.stage}>
            <div
              className="grid grid-cols-[92px_1fr_76px] items-center gap-3 sm:grid-cols-[130px_1fr_120px]"
              onMouseEnter={() => onHover(step.stage)}
            >
              <span className={cn('text-[13px] font-medium transition-colors duration-150', dim ? 'text-faint' : 'text-ink')} title={description}>
                {label}
              </span>
              <div className="relative h-11">
                <motion.div
                  className="absolute inset-y-0 left-0 right-0 origin-center rounded-control"
                  style={{ background: color }}
                  initial={false}
                  animate={{ scaleX: w / 100, opacity: dim ? 0.45 : 1 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              </div>
              <span className="num text-right">
                <span className="text-[16px] font-semibold text-ink">
                  <AnimatedNumber value={step.count} />
                </span>
                <span className="ml-1.5 text-[12px] text-faint">{percent(step.count, total)}</span>
              </span>
            </div>

            {next && (
              <div className="grid grid-cols-[92px_1fr_76px] items-center gap-3 sm:grid-cols-[130px_1fr_120px]">
                <span />
                <div className="relative h-9">
                  <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                    <motion.path
                      initial={false}
                      animate={{
                        d: `M ${50 - w / 2} 0 L ${50 + w / 2} 0 L ${50 + width(next.count) / 2} 36 L ${50 - width(next.count) / 2} 36 Z`,
                      }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                      fill={STAGE_META[next.stage].color}
                      opacity={0.28}
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="num rounded-full bg-surface px-2.5 py-0.5 text-[11.5px] font-medium text-muted shadow-card">
                      {step.count ? percent(next.count, step.count, 1) : '—'} continued
                    </span>
                  </span>
                </div>
                <span className={cn('num text-right text-[11.5px]', step.count - next.count > 0 ? 'text-danger' : 'text-faint')}>
                  {step.count - next.count > 0 ? `−${step.count - next.count}` : step.count ? '0 lost' : '—'}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
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
    <div className="bg-surface p-5 sm:p-6">
      <p className="t-label flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </p>
      <div className="t-figure mt-4 min-h-9 text-[34px] text-ink">
        {!ready ? (
          <Skeleton className="h-8 w-24" />
        ) : text !== undefined ? (
          <span className="font-display text-[19px] font-semibold leading-tight tracking-normal">{text}</span>
        ) : (
          <AnimatedNumber value={value!} suffix={suffix} />
        )}
      </div>
      <p className="mt-1.5 min-h-4 text-[12px] text-faint">{hint || ''}</p>
    </div>
  );
}
