import { PROGRESS_STAGES, STAGE_META } from '@/lib/stages';
import { percent } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/Number';

interface FunnelBarsProps {
  /** Cumulative counts: how many reached each progress stage or beyond. */
  reached: Record<string, number>;
  total: number;
  /** Show conversion from the previous stage under each bar. */
  showConversion?: boolean;
}

/**
 * The pipeline as horizontal bars, widest (loaded) to narrowest (handed off).
 * Bars scale with transform from the left, so value changes retarget smoothly.
 */
export function FunnelBars({ reached, total, showConversion }: FunnelBarsProps) {
  return (
    <ol className="space-y-3">
      {PROGRESS_STAGES.map((stage, index) => {
        const count = reached[stage] ?? 0;
        const previous = index === 0 ? total : (reached[PROGRESS_STAGES[index - 1]!] ?? 0);
        const { label, color, description } = STAGE_META[stage];
        return (
          <li key={stage}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-2 font-medium text-fg" title={description}>
                <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
                {label}
              </span>
              <span className="tabular-nums text-muted">
                <span className="font-semibold text-fg">
                  <AnimatedNumber value={count} />
                </span>
                <span className="ml-2 text-faint">{percent(count, total)}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full origin-left rounded-full transition-transform duration-[250ms] ease-[var(--ease-out)]"
                style={{
                  transform: `scaleX(${total ? count / total : 0})`,
                  background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 70%, white))`,
                }}
              />
            </div>
            {showConversion && index > 0 && (
              <p className="mt-1 text-[11.5px] text-faint">
                {percent(count, previous, 1)} of {STAGE_META[PROGRESS_STAGES[index - 1]!].label.toLowerCase()} reached
                this stage
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
