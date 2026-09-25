import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/Number';
import { cn } from '@/lib/format';

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  /** 0–1: fills the hairline bar at the bottom of the card. */
  share?: number;
  caption?: string;
  /** The headline figure: ink card with light text. Use once per row. */
  featured?: boolean;
  suffix?: string;
}

/** Editorial figure card: small caps label, large serif number (rolls with NumberFlow). */
export function KpiCard({ label, value, icon: Icon, share, caption, featured, suffix }: KpiCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px] p-6',
        featured ? 'bg-ink text-[#f5f2ed] shadow-glow' : 'bg-surface text-ink shadow-card'
      )}
    >
      {featured && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'var(--accent-2)' }}
        />
      )}
      <div className="relative flex items-center justify-between">
        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', featured ? 'text-[#d8d2c6]' : 'text-muted')}>
          {label}
        </p>
        <Icon className={cn('h-4 w-4', featured ? 'text-accent-2' : 'text-faint')} strokeWidth={1.75} />
      </div>

      <div className="font-display relative mt-5 min-h-[56px] text-[52px] font-semibold leading-[1.08]">
        {value === null ? (
          <span className={cn('block h-11 w-24 animate-pulse rounded-lg', featured ? 'bg-white/10' : 'bg-surface-3')} />
        ) : (
          <AnimatedNumber value={value} suffix={suffix} />
        )}
      </div>
      <p className={cn('relative mt-3 h-4 text-[13px]', featured ? 'text-[#bdb7ab]' : 'text-muted')}>{caption}</p>

      {share !== undefined && (
        <div className={cn('relative mt-5 h-[3px] overflow-hidden rounded-full', featured ? 'bg-white/15' : 'bg-surface-3')}>
          {/* transform, not width: GPU-only, retargets smoothly when data changes. */}
          <div
            className="h-full origin-left rounded-full bg-accent transition-transform duration-[250ms] ease-out"
            style={{ transform: `scaleX(${Math.min(Math.max(share, 0), 1)})` }}
          />
        </div>
      )}
    </div>
  );
}
