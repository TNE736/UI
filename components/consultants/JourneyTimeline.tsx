'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check, XCircle } from 'lucide-react';
import type { Consultant } from '@/lib/types';
import { PROGRESS_STAGES, STAGE_META, isClosing, progressIndex, type ProgressStage } from '@/lib/stages';
import { cn } from '@/lib/format';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Which system moves a consultant into each stage (from the LeadOps flow). */
const SOURCE: Record<ProgressStage, string> = {
  loaded: 'CSV upload · ingest API',
  emailed: 'Email Agent · bench-outreach',
  engaged: 'Consultant reply',
  researched: 'bench-outreach',
  followed_up: 'bench-outreach',
  qualified: 'bench-outreach',
  handed_off: 'Bench TA team',
};

type Consult = Pick<Consultant, 'stage' | 'createdAt' | 'emailStatus'>;

/**
 * A consultant's path, stage by stage: status, source and time. Only "Loaded"
 * has a real timestamp (the record's creation); MongoDB keeps no per-stage
 * history, so later steps say so instead of guessing.
 *
 * `animate` replays a quick progression (rail fills, steps rise in order,
 * ≈ 500 ms total) — used when a consultant is picked in the Journey explorer.
 */
export function JourneyTimeline({
  consultant,
  animate = false,
  compact = false,
}: {
  consultant: Consult;
  animate?: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  const { stage } = consultant;
  const closed = isClosing(stage);
  const reachedIndex = progressIndex(stage);
  const fill = reachedIndex / (PROGRESS_STAGES.length - 1);

  return (
    <ol className="relative">
      {/* Rail + fill (transform only). */}
      <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-px bg-line-strong" />
      <motion.span
        aria-hidden
        className="absolute left-[13px] top-3 w-px origin-top bg-ink"
        style={{ height: 'calc(100% - 24px)' }}
        initial={play ? { scaleY: 0 } : false}
        animate={{ scaleY: fill }}
        transition={{ duration: play ? 0.5 : 0.3, ease: EASE_OUT }}
      />

      {PROGRESS_STAGES.map((step, index) => {
        const reached = index <= reachedIndex;
        const current = !closed && index === reachedIndex;
        const { label, description } = STAGE_META[step];
        const time =
          step === 'loaded'
            ? new Date(consultant.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
            : reached
              ? 'Time not recorded'
              : null;
        const status = current ? 'Current' : reached ? 'Done' : closed && index > reachedIndex ? 'Not reached' : 'Upcoming';
        return (
          <motion.li
            key={step}
            className={cn('relative flex gap-4', compact ? 'pb-4' : 'pb-6', 'last:pb-0')}
            initial={play ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT, delay: play ? index * 0.06 : 0 }}
          >
            <span
              className={cn(
                'relative z-10 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border transition-colors duration-200',
                current
                  ? 'border-transparent bg-accent text-on-ink shadow-[0_0_0_4px_var(--accent-soft)]'
                  : reached
                    ? 'border-transparent bg-ink text-on-ink'
                    : 'border-line-strong bg-surface text-faint'
              )}
            >
              {reached ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={cn('text-[13.5px] font-semibold', reached ? 'text-ink' : 'text-faint')}>{label}</p>
                <span
                  className={cn(
                    'rounded-full px-2 py-px text-[10.5px] font-semibold uppercase tracking-[0.08em]',
                    current ? 'bg-accent-soft text-accent' : reached ? 'bg-surface-2 text-muted' : 'text-faint'
                  )}
                >
                  {status}
                </span>
              </div>
              <p className={cn('mt-0.5 text-[12.5px]', reached ? 'text-muted' : 'text-faint')}>{description}</p>
              {!compact && reached && (
                <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-faint">
                  <span>{SOURCE[step]}</span>
                  {time && <span className="num">{time}</span>}
                  {step === 'emailed' && consultant.emailStatus && <span>Status: {consultant.emailStatus.toLowerCase()}</span>}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}

      {closed && (
        <motion.li
          className="mt-5 flex items-start gap-3 rounded-field bg-surface-2 px-3.5 py-3 text-[13px] ring-1 ring-line"
          initial={play ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT, delay: play ? 0.45 : 0 }}
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: STAGE_META[stage].color }} />
          <span>
            <span className="font-semibold text-ink">Closed as {STAGE_META[stage].label.toLowerCase()}</span>
            <span className="block text-muted">{STAGE_META[stage].description}</span>
          </span>
        </motion.li>
      )}
    </ol>
  );
}
