'use client';

import { Popover } from '@base-ui/react/popover';
import { useEffect, useState } from 'react';
import { useSystemStatus, type ServiceState } from '@/lib/useSystemStatus';
import { useLive } from '@/lib/live';
import { cn, relativeTime } from '@/lib/format';

const DOT: Record<ServiceState, string> = {
  up: 'bg-success text-success',
  down: 'bg-danger text-danger',
  checking: 'bg-warning text-warning',
};
const WORD: Record<ServiceState, string> = { up: 'Operational', down: 'Unreachable', checking: 'Checking…' };

/**
 * The top bar's health control: one dot and a word, with the real per-service
 * checks in a popover. Opens from its trigger (origin-aware), 180 ms ease-out.
 */
export function SystemPulse() {
  const { services, checkedAt } = useSystemStatus();
  const { status: liveStatus, events } = useLive();
  const down = services.filter((s) => s.state === 'down').length;
  const checking = services.some((s) => s.state === 'checking');
  const overall: ServiceState = down ? 'down' : checking ? 'checking' : 'up';
  const label = down ? `${down} issue${down > 1 ? 's' : ''}` : checking ? 'Checking' : 'All systems';

  // Keep "checked 12s ago" honest while the popover is open.
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Popover.Root>
      <Popover.Trigger
        className="press inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[12.5px] font-medium text-muted shadow-[0_1px_1px_rgb(21_32_26_/_0.03)] transition-colors duration-150 hover:border-line-strong hover:text-ink"
        aria-label={`System status: ${label}`}
      >
        <span className={cn('relative h-2 w-2 rounded-full', DOT[overall], overall === 'up' && liveStatus === 'live' && 'live-dot')} />
        <span className="hidden sm:inline lg:hidden xl:inline">{label}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="z-50">
          <Popover.Popup
            className={cn(
              'w-[320px] origin-[var(--transform-origin)] rounded-panel bg-surface-raised p-2 shadow-pop outline-none',
              'transition-[opacity,transform] duration-[180ms] ease-out',
              'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0'
            )}
          >
            <div className="flex items-baseline justify-between px-3 pb-2 pt-2">
              <Popover.Title className="text-[13px] font-semibold text-ink">System status</Popover.Title>
              <span className="text-[11.5px] text-faint">{checkedAt ? `Checked ${relativeTime(checkedAt.toISOString())}` : 'Checking…'}</span>
            </div>
            <ul className="space-y-0.5">
              {services.map((service) => (
                <li key={service.key} className="flex items-center gap-3 rounded-field px-3 py-2.5 hover:bg-surface-2">
                  <span className={cn('relative h-2 w-2 shrink-0 rounded-full', DOT[service.state])} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">{service.name}</span>
                    <span className="block truncate text-[11.5px] text-faint">{service.detail}</span>
                  </span>
                  <span className="num text-right text-[11.5px] text-muted">
                    {WORD[service.state]}
                    {service.latencyMs !== null && <span className="block text-faint">{service.latencyMs} ms</span>}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-1 border-t border-line px-3 pb-1.5 pt-2.5 text-[11.5px] leading-relaxed text-faint">
              {events.length} live event{events.length === 1 ? '' : 's'} this session. bench-outreach&rsquo;s agents write their results
              to MongoDB; they aren&rsquo;t health-checked from here.
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
