import { CLOSING_STAGES, STAGE_META, type Stage } from '@/lib/stages';

/** Consultants who left the pipeline early, by reason. */
export function ClosedPaths({ byStage }: { byStage: Record<Stage, number> }) {
  const total = CLOSING_STAGES.reduce((sum, stage) => sum + (byStage[stage] ?? 0), 0);
  const max = Math.max(...CLOSING_STAGES.map((stage) => byStage[stage] ?? 0), 1);

  return (
    <div>
      <p className="t-figure text-[44px] text-ink">{total.toLocaleString()}</p>
      <p className="mt-1 text-[13px] text-muted">{total ? 'left the pipeline early' : 'nobody has left the pipeline'}</p>
      <ul className="mt-6 space-y-3.5">
        {CLOSING_STAGES.map((stage) => {
          const n = byStage[stage] ?? 0;
          return (
            <li key={stage} title={STAGE_META[stage].description}>
              <div className="mb-1 flex items-baseline justify-between text-[13px]">
                <span className="text-muted">{STAGE_META[stage].label}</span>
                <span className="num font-medium text-ink">{n}</span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full origin-left rounded-full transition-transform duration-500 ease-out"
                  style={{ transform: `scaleX(${n / max})`, background: STAGE_META[stage].color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
