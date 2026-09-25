import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/Number';
import { Skeleton } from '@/components/ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  color: string;
  /** 0–1: fills the bar at the bottom of the card. */
  share?: number;
  caption?: string;
}

export function KpiCard({ label, value, icon: Icon, color, share, caption }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card">
      {/* Soft colour wash in the corner — static, decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.16] blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.03em] text-fg">
        {value === null ? <Skeleton className="h-9 w-20" /> : <AnimatedNumber value={value} />}
      </div>
      <p className="mt-2 h-4 text-[12px] text-faint">{caption}</p>

      {share !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3">
          {/* transform, not width: GPU-only, retargets smoothly when data changes. */}
          <div
            className="h-full origin-left rounded-full transition-transform duration-[250ms] ease-[var(--ease-out)]"
            style={{ background: color, transform: `scaleX(${Math.min(Math.max(share, 0), 1)})` }}
          />
        </div>
      )}
    </div>
  );
}
