/**
 * bench-outreach's `qualification_stage` values (its consultant_fields.QualificationStage).
 * Progress stages run in order; closing stages end a consultant's journey early.
 * Colours: one warm scale (sand → terracotta → ink) for progress; greys for closing.
 */
export const PROGRESS_STAGES = [
  'loaded',
  'emailed',
  'engaged',
  'researched',
  'followed_up',
  'qualified',
  'handed_off',
] as const;

export const CLOSING_STAGES = ['suppressed', 'closed', 'invalid', 'referred'] as const;

export type ProgressStage = (typeof PROGRESS_STAGES)[number];
export type ClosingStage = (typeof CLOSING_STAGES)[number];
export type Stage = ProgressStage | ClosingStage;

export const ALL_STAGES: readonly Stage[] = [...PROGRESS_STAGES, ...CLOSING_STAGES];

interface StageMeta {
  label: string;
  /** What reaching this stage means, for tooltips and the journey timeline. */
  description: string;
  color: string;
}

export const STAGE_META: Record<Stage, StageMeta> = {
  loaded: { label: 'Loaded', description: 'Saved to MongoDB from a CSV upload', color: '#c9bfad' },
  emailed: { label: 'Emailed', description: 'Email Agent sent a matching role', color: '#e0a98d' },
  engaged: { label: 'Engaged', description: 'Replied to the outreach email', color: '#d97757' },
  researched: { label: 'Researched', description: 'Research done on the interested consultant', color: '#b8553a' },
  followed_up: { label: 'Followed up', description: 'Qualifying follow-up sent', color: '#8c3f27' },
  qualified: { label: 'Qualified', description: 'Met the bar for the Bench TA team', color: '#4a7c59' },
  handed_off: { label: 'Handed off', description: 'Handed to the Bench TA team', color: '#141413' },
  suppressed: { label: 'Suppressed', description: 'Opted out or suppressed', color: '#a8a397' },
  closed: { label: 'Closed', description: 'Closed without qualifying', color: '#7a766c' },
  invalid: { label: 'Invalid', description: 'Bad data — could not be worked', color: '#b42318' },
  referred: { label: 'Referred', description: 'Referred elsewhere', color: '#5f6f78' },
};

export function isStage(value: unknown): value is Stage {
  return typeof value === 'string' && (ALL_STAGES as readonly string[]).includes(value);
}

export function isClosing(stage: Stage): stage is ClosingStage {
  return (CLOSING_STAGES as readonly string[]).includes(stage);
}

/** Index of the furthest progress stage reached; closing stages only guarantee "loaded". */
export function progressIndex(stage: Stage): number {
  const index = (PROGRESS_STAGES as readonly string[]).indexOf(stage);
  return index === -1 ? 0 : index;
}
