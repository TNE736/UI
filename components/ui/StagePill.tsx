import { STAGE_META, type Stage } from '@/lib/stages';
import { cn } from '@/lib/format';

/** Neutral chip; the stage colour lives only in the dot (colour is never the only signal). */
export function StagePill({ stage, className }: { stage: Stage; className?: string }) {
  const { label, color } = STAGE_META[stage];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[12px] font-medium text-ink',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}
