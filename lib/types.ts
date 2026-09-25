import type { Stage } from './stages';

/** One consultant as the dashboard shows it (GET /api/consultants). */
export interface Consultant {
  id: string;
  name: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  technology: string | null;
  title: string | null;
  seniority: string | null;
  visaStatus: string | null;
  stage: Stage;
  decisionMaker: boolean;
  optedOut: boolean;
  emailStatus: string | null;
  /** When the document was created (from its ObjectId). */
  createdAt: string;
}

export interface ConsultantPage {
  rows: Consultant[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET /api/overview */
export interface Overview {
  total: number;
  decisionMakers: number;
  optedOut: number;
  byStage: Record<Stage, number>;
  /** How many have reached each progress stage or gone past it. */
  reached: Record<string, number>;
  emailStatus: Record<string, number>;
  recent: Consultant[];
  generatedAt: string;
}

export interface BreakdownRow {
  label: string;
  count: number;
  decisionMakers: number;
}

/** GET /api/breakdowns */
export interface Breakdowns {
  technology: BreakdownRow[];
  title: BreakdownRow[];
  seniority: BreakdownRow[];
  visaStatus: BreakdownRow[];
}

/** Response of the existing ingest API, POST /leads/ingest (leadops-platform). */
export interface IngestSummary {
  kind?: 'consultants';
  total: number;
  valid: number;
  invalid: number;
  skippedDuplicate?: number;
  skippedNonDecisionMaker: number;
  skippedNotLead: number;
  inserted: boolean;
  insertedCount?: number;
  dbError?: string;
  errors: { file: string; row: number | null; key?: string | null; issues: string[] }[];
  errorsOmitted: number;
}

/** An event relayed by the live-updates gateway (leadops-platform). */
export interface LiveEvent {
  id: string;
  type: string;
  status: string;
  timestamp: string;
  leadId?: string;
  source: string;
}
