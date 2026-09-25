import type { LucideIcon } from 'lucide-react';

/** Each page gets its own gradient from one family (violet → blue → pink → teal). */
export const HERO_TONES = {
  brand: { background: 'var(--grad-brand)', orbA: '#f0abfc', orbB: '#67e8f9' },
  violet: { background: 'linear-gradient(120deg, #8b5cf6 0%, #6d4aff 50%, #4f46e5 100%)', orbA: '#f9a8d4', orbB: '#a5b4fc' },
  ocean: { background: 'linear-gradient(120deg, #4f46e5 0%, #3b82f6 55%, #06b6d4 100%)', orbA: '#c4b5fd', orbB: '#67e8f9' },
  sunset: { background: 'linear-gradient(120deg, #7c3aed 0%, #c026d3 55%, #f43f5e 100%)', orbA: '#fda4af', orbB: '#fcd34d' },
  teal: { background: 'linear-gradient(120deg, #0f766e 0%, #0ea5a4 45%, #3b82f6 100%)', orbA: '#99f6e4', orbB: '#bfdbfe' },
} as const;
export type HeroTone = keyof typeof HERO_TONES;

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  tone?: HeroTone;
  /** Extra content under the text, e.g. headline figures. */
  children?: React.ReactNode;
}

/**
 * The gradient banner at the top of every page. Purely static decoration —
 * nothing in it moves except the one-time entrance.
 */
export function PageHeader({ title, description, actions, eyebrow, icon: Icon, tone = 'brand', children }: PageHeaderProps) {
  const { background, orbA, orbB } = HERO_TONES[tone];
  return (
    <section
      className="rise relative mb-6 overflow-hidden rounded-3xl px-6 py-7 text-white shadow-[0_24px_60px_-28px_rgb(76_52_220_/_0.6)] sm:px-8 sm:py-8"
      style={{ background }}
    >
      <span aria-hidden className="hero-orb -right-16 -top-24 h-64 w-64 opacity-60" style={{ background: orbA }} />
      <span aria-hidden className="hero-orb -bottom-28 right-40 h-56 w-56 opacity-40" style={{ background: orbB }} />
      <span aria-hidden className="hero-dots pointer-events-none absolute inset-0" />

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-2xl">
          {(eyebrow || Icon) && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-medium tracking-wide ring-1 ring-white/25 backdrop-blur">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {eyebrow}
            </p>
          )}
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">{title}</h1>
          {description && <p className="mt-2 text-[14.5px] leading-relaxed text-white/85">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="relative mt-6">{children}</div>}
    </section>
  );
}

/** A bright chip for figures inside a hero banner. */
export function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/14 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
      <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}

/** White call-to-action for use on a gradient banner. */
export const heroButtonClass =
  'press inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#4b32d6] shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.35)] transition-[box-shadow] duration-150 ease-out hover:shadow-[0_10px_30px_-8px_rgb(0_0_0_/_0.45)]';
