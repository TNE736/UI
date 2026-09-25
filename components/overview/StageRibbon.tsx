import { ALL_STAGES, STAGE_META, type Stage } from '@/lib/stages';
import { percent } from '@/lib/format';

/**
 * Where everyone is right now, as one proportional ribbon. It reveals left to
 * right once on first paint (clip-path, 600 ms ease-in-out: something already
 * on screen being uncovered), then simply re-lays out when the data changes.
 */
export function StageRibbon({ byStage, total }: { byStage: Record<Stage, number>; total: number }) {
  const segments = ALL_STAGES.filter((stage) => byStage[stage] > 0);

  return (
    <div>
      <div className="ribbon-reveal flex h-3.5 gap-[3px] overflow-hidden rounded-full">
        {segments.map((stage) => (
          <span
            key={stage}
            title={`${STAGE_META[stage].label}: ${byStage[stage]}`}
            className="h-full min-w-[6px] rounded-full"
            style={{ flexGrow: byStage[stage], background: STAGE_META[stage].color }}
          />
        ))}
        {!segments.length && <span className="h-full flex-1 rounded-full bg-white/10" />}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
        {segments.map((stage) => (
          <li key={stage} className="flex items-center gap-2 text-[13px]">
            <span className="h-2 w-2 rounded-full" style={{ background: STAGE_META[stage].color }} aria-hidden />
            <span className="text-on-ink-muted">{STAGE_META[stage].label}</span>
            <span className="font-medium tabular-nums">{byStage[stage]}</span>
            <span className="tabular-nums text-on-ink-faint">{percent(byStage[stage], total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
