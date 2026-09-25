'use client';

import { useEffect, useState } from 'react';
import { PROGRESS_STAGES, STAGE_META } from '@/lib/stages';
import { cn, percent } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/Number';

/**
 * The seven stages as stations on a line. The line fills (transform, from the
 * left) up to the furthest stage anyone has reached; it fills once on first
 * paint and retargets smoothly if someone moves further. Between stations:
 * how many continued from the stage before.
 */
export function StageStepper({ reached, total }: { reached: Record<string, number>; total: number }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const furthest = PROGRESS_STAGES.reduce((last, stage, index) => ((reached[stage] ?? 0) > 0 ? index : last), -1);
  const fill = furthest <= 0 ? 0 : furthest / (PROGRESS_STAGES.length - 1);

  return (
    <div className="thin-scroll -mx-2 overflow-x-auto px-2 pb-1">
      <div className="relative min-w-[640px] pt-9">
        {/* Track and fill, running through the centre of the stations. */}
        <div className="absolute left-[7%] right-[7%] top-[calc(2.25rem+13px)] h-[2px] rounded-full bg-surface-3">
          <div
            className="h-full origin-left rounded-full bg-ink transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${drawn ? fill : 0})` }}
          />
        </div>

        <ol className="relative grid grid-cols-7">
          {PROGRESS_STAGES.map((stage, index) => {
            const count = reached[stage] ?? 0;
            const previous = index === 0 ? total : (reached[PROGRESS_STAGES[index - 1]!] ?? 0);
            const active = count > 0;
            return (
              <li key={stage} className="relative flex flex-col items-center text-center">
                {index > 0 && (
                  <span className="absolute -top-8 left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] tabular-nums text-muted">
                    {previous ? percent(count, previous) : '—'}
                  </span>
                )}
                <span
                  className={cn(
                    'relative z-10 grid h-[28px] w-[28px] place-items-center rounded-full border-2 text-[11px] font-semibold',
                    active ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface text-faint'
                  )}
                  title={STAGE_META[stage].description}
                >
                  {index + 1}
                </span>
                <p className={cn('font-display mt-3 text-[26px] font-semibold leading-none', active ? 'text-ink' : 'text-faint')}>
                  <AnimatedNumber value={count} />
                </p>
                <p className="mt-1.5 text-[12px] text-muted">{STAGE_META[stage].label}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
