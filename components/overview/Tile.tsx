import { cn } from '@/lib/format';

type Tone = 'plain' | 'ink' | 'soft';

const TONES: Record<Tone, string> = {
  plain: 'bg-surface text-ink shadow-card',
  ink: 'bg-ink text-on-ink shadow-glow',
  soft: 'bg-accent-soft text-ink shadow-[0_0_0_1px_rgb(47_107_79_/_0.12)_inset]',
};

interface TileProps {
  tone?: Tone;
  label?: React.ReactNode;
  /** Right side of the label row: a link, a live dot, a count. */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * One cell of the Overview bento grid. Generous padding, a small uppercase
 * label, and a quiet lift on hover (fine pointers only, via Tailwind v4's
 * hover variant) — the grid does the composing, not borders.
 */
export function Tile({ tone = 'plain', label, aside, className, children }: TileProps) {
  return (
    <section
      className={cn(
        'relative flex flex-col overflow-hidden rounded-[26px] p-7',
        'transition-shadow duration-200 ease-out',
        tone === 'plain' && 'hover:shadow-pop',
        TONES[tone],
        className
      )}
    >
      {(label || aside) && (
        <header className="relative mb-5 flex w-full items-center justify-between gap-3">
          {label && (
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.16em]',
                tone === 'ink' ? 'text-on-ink-muted' : 'text-muted'
              )}
            >
              {label}
            </p>
          )}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
