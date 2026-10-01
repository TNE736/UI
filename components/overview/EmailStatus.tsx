import { Mail } from 'lucide-react';
import { percent } from '@/lib/format';
import { EmptyState } from '@/components/ui/States';

/** Shades from the forest scale, darkest for the most common status. */
const SHADES = ['#2f6b4f', '#5a9474', '#86a98f', '#a9c2ae', '#cdd6c8'];

const label = (status: string) =>
  status.replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** What the Email Agent has written to `email_status`, as one segmented bar and a legend. */
export function EmailStatus({ emailStatus }: { emailStatus: Record<string, number> }) {
  const rows = Object.entries(emailStatus).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);

  if (!total) {
    return (
      <EmptyState
        className="py-6"
        icon={<Mail className="h-5 w-5" />}
        title="No emails recorded yet"
        description="Statuses appear once bench-outreach's Email Agent writes email_status."
      />
    );
  }

  return (
    <div>
      <p className="t-figure text-[44px] text-ink">{total.toLocaleString()}</p>
      <p className="mt-1 text-[13px] text-muted">email status record{total === 1 ? '' : 's'}</p>
      <div className="mt-6 flex h-2.5 gap-[3px] overflow-hidden rounded-full">
        {rows.map(([status, n], i) => (
          <span
            key={status}
            className="h-full min-w-[6px] rounded-full"
            style={{ flexGrow: n, background: SHADES[i % SHADES.length] }}
            title={`${label(status)}: ${n}`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map(([status, n], i) => (
          <li key={status} className="flex items-center gap-2 text-[13px]">
            <span className="h-2 w-2 rounded-full" style={{ background: SHADES[i % SHADES.length] }} aria-hidden />
            <span className="flex-1 text-muted">{label(status)}</span>
            <span className="num font-medium text-ink">{n}</span>
            <span className="num w-10 text-right text-faint">{percent(n, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
