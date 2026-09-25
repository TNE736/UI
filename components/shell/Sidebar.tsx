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
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-[#f6f4ee]/80 px-4 py-5 backdrop-blur-xl lg:flex">
      <Link href="/" className="press mb-6 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
        <span className="leading-tight">
          <span className="font-display block text-[21px] font-semibold text-ink">
            LeadOps<span className="text-accent">.</span>
          </span>
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-faint">Studio</span>
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
                'press group relative flex items-center gap-3 rounded-full px-3.5 py-2 text-[13.5px] font-medium',
                'transition-colors duration-150 ease-out',
                isActive ? 'bg-ink text-[#f5f2ed]' : 'text-muted hover:bg-surface-3/70 hover:text-ink'
              )}
            >
              <Icon
                strokeWidth={1.75}
                className={cn('h-[17px] w-[17px]', isActive ? 'text-accent-2' : 'text-faint group-hover:text-ink')}
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
          className="press flex items-center justify-between rounded-full border border-line-strong bg-white px-4 py-2 text-[12.5px] text-muted transition-colors duration-150 hover:border-ink/40 hover:text-ink"
        >
          Classic dashboard
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <LiveBadge className="px-3" />
      </div>
    </aside>
  );
}
