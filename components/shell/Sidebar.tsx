'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/format';
import { NAV, findNav } from './nav';
import { LiveBadge } from './LiveBadge';

/**
 * Navigation is used tens of times a day, so the active state changes
 * instantly: no sliding indicator (frequency rule).
 */
export function Sidebar() {
  const active = findNav(usePathname());
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/60 bg-white/70 px-3 py-4 shadow-[8px_0_30px_-24px_rgb(60_50_180_/_0.35)] backdrop-blur-xl lg:flex">
      <Link href="/" className="press mb-6 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white shadow-glow" style={{ background: 'var(--grad-brand)' }}>
          L
        </span>
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold tracking-tight">LeadOps Studio</span>
          <span className="block text-[11px] text-faint">Consultant pipeline</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = active?.href === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'press group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium',
                'transition-colors duration-150 ease-out',
                isActive
                  ? 'text-white shadow-[0_8px_20px_-8px_rgb(92_70_255_/_0.7)]'
                  : 'text-muted hover:bg-accent-soft hover:text-fg'
              )}
              style={isActive ? { background: 'var(--grad-brand)' } : undefined}
            >
              <Icon
                className={cn('h-[17px] w-[17px]', isActive ? 'text-white' : 'text-faint group-hover:text-accent')}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="press flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
        >
          Classic dashboard
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <LiveBadge className="px-3" />
      </div>
    </aside>
  );
}
