import { cn } from '@/lib/format';

/** A calm placeholder with a slow, soft sheen (off for reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  // No class merging here, so only add the default radius when none is given.
  return <div aria-hidden className={cn('skeleton', !className?.includes('rounded') && 'rounded-lg', className)} />;
}

/** Rows of placeholder lines, for lists and tables. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
