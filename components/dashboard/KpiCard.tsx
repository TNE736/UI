import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/Number';

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  /** CSS gradient for the card background (use the --grad-* tokens). */
  gradient: string;
  /** 0–1: fills the bar at the bottom of the card. */
  share?: number;
  caption?: string;
}

/** A vivid gradient card with a rolling number (NumberFlow) and a progress bar. */
export function KpiCard({ label, value, icon: Icon, gradient, share, caption }: KpiCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_18px_40px_-20px_rgb(60_40_180_/_0.55)]"
      style={{ background: gradient }}
    >
      <span aria-hidden className="hero-orb -right-10 -top-12 h-36 w-36 bg-white opacity-25" />
      <span aria-hidden className="hero-dots pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative flex items-center justify-between">
        <p className="text-[13px] font-medium text-white/85">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="relative mt-3 h-10 text-[38px] font-semibold leading-none tracking-[-0.03em]">
        {value === null ? <span className="block h-9 w-20 animate-pulse rounded-lg bg-white/25" /> : <AnimatedNumber value={value} />}
      </div>
      <p className="relative mt-2 h-4 text-[12.5px] text-white/80">{caption}</p>

      {share !== undefined && (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/25">
          {/* transform, not width: GPU-only, retargets smoothly when data changes. */}
          <div
            className="h-full origin-left rounded-full bg-white shadow-[0_0_12px_rgb(255_255_255_/_0.8)] transition-transform duration-[250ms] ease-out"
            style={{ transform: `scaleX(${Math.min(Math.max(share, 0), 1)})` }}
          />
        </div>
      )}
    </div>
  );
}
