import { Check, XCircle } from 'lucide-react';
import { PROGRESS_STAGES, STAGE_META, isClosing, progressIndex, type Stage } from '@/lib/stages';
import { cn } from '@/lib/format';

/** A consultant's path through the pipeline. Closing stages end it early. */
export function JourneyTimeline({ stage }: { stage: Stage }) {
  const closed = isClosing(stage);
  const reachedIndex = progressIndex(stage);

  return (
    <ol className="relative">
      {PROGRESS_STAGES.map((step, index) => {
        const reached = index <= reachedIndex;
        const current = !closed && index === reachedIndex;
        const { label, description } = STAGE_META[step];
        const isLast = index === PROGRESS_STAGES.length - 1;
        return (
          <li key={step} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px"
                style={{ background: reached && index < reachedIndex ? 'var(--ink)' : 'var(--line-strong)' }}
              />
            )}
            {/* Ink for reached steps, the accent for where they are now. */}
            <span
              className={cn(
                'relative z-10 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border',
                current
                  ? 'border-transparent bg-accent text-on-accent shadow-[0_0_0_4px_var(--accent-soft)]'
                  : reached
                    ? 'border-transparent bg-ink text-on-ink'
                    : 'border-line-strong bg-surface-2 text-faint'
              )}
            >
              {reached ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-[13.5px] font-medium', reached ? 'text-fg' : 'text-faint')}>
                {label}
                {current && (
                  <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    Current
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[12.5px] text-faint">{description}</p>
            </div>
          </li>
        );
      })}

      {closed && (
        <li className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px]">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: STAGE_META[stage].color }} />
          <span>
            <span className="font-medium text-fg">Closed as {STAGE_META[stage].label.toLowerCase()}</span>
            <span className="block text-faint">{STAGE_META[stage].description}</span>
          </span>
        </li>
      )}
    </ol>
  );
}
