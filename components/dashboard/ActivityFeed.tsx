'use client';

import { Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLive } from '@/lib/live';
import { relativeTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/States';

const EVENT_LABELS: Record<string, string> = {
  'lead.created': 'Lead saved',
  'hubspot.changed': 'Record changed',
};

/** Events relayed by the live-updates gateway since this tab opened. */
export function ActivityFeed() {
  const { events, status } = useLive();
  // Re-render every 30 s so "2m ago" stays true.
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!events.length) {
    return (
      <EmptyState
        icon={<Radio className="h-5 w-5" />}
        title={status === 'live' ? 'Listening for activity' : 'Live updates are offline'}
        description={
          status === 'live'
            ? 'New uploads and pipeline events appear here the moment they happen.'
            : 'Start the live-updates gateway on port 4100 to stream events. Data still refreshes every 15 seconds.'
        }
      />
    );
  }

  return (
    <ul className="thin-scroll max-h-[340px] divide-y divide-line overflow-y-auto">
      {events.slice(0, 25).map((event) => (
        // New rows fade in once; a burst of events never restarts older rows.
        <li key={event.id} className="rise flex items-center gap-3 px-5 py-3 text-[13px]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-fg">{EVENT_LABELS[event.type] ?? event.type}</span>
            {event.leadId && <span className="ml-2 font-mono text-[12px] text-faint">{event.leadId}</span>}
          </span>
          <span className="shrink-0 text-[12px] tabular-nums text-faint">{relativeTime(event.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}
