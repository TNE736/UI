import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * Error state: what happened, what to do. Raw error text stays out of the
 * headline; it's available (collapsed) for whoever needs to debug.
 */
export function ErrorState({
  title = 'Unable to load this data.',
  message,
  onRetry,
  className,
}: {
  title?: string;
  /** The underlying error text, shown collapsed under "Details". */
  message?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  const hint = message?.toLowerCase().includes('mongo')
    ? 'MongoDB is not reachable. Check that the database and the WSL relay are running.'
    : 'The service did not respond. It may be starting up or offline.';
  return (
    <div
      role="alert"
      className={cn(
        'rise flex flex-wrap items-start gap-4 rounded-panel bg-danger-soft px-5 py-4 shadow-[inset_0_0_0_1px_rgb(180_35_24_/_0.14)]',
        className
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface text-danger shadow-card">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted">{hint}</p>
        {message && (
          <details className="mt-2 text-[12px] text-faint">
            <summary className="cursor-pointer select-none hover:text-muted">Details</summary>
            <p className="mt-1 break-words font-mono">{message}</p>
          </details>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="press inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink transition-colors duration-150 hover:border-ink/40"
        >
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

/** Backwards-compatible alias used by older call sites. */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <ErrorState message={message} onRetry={onRetry} />;
}

/** Empty state: an invitation, not an apology. */
export function EmptyState({
  title,
  description,
  icon = <Inbox className="h-5 w-5" />,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-4">
        <span aria-hidden className="absolute inset-0 -m-3 rounded-full bg-accent-soft" />
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-surface text-accent shadow-card">
          {icon}
        </span>
      </div>
      <p className="font-display text-[19px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
