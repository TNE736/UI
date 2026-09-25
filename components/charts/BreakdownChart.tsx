'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BreakdownRow } from '@/lib/types';
import { ChartTooltip } from './ChartTooltip';

const LABEL_WIDTH = 170;

/**
 * Horizontal stacked bars: decision makers vs everyone else, per category.
 * Colours come from CSS variables so both themes work without re-rendering.
 */
export function BreakdownChart({ rows, height }: { rows: BreakdownRow[]; height?: number }) {
  const data = rows.map((row) => ({
    label: row.label,
    'Decision makers': row.decisionMakers,
    Others: row.count - row.decisionMakers,
  }));
  const chartHeight = height ?? Math.max(160, data.length * 34 + 30);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={LABEL_WIDTH}
            // Recharts wraps a tick at the axis width; give it room and truncate instead.
            tick={{ fill: 'var(--muted)', fontSize: 12, width: LABEL_WIDTH * 2 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: string) => (value.length > 24 ? `${value.slice(0, 23)}…` : value)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          {/* A short, one-time draw: this is data people read, not decoration. */}
          <Bar dataKey="Others" stackId="a" fill="var(--accent)" radius={[4, 0, 0, 4]} animationDuration={350} animationEasing="ease-out" />
          <Bar dataKey="Decision makers" stackId="a" fill="var(--success)" radius={[0, 4, 4, 0]} animationDuration={350} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
