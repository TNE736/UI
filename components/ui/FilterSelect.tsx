import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/format';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * A pill that reads "Technology · Salesforce", backed by a native <select>
 * layered on top: keyboard, screen readers and phone pickers work for free.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  anyLabel = 'Any',
  block,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  anyLabel?: string;
  /** Full-width field (drawers) instead of a pill (toolbars). */
  block?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  const active = value !== '';
  return (
    <label
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 border text-[12.5px] font-medium transition-colors duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]',
        block ? 'h-11 w-full justify-between rounded-field px-3.5' : 'h-9 rounded-full pl-3.5 pr-2.5',
        active ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface text-muted hover:border-ink/40 hover:text-ink'
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={active ? 'text-on-ink-muted' : ''}>{label}</span>
        <span aria-hidden className={active ? 'text-on-ink-faint' : 'text-faint'}>·</span>
        <span className={cn('truncate', block ? 'max-w-[220px]' : 'max-w-[140px]', active ? 'text-on-ink' : 'text-ink')}>
          {current?.label ?? anyLabel}
        </span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.count !== undefined ? ` (${o.count})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
