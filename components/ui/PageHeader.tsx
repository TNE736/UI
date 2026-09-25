interface PageHeaderProps {
  /** Words before the accent, e.g. "Pipeline". */
  title: string;
  /** The one italic, terracotta word that ends the headline, e.g. "overview". */
  accent?: string;
  eyebrow?: string;
  /** Section number shown before the eyebrow, e.g. "01". */
  index?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Editorial page header: a small numbered label with a hairline rule, a large
 * serif headline whose last word is set in italic terracotta, and a quiet
 * description. No colour blocks — the type carries it.
 */
export function PageHeader({ title, accent, eyebrow, index, description, actions, children }: PageHeaderProps) {
  return (
    <header className="rise mb-8">
      {eyebrow && (
        <p className="eyebrow mb-4">
          {index && <span className="font-display text-[13px] font-medium tracking-normal">{index}</span>}
          <span className="text-muted">{eyebrow}</span>
          <span aria-hidden className="h-px w-16 bg-line-strong" />
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-display text-[38px] font-semibold leading-[1.05] text-ink sm:text-[48px]">
            {title}
            {accent && (
              <>
                {' '}
                <em className="font-medium italic text-accent">{accent}</em>
              </>
            )}
          </h1>
          {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}

/** Pill buttons, as links or buttons. Ink for the main action, outline for the rest. */
export const pillPrimary =
  'press inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-medium text-[#f5f2ed] shadow-glow transition-[background-color] duration-150 ease-out hover:bg-[#2a2a27] disabled:cursor-not-allowed disabled:opacity-45';
export const pillSecondary =
  'press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[13.5px] font-medium text-ink transition-[border-color] duration-150 ease-out hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-45';
