import { AlertTriangle, Inbox } from 'lucide-react';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rise flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-[13px]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <p className="text-fg">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon = <Inbox className="h-5 w-5" />,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-2 text-muted">
        {icon}
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-muted">{description}</p>}
    </div>
  );
}
