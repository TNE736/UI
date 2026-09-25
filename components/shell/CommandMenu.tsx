'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ExternalLink, Moon, Sun, User } from 'lucide-react';
import type { Consultant, ConsultantPage } from '@/lib/types';
import { StagePill } from '@/components/ui/StagePill';
import { NAV } from './nav';

const OPEN_EVENT = 'leadops:open-command-menu';

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Ctrl/⌘ K palette. It's keyboard-initiated and used constantly, so per the
 * frequency rule it opens and closes with NO animation — like Raycast.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Consultant[]>([]);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Search consultants as the user types (debounced).
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setPeople([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/consultants?q=${encodeURIComponent(q)}&pageSize=6`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((page: ConsultantPage | null) => setPeople(page?.rows ?? []))
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const run = (action: () => void) => {
    setOpen(false);
    setQuery('');
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      overlayClassName="fixed inset-0 z-50 bg-black/40"
      contentClassName="fixed left-1/2 top-[18vh] z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-pop"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search consultants, pages, actions…"
        className="h-13 w-full border-b border-line bg-transparent px-4 text-[15px] text-fg outline-none placeholder:text-faint"
      />
      <Command.List className="thin-scroll max-h-[360px] overflow-y-auto p-2 text-[13.5px]">
        <Command.Empty className="px-3 py-8 text-center text-muted">No matches.</Command.Empty>

        {people.length > 0 && (
          <Command.Group heading="Consultants" className="cmd-group">
            {people.map((person) => (
              <Command.Item
                key={person.id}
                value={`person ${person.name} ${person.email} ${person.technology ?? ''}`}
                onSelect={() => run(() => router.push(`/journey?id=${person.id}`))}
                className="cmd-item"
              >
                <User className="h-4 w-4 text-faint" />
                <span className="min-w-0 flex-1 truncate">
                  {person.name}
                  <span className="ml-2 text-faint">{person.technology ?? person.email}</span>
                </span>
                <StagePill stage={person.stage} />
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Go to" className="cmd-group">
          {NAV.map(({ href, label, description, icon: Icon }) => (
            <Command.Item key={href} value={`page ${label} ${description}`} onSelect={() => run(() => router.push(href))} className="cmd-item">
              <Icon className="h-4 w-4 text-faint" />
              <span className="flex-1">{label}</span>
              <span className="text-faint">{description}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions" className="cmd-group">
          <Command.Item
            value="toggle theme dark light"
            onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
            className="cmd-item"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-faint" /> : <Moon className="h-4 w-4 text-faint" />}
            Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
          <Command.Item
            value="open classic dashboard"
            onSelect={() => run(() => window.open('http://localhost:3000', '_blank', 'noreferrer'))}
            className="cmd-item"
          >
            <ExternalLink className="h-4 w-4 text-faint" />
            Open the classic dashboard
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
