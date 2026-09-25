'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/format';
import { NAV, findNav } from './nav';
import { LiveBadge } from './LiveBadge';
import { openCommandMenu } from './CommandMenu';

/**
 * The only navigation: one horizontal bar. Logo left, pages in the middle,
 * live status and search right. Navigation is used tens of times a day, so
 * the active page changes instantly — no sliding indicator.
 */
export function Topbar() {
  const current = findNav(usePathname());

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-topbar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="press shrink-0 leading-none" aria-label="LeadOps Studio home">
          <span className="font-display text-[21px] font-semibold text-ink">
            LeadOps<span className="text-accent">.</span>
          </span>
        </Link>

        <nav aria-label="Main" className="thin-scroll -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1">
          {NAV.map(({ href, label }) => {
            const isActive = current?.href === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'press shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-150 ease-out',
                  isActive ? 'bg-ink text-on-ink' : 'text-muted hover:text-ink'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <LiveBadge className="hidden md:flex" />
          <button
            type="button"
            onClick={openCommandMenu}
            className="press hidden h-9 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-[13px] text-faint transition-colors duration-150 hover:border-ink/40 hover:text-muted lg:flex"
          >
            <Search className="h-3.5 w-3.5" />
            Search
            <kbd className="ml-3 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={openCommandMenu}
            aria-label="Search"
            className="press grid h-9 w-9 place-items-center rounded-full border border-line-strong bg-white text-muted lg:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
