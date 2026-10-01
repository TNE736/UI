'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLive } from './live';

/** bench-outreach moves consultants along without telling this app, so poll too. */
const POLL_MS = 15_000;

export interface Resource<T> {
  data: T | null;
  error: string | null;
  /** True only until the first response; later refreshes keep showing the last data. */
  loading: boolean;
  /** True while any request (first or refresh) is in flight. */
  fetching: boolean;
  /** When the current data was received. */
  updatedAt: Date | null;
  /** Fetch again now (used by Retry and Refresh controls). */
  retry: () => void;
}

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  fetching: boolean;
  updatedAt: Date | null;
}

/**
 * Fetches a JSON endpoint, then refetches on every live event / upload
 * (`version`), every 15 s, and on `retry()`. A failed refetch keeps the last
 * good data. Pass `null` as the URL to pause.
 */
export function useResource<T>(url: string | null, pollMs: number | null = POLL_MS): Resource<T> {
  const { version } = useLive();
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
    fetching: false,
    updatedAt: null,
  });
  const [tick, setTick] = useState(0);
  const lastUrl = useRef(url);
  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  useEffect(() => {
    if (!url) return;
    // A new query (not a refresh) may return a different shape of result.
    if (lastUrl.current !== url) {
      lastUrl.current = url;
      setState((previous) => ({ ...previous, loading: previous.data === null }));
    }
    setState((previous) => ({ ...previous, fetching: true }));
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status})`);
        setState({ data: body as T, error: null, loading: false, fetching: false, updatedAt: new Date() });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Request failed';
        setState((previous) => ({ ...previous, error: message, loading: false, fetching: false }));
      });
    return () => controller.abort();
  }, [url, version, tick]);

  return { ...state, retry };
}
