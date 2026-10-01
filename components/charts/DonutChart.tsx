'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { BreakdownRow } from '@/lib/types';
import { percent } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';

/** Forest scale, darkest first; "Not set" is always the neutral grey. */
const SHADES = ['#1e4a36', '#2f6b4f', '#5a9474', '#86a98f', '#a9c2ae', '#cdd6c8', '#7c796d', '#b3b0a2'];
const NOT_SET = '#dcdfd5';

/** Share of a whole: a donut with the total in the middle and a ranked legend beside it. */
export function DonutChart({ rows, centerLabel }: { rows: BreakdownRow[]; centerLabel: string }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  let shade = 0;
  const data = rows.map((row) => ({
    name: row.label,
    value: row.count,
    color: row.label === 'Not set' ? NOT_SET : SHADES[shade++ % SHADES.length]!,
  }));

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={86}
              paddingAngle={data.length > 1 ? 1.5 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={450}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="t-figure text-[28px] text-ink">{total.toLocaleString()}</p>
            <p className="t-label mt-1 text-faint">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {data.slice(0, 7).map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-muted" title={d.name}>
              {d.name}
            </span>
            <span className="num font-medium text-ink">{d.value}</span>
            <span className="num w-10 text-right text-faint">{percent(d.value, total)}</span>
          </li>
        ))}
        {data.length > 7 && <li className="pl-5 text-[12px] text-faint">+{data.length - 7} more</li>}
      </ul>
    </div>
  );
}
