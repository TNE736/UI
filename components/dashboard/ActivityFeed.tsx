'use client';

import { Radio, UserPlus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Consultant } from '@/lib/types';
import { useLive } from '@/lib/live';
import { STAGE_META } from '@/lib/stages';
import { cn, relativeTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/States';

const EVENT_LABELS: Record<string, string> = {
  'lead.created': 'Lead saved',
  'lead.updated': 'Lead updated',
  'hubspot.changed': 'Record changed',
};

interface Item {
  id: string;
  kind: 'live' | 'record';
  title: string;
  detail: string | null;
  time: string;
}

/**
 * One timeline of what actually happened: events relayed by the live gateway
 * this session, plus the newest consultant records in MongoDB (their creation
 * time comes from the ObjectId). Nothing is invented to fill space.
 */
export function ActivityFeed({
  recent = [],
  limit = 12,
  onSelect,
  className,
}: {
  recent?: Consultant[];
  limit?: number;
  onSelect?: (consultant: Consultant) => void;
  className?: string;
}) {
  const { events, status } = useLive();
  // Re-render every 30 s so "2m ago" stays true.
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const byId = new Map(recent.map((c) => [c.id, c]));
  const items: Item[] = [
    ...events.map((e) => ({
      id: `live-${e.id}`,
      kind: 'live' as const,
      title: EVENT_LABELS[e.type] ?? e.type,
      detail: e.leadId ?? e.source ?? null,
      time: e.timestamp,
    })),
    ...recent.map((c) => ({
      id: `rec-${c.id}`,
      kind: 'record' as const,
      title: `${c.name} added`,
      detail: [STAGE_META[c.stage].label, c.technology].filter(Boolean).join(' · '),
      time: c.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit);

  if (!items.length) {
    return (
      <EmptyState
        className={className}
        icon={<Radio className="h-5 w-5" />}
        title={status === 'live' ? 'Listening for activity' : 'No activity yet'}
        description={
          status === 'live'
            ? 'New uploads and pipeline events appear here the moment they happen.'
            : 'Start the live-updates gateway on port 4100 to stream events. Data still refreshes every 15 seconds.'
        }
      />
    );
  }

  return (
    <ol className={cn('thin-scroll relative overflow-y-auto', className)}>
      {/* The spine of the timeline. */}
      <span aria-hidden className="absolute bottom-4 left-[29px] top-4 w-px bg-line" />
      {items.map((item) => {
        const consultant = item.kind === 'record' ? byId.get(item.id.slice(4)) : undefined;
        const Icon = item.kind === 'live' ? Zap : UserPlus;
        const body = (
          <>
            <span
              className={cn(
                'relative z-10 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full ring-4 ring-surface',
                item.kind === 'live' ? 'bg-accent text-on-ink' : 'bg-surface-2 text-muted'
              )}
            >
              <Icon className="h-3 w-3" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{item.title}</span>
              {item.detail && <span className="block truncate text-[12px] text-faint">{item.detail}</span>}
            </span>
            <span className="num shrink-0 text-[11.5px] text-faint" title={new Date(item.time).toLocaleString()}>
              {relativeTime(item.time)}
            </span>
          </>
        );
        return (
          // New rows fade in once; a burst of events never restarts older rows.
          <li key={item.id} className="rise">
            {consultant && onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(consultant)}
                className="flex w-full items-center gap-3 rounded-field px-5 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2"
              >
                {body}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-5 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
