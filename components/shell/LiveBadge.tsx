'use client';

import { useLive, type LiveStatus } from '@/lib/live';
import { cn } from '@/lib/format';

const META: Record<LiveStatus, { label: string; color: string; hint: string }> = {
  live: { label: 'Live', color: 'text-success', hint: 'Connected to the live-updates gateway' },
  connecting: { label: 'Connecting', color: 'text-warning', hint: 'Reaching the live-updates gateway on port 4100' },
  offline: {
    label: 'Offline',
    color: 'text-danger',
    hint: 'Live-updates gateway unreachable; data still refreshes every 15 s',
  },
};

export function LiveBadge({ className }: { className?: string }) {
  const { status } = useLive();
  const { label, color, hint } = META[status];
  return (
    <div className={cn('flex items-center gap-2 text-[12px] text-muted', className)} title={hint}>
      <span className={cn('relative h-2 w-2 rounded-full bg-current', color, status === 'live' && 'live-dot')} />
      <span>{label}</span>
    </div>
  );
}
