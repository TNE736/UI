'use client';

import { RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLive } from '@/lib/live';
import { cn, relativeTime } from '@/lib/format';

/**
 * Where the numbers came from and how fresh they are: source, the time of the
 * last successful fetch, live or polling, and a refresh control.
 */
export function DataStamp({
  updatedAt,
  fetching,
  onRefresh,
  source = 'MongoDB',
  className,
}: {
  updatedAt: Date | null;
  fetching?: boolean;
  onRefresh?: () => void;
  source?: string;
  className?: string;
}) {
  const { status } = useLive();
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted', className)}>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn('relative h-1.5 w-1.5 rounded-full', status === 'live' ? 'live-dot bg-success text-success' : 'bg-faint')}
        />
        {status === 'live' ? 'Live' : 'Polling every 15 s'}
      </span>
      <span aria-hidden className="h-3 w-px bg-line-strong" />
      <span>
        {source} · {updatedAt ? `updated ${relativeTime(updatedAt.toISOString())}` : 'loading…'}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh"
          className="press grid h-7 w-7 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-ink"
        >
          <RotateCw className={cn('h-3.5 w-3.5', fetching && 'animate-spin motion-reduce:animate-none')} />
        </button>
      )}
    </div>
  );
}
