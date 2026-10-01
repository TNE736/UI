'use client';

import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { INGEST_API_URL, LIVE_UPDATES_URL } from './config';
import { useLive } from './live';

export type ServiceState = 'up' | 'down' | 'checking';

export interface ServiceStatus {
  key: 'mongo' | 'ingest' | 'gateway';
  name: string;
  detail: string;
  state: ServiceState;
  latencyMs: number | null;
}

const CHECK_EVERY_MS = 30_000;
/** Generous: in development the first call also compiles the route. */
const TIMEOUT_MS = 10_000;

/** A service is reported down only after two failed attempts, never on one slow answer. */
async function probe(url: string): Promise<{ ok: boolean; ms: number; body: unknown }> {
  const first = await probeOnce(url);
  return first.ok ? first : probeOnce(url);
}

async function probeOnce(url: string): Promise<{ ok: boolean; ms: number; body: unknown }> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, ms: Math.round(performance.now() - started), body };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - started), body: null };
  } finally {
    clearTimeout(timer);
  }
}

interface SystemStatus {
  services: ServiceStatus[];
  checkedAt: Date | null;
}

const SystemStatusContext = createContext<SystemStatus | null>(null);

/** Runs the health checks once per tab and shares them with every consumer. */
export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  return createElement(SystemStatusContext.Provider, { value: useProbes() }, children);
}

export function useSystemStatus(): SystemStatus {
  const status = useContext(SystemStatusContext);
  if (!status) throw new Error('useSystemStatus must be used inside <SystemStatusProvider>');
  return status;
}

/**
 * Real health of the three services this dashboard depends on, checked every
 * 30 s from the browser. Nothing here is simulated: a service is "up" only if
 * it actually answered.
 */
function useProbes(): SystemStatus {
  const { status: liveStatus } = useLive();
  const [results, setResults] = useState<Record<string, { state: ServiceState; ms: number | null; detail?: string }>>({
    mongo: { state: 'checking', ms: null },
    ingest: { state: 'checking', ms: null },
    gateway: { state: 'checking', ms: null },
  });
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const gatewayHealth = LIVE_UPDATES_URL.replace(/\/events\/?$/, '/health');
    async function check() {
      const [mongo, ingest, gateway] = await Promise.all([
        probe('/api/health'),
        probe(`${INGEST_API_URL}/openapi.json`),
        probe(gatewayHealth),
      ]);
      if (cancelled) return;
      const mongoBody = mongo.body as { database?: string; latencyMs?: number } | null;
      setResults({
        mongo: {
          state: mongo.ok ? 'up' : 'down',
          ms: mongo.ok ? (mongoBody?.latencyMs ?? mongo.ms) : null,
          detail: mongo.ok && mongoBody?.database ? mongoBody.database : undefined,
        },
        ingest: { state: ingest.ok ? 'up' : 'down', ms: ingest.ok ? ingest.ms : null },
        gateway: { state: gateway.ok ? 'up' : 'down', ms: gateway.ok ? gateway.ms : null },
      });
      setCheckedAt(new Date());
    }
    check();
    const id = setInterval(check, CHECK_EVERY_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // The live stream's own state is more current than the 30 s probe.
  const gatewayState: ServiceState =
    liveStatus === 'live' ? 'up' : results.gateway!.state === 'checking' ? 'checking' : results.gateway!.state;

  return {
    checkedAt,
    services: [
      {
        key: 'mongo',
        name: 'MongoDB',
        detail: results.mongo!.detail ? `System of record · ${results.mongo!.detail}` : 'System of record',
        state: results.mongo!.state,
        latencyMs: results.mongo!.ms,
      },
      { key: 'ingest', name: 'Ingest API', detail: 'CSV validation and import · :8000', state: results.ingest!.state, latencyMs: results.ingest!.ms },
      { key: 'gateway', name: 'Live gateway', detail: 'Real-time events · :4100', state: gatewayState, latencyMs: results.gateway!.ms },
    ],
  };
}
