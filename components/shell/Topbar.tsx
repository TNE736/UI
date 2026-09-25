'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/format';
import { NAV, findNav } from './nav';
import { LiveBadge } from './LiveBadge';
import { openCommandMenu } from './CommandMenu';

export function Topbar() {
  const current = findNav(usePathname());

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[#faf9f5]/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-muted">
          {current?.label ?? 'LeadOps Studio'}
        </p>
        <LiveBadge className="lg:hidden" />
        <button
          type="button"
          onClick={openCommandMenu}
          className="press hidden h-9 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-[13px] text-faint transition-colors duration-150 hover:border-ink/40 hover:text-muted sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Search or jump to…
          <kbd className="ml-4 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
            Ctrl K
          </kbd>
        </button>
        <button
          type="button"
          onClick={openCommandMenu}
          aria-label="Search"
          className="press grid h-9 w-9 place-items-center rounded-full border border-line-strong bg-white text-muted sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Below lg the sidebar is hidden, so navigation moves here. */}
      <nav aria-label="Main" className="thin-scroll flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'press shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium',
              current?.href === href ? 'bg-ink text-[#f5f2ed]' : 'text-muted'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
