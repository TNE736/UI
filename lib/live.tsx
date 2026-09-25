'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LIVE_UPDATES_URL } from './config';
import type { LiveEvent } from './types';

export type LiveStatus = 'connecting' | 'live' | 'offline';

interface LiveState {
  status: LiveStatus;
  /** Newest first, capped. */
  events: LiveEvent[];
  /** Bumps whenever data may have changed: a live event, an upload, a manual refresh. */
  version: number;
  refresh: () => void;
}

const LiveContext = createContext<LiveState | null>(null);
const MAX_EVENTS = 60;
/** The gateway replays its recent events on connect, and uploads publish one per lead. */
const REFETCH_BATCH_MS = 400;

/**
 * Subscribes once per tab to the existing live-updates gateway (SSE).
 * EventSource reconnects on its own, so this only tracks status.
 */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // A burst of events (replay on connect, one per uploaded lead) → one refetch.
    const scheduleRefresh = () => {
      if (batchTimer.current) return;
      batchTimer.current = setTimeout(() => {
        batchTimer.current = null;
        setVersion((v) => v + 1);
      }, REFETCH_BATCH_MS);
    };

    const source = new EventSource(LIVE_UPDATES_URL);
    source.onopen = () => setStatus('live');
    source.onerror = () => setStatus(source.readyState === EventSource.CLOSED ? 'offline' : 'connecting');
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as LiveEvent;
        setEvents((previous) =>
          previous.some((e) => e.id === event.id) ? previous : [event, ...previous].slice(0, MAX_EVENTS)
        );
        scheduleRefresh();
      } catch {
        // ignore malformed frames
      }
    };
    return () => {
      source.close();
      if (batchTimer.current) clearTimeout(batchTimer.current);
      batchTimer.current = null;
    };
  }, []);

  const value = useMemo(() => ({ status, events, version, refresh }), [status, events, version, refresh]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveState {
  const state = useContext(LiveContext);
  if (!state) throw new Error('useLive must be used inside <LiveProvider>');
  return state;
}
