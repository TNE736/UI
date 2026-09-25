import { STAGE_META, type Stage } from '@/lib/stages';
import { cn } from '@/lib/format';

/** Colour is never the only signal: every pill carries a dot AND its label. */
export function StagePill({ stage, className }: { stage: Stage; className?: string }) {
  const { label, color } = STAGE_META[stage];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap',
        className
      )}
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}
