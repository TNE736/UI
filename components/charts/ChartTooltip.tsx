'use client';

/** Tooltip styled like the rest of the app (recharts' default is a white box in both themes). */
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; payload?: { color?: string } }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface px-3 py-2 text-[12.5px] shadow-pop">
      {label !== undefined && label !== '' && <p className="mb-1 font-medium text-fg">{label}</p>}
      {payload.map((item, index) => (
        <p key={index} className="flex items-center gap-2 text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: item.payload?.color ?? item.color }}
            aria-hidden
          />
          {item.name}
          <span className="ml-auto pl-3 font-semibold tabular-nums text-fg">{item.value}</span>
        </p>
      ))}
    </div>
  );
}
