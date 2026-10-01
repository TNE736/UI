'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clock, CornerDownLeft, ExternalLink, Loader2, RotateCw, Search, UploadCloud } from 'lucide-react';
import type { Consultant, ConsultantPage } from '@/lib/types';
import { useLive } from '@/lib/live';
import { StagePill } from '@/components/ui/StagePill';
import { Avatar } from '@/components/ui/Avatar';
import { NAV } from './nav';

const OPEN_EVENT = 'leadops:open-command-menu';
const RECENT_KEY = 'leadops:recent';
const MAX_RECENT = 5;
/** The existing leadops-platform dashboard; opened, never modified. */
const CLASSIC_URL = 'http://localhost:3000';

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

interface Recent {
  href: string;
  label: string;
  meta: string;
  kind: 'page' | 'person';
}

function readRecent(): Recent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}
function remember(item: Recent) {
  try {
    const next = [item, ...readRecent().filter((r) => r.href !== item.href)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: recents are a convenience only
  }
}

/**
 * Ctrl/⌘ K palette. Keyboard-initiated and used constantly, so it only gets a
 * 140 ms fade-in on open and closes instantly (frequency rule).
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Consultant[]>([]);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<Recent[]>([]);
  const router = useRouter();
  const { refresh } = useLive();

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

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  // Search consultants as the user types (debounced).
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setPeople([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/consultants?q=${encodeURIComponent(q)}&pageSize=6`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((page: ConsultantPage | null) => {
          setPeople(page?.rows ?? []);
          setSearching(false);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const go = (item: Recent) => {
    remember(item);
    close();
    router.push(item.href);
  };
  const run = (action: () => void) => {
    close();
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(value) => (value ? setOpen(true) : close())}
      label="Command menu"
      overlayClassName="fixed inset-0 z-50 bg-ink/30"
      contentClassName="cmd-content fixed left-1/2 top-[14vh] z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-panel bg-surface-raised shadow-pop"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        {searching ? <Loader2 className="h-4 w-4 animate-spin text-faint" /> : <Search className="h-4 w-4 text-faint" />}
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search consultants, pages and actions…"
          className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint focus-visible:outline-none"
        />
        <kbd className="hidden rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-muted sm:block">esc</kbd>
      </div>

      <Command.List className="thin-scroll max-h-[min(420px,60vh)] overflow-y-auto p-2 text-[13.5px]">
        <Command.Empty className="px-3 py-10 text-center text-muted">
          {searching ? 'Searching MongoDB…' : `Nothing matches “${query}”.`}
        </Command.Empty>

        {!query && recent.length > 0 && (
          <Command.Group heading="Recent" className="cmd-group">
            {recent.map((item) => (
              <Command.Item key={item.href} value={`recent ${item.label} ${item.meta}`} onSelect={() => go(item)} className="cmd-item">
                <Clock className="h-4 w-4 text-faint" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="truncate text-[12px] text-faint">{item.meta}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {people.length > 0 && (
          <Command.Group heading="Consultants" className="cmd-group">
            {people.map((person) => (
              <Command.Item
                key={person.id}
                value={`person ${person.name} ${person.email} ${person.technology ?? ''} ${person.title ?? ''}`}
                onSelect={() =>
                  go({
                    href: `/journey?id=${person.id}`,
                    label: person.name,
                    meta: person.technology ?? person.email,
                    kind: 'person',
                  })
                }
                className="cmd-item"
              >
                <Avatar name={person.name} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{person.name}</span>
                  <span className="block truncate text-[12px] text-faint">
                    {[person.technology, person.title].filter(Boolean).join(' · ') || person.email}
                  </span>
                </span>
                <StagePill stage={person.stage} />
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Pages" className="cmd-group">
          {NAV.map(({ href, label, description, icon: Icon }) => (
            <Command.Item
              key={href}
              value={`page ${label} ${description}`}
              onSelect={() => go({ href, label, meta: description, kind: 'page' })}
              className="cmd-item"
            >
              <span className="grid h-7 w-7 place-items-center rounded-control bg-surface-2 text-muted">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 font-medium text-ink">{label}</span>
              <span className="hidden text-[12px] text-faint sm:inline">{description}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions" className="cmd-group">
          <Command.Item value="action upload csv import" onSelect={() => go({ href: '/upload', label: 'Upload', meta: 'Add consultants from CSV', kind: 'page' })} className="cmd-item">
            <span className="grid h-7 w-7 place-items-center rounded-control bg-surface-2 text-muted">
              <UploadCloud className="h-4 w-4" />
            </span>
            <span className="flex-1">Upload a consultant CSV</span>
          </Command.Item>
          <Command.Item value="action refresh reload data" onSelect={() => run(refresh)} className="cmd-item">
            <span className="grid h-7 w-7 place-items-center rounded-control bg-surface-2 text-muted">
              <RotateCw className="h-4 w-4" />
            </span>
            <span className="flex-1">Refresh all data</span>
            <span className="text-[12px] text-faint">Refetch every view</span>
          </Command.Item>
          <Command.Item
            value="action open classic dashboard"
            onSelect={() => run(() => window.open(CLASSIC_URL, '_blank', 'noreferrer'))}
            className="cmd-item"
          >
            <span className="grid h-7 w-7 place-items-center rounded-control bg-surface-2 text-muted">
              <ExternalLink className="h-4 w-4" />
            </span>
            <span className="flex-1">Open the classic dashboard</span>
            <span className="text-[12px] text-faint">:3000</span>
          </Command.Item>
        </Command.Group>
      </Command.List>

      <div className="hidden items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-[11.5px] text-faint sm:flex">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeft className="h-3 w-3" />
          </Kbd>{' '}
          open
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>esc</Kbd> close
        </span>
        <span className="ml-auto">Type 2+ letters to search consultants</span>
      </div>
    </Command.Dialog>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-surface px-1 font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
