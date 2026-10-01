'use client';

import { Dialog } from '@base-ui/react/dialog';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, RotateCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/format';
import { useLive } from '@/lib/live';
import { NAV, findNav } from './nav';
import { SystemPulse } from './SystemPulse';
import { openCommandMenu } from './CommandMenu';

/** The LeadOps wordmark: serif name with the accent full stop, and a product label. */
function Brand() {
  return (
    <Link href="/" className="press flex shrink-0 items-center gap-2.5" aria-label="LeadOps Studio home">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-ink text-on-ink shadow-glow">
        <span className="font-display text-[17px] font-semibold leading-none">L</span>
      </span>
      <span className="hidden leading-none sm:block">
        <span className="font-display block text-[18px] font-semibold text-ink">
          LeadOps<span className="text-accent">.</span>
        </span>
        <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.2em] text-faint">Studio</span>
      </span>
    </Link>
  );
}

/**
 * Global shell: brand, primary navigation, and utilities. The active page is
 * marked by a raised chip that slides between items (200 ms, ease-out — fast
 * enough for something clicked many times a day; reduced motion: no slide).
 */
export function Topbar() {
  const pathname = usePathname();
  const current = findNav(pathname);
  const { refresh } = useLive();
  const [spin, setSpin] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  function onRefresh() {
    refresh();
    setSpin((n) => n + 1);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-topbar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 xl:gap-5">
        <Brand />
        <span aria-hidden className="hidden h-6 w-px bg-line-strong lg:block" />

        <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
          {NAV.map(({ href, label }) => {
            const isActive = current?.href === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-full px-3 py-1.5 text-[13.5px] font-medium xl:px-3.5 transition-colors duration-150 ease-out',
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: 'tween', duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-0 rounded-full bg-surface shadow-card"
                    aria-hidden
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <SystemPulse />
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh all data"
            title="Refresh all data"
            className="press grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
          >
            <motion.span
              key={spin}
              initial={{ rotate: spin ? -180 : 0 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="grid place-items-center"
            >
              <RotateCw className="h-4 w-4" />
            </motion.span>
          </button>
          <button
            type="button"
            onClick={openCommandMenu}
            className="press hidden h-9 items-center gap-2 rounded-full border border-line bg-surface pl-3.5 pr-2 text-[13px] text-faint transition-colors duration-150 hover:border-line-strong hover:text-muted md:flex lg:hidden xl:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="w-28 text-left xl:w-40">Search LeadOps…</span>
            <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-muted">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={openCommandMenu}
            aria-label="Search"
            className="press grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted md:hidden lg:grid xl:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            className="press grid h-9 w-9 place-items-center rounded-full bg-ink text-on-ink lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <MobileNav open={menuOpen} onOpenChange={setMenuOpen} currentHref={current?.href} />
    </header>
  );
}

/** Below lg: navigation lives in a sheet that slides from the top edge it came from. */
function MobileNav({
  open,
  onOpenChange,
  currentHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHref?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            'fixed inset-x-3 top-3 z-50 rounded-hero bg-surface-raised p-3 shadow-pop outline-none',
            'transition-[opacity,transform] duration-[260ms] [transition-timing-function:var(--ease-drawer)]',
            'data-[starting-style]:-translate-y-4 data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-4 data-[ending-style]:opacity-0'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <Dialog.Title className="font-display text-[20px] font-semibold text-ink">
              LeadOps<span className="text-accent">.</span>
            </Dialog.Title>
            <Dialog.Close aria-label="Close navigation" className="press grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="mt-1 grid gap-1">
            {NAV.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => onOpenChange(false)}
                aria-current={currentHref === href ? 'page' : undefined}
                className={cn(
                  'press flex items-center gap-3 rounded-field px-3 py-3',
                  currentHref === href ? 'bg-ink text-on-ink' : 'text-ink hover:bg-surface-2'
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', currentHref === href ? 'text-accent-2' : 'text-faint')} strokeWidth={1.75} />
                <span className="flex-1 text-[15px] font-medium">{label}</span>
                <span className={cn('text-[12px]', currentHref === href ? 'text-on-ink-faint' : 'text-faint')}>{description}</span>
              </Link>
            ))}
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
