import { cn } from '@/lib/format';

interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Remove body padding (tables, lists that run edge to edge). */
  flush?: boolean;
}

/** The one surface every panel sits on: hairline border + soft shadow, no heavy chrome. */
export function Card({ title, eyebrow, description, actions, flush, className, children, ...rest }: CardProps) {
  const hasHeader = title || eyebrow || description || actions;
  return (
    <section
      className={cn('relative rounded-[22px] bg-surface shadow-card', className)}
      {...rest}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="eyebrow">{eyebrow}</p>
            )}
            {title && <h2 className="font-display mt-1.5 text-[21px] font-semibold leading-tight text-ink">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-6', flush && hasHeader && 'mt-5')}>{children}</div>
    </section>
  );
}
