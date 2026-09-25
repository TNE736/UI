'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ALL_STAGES, STAGE_META, type Stage } from '@/lib/stages';
import { percent } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/Number';
import { ChartTooltip } from '@/components/charts/ChartTooltip';

/** Where everyone is right now (not cumulative), including closing stages. */
export function StageDonut({ byStage, total }: { byStage: Record<Stage, number>; total: number }) {
  const slices = ALL_STAGES.filter((stage) => byStage[stage] > 0).map((stage) => ({
    stage,
    name: STAGE_META[stage].label,
    value: byStage[stage],
    color: STAGE_META[stage].color,
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
              // Data here is read, not decorated: a short, one-time draw only.
              animationDuration={600}
              animationEasing="ease-out"
            >
              {slices.map((slice) => (
                <Cell key={slice.stage} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[26px] font-semibold leading-none tracking-tight">
              <AnimatedNumber value={total} />
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-faint">total</p>
          </div>
        </div>
      </div>

      <ul className="grid w-full min-w-0 grid-cols-1 gap-y-2 text-[13px]">
        {slices.map(({ stage, name, value, color }) => (
          <li key={stage} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-muted">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
              <span className="truncate">{name}</span>
            </span>
            <span className="tabular-nums text-fg">
              {value} <span className="text-faint">{percent(value, total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
