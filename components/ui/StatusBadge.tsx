import { cn } from '@/lib/format';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: 'bg-success-soft text-success', dot: 'bg-success text-success' },
  warning: { badge: 'bg-warning-soft text-warning', dot: 'bg-warning text-warning' },
  danger: { badge: 'bg-danger-soft text-danger', dot: 'bg-danger text-danger' },
  info: { badge: 'bg-info-soft text-info', dot: 'bg-info text-info' },
  neutral: { badge: 'bg-surface-2 text-muted', dot: 'bg-faint text-faint' },
};

/** A status chip: always a dot AND a word, never colour alone. */
export function StatusBadge({
  tone,
  children,
  pulse,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  /** A breathing dot, for states that are live right now. */
  pulse?: boolean;
  className?: string;
}) {
  const { badge, dot } = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium',
        badge,
        className
      )}
    >
      <span aria-hidden className={cn('relative h-1.5 w-1.5 rounded-full', dot, pulse && 'live-dot')} />
      {children}
    </span>
  );
}
