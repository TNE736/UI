import { cn } from '@/lib/format';

/** A calm placeholder: no shimmer sweeping across a dashboard every few seconds. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-3/70', className)} />;
}
