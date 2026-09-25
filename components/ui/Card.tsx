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
      className={cn('relative rounded-2xl border border-white/80 bg-white/90 shadow-card backdrop-blur', className)}
      {...rest}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
            )}
            {title && <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-fg">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-5', flush && hasHeader && 'mt-4')}>{children}</div>
    </section>
  );
}
