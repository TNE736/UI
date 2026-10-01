import Papa from 'papaparse';
import { INGEST_API_URL } from './config';
import type { IngestSummary } from './types';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** The existing ingest API reads CSV only, so the dashboard accepts CSV only. */
export function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Only .csv files are supported';
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 15 MB';
  return null;
}

export interface CsvChecks {
  /** Rows without a first name. */
  missingName: number;
  /** Rows without an email address. */
  missingEmail: number;
  /** Emails that don't look like name@domain. */
  malformedEmail: number;
  /** Rows whose email already appeared earlier in this file. */
  duplicateEmail: number;
}

export interface CsvPreview {
  rows: number;
  headers: string[];
  /** Consultant rosters have first_name + email and no company_id. */
  looksLikeConsultants: boolean;
  /** The first few rows, exactly as parsed, for the preview table. */
  sample: Record<string, string>[];
  /** Browser-side pre-checks. Advisory only: the ingest API has the final say. */
  checks: CsvChecks;
}

const SAMPLE_ROWS = 8;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const squash = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function previewCsv(file: File): Promise<CsvPreview> {
  const parsed = Papa.parse<Record<string, string>>(await file.text(), {
    header: true,
    skipEmptyLines: 'greedy',
  });
  const headers = parsed.meta.fields ?? [];
  if (!headers.length) throw new Error('No header row found');
  const normalized = headers.map(squash);
  const has = (...names: string[]) => names.some((name) => normalized.includes(name));
  const column = (...names: string[]) => headers.find((h) => names.includes(squash(h)));

  const nameColumn = column('firstname', 'fname');
  const emailColumn = column('email', 'emailaddress');
  const checks: CsvChecks = { missingName: 0, missingEmail: 0, malformedEmail: 0, duplicateEmail: 0 };
  const seen = new Set<string>();
  for (const row of parsed.data) {
    if (nameColumn && !row[nameColumn]?.trim()) checks.missingName++;
    const email = emailColumn ? row[emailColumn]?.trim().toLowerCase() : '';
    if (emailColumn && !email) checks.missingEmail++;
    if (email) {
      if (!EMAIL_SHAPE.test(email)) checks.malformedEmail++;
      if (seen.has(email)) checks.duplicateEmail++;
      seen.add(email);
    }
  }

  return {
    rows: parsed.data.length,
    headers,
    looksLikeConsultants:
      has('firstname', 'fname') && has('email', 'emailaddress') && !has('companyid', 'compid'),
    sample: parsed.data.slice(0, SAMPLE_ROWS),
    checks,
  };
}

/** Headers the ingest API needs for a consultant roster (last_name is optional). */
export const REQUIRED_HEADERS = [
  { key: 'first_name', aliases: ['firstname', 'fname'] },
  { key: 'email', aliases: ['email', 'emailaddress'] },
] as const;

export function missingHeaders(headers: string[]): string[] {
  const normalized = headers.map(squash);
  return REQUIRED_HEADERS.filter((h) => !h.aliases.some((a) => normalized.includes(a))).map((h) => h.key);
}

/** Sends files to the existing leadops-platform ingest API. Throws a user-facing message. */
export async function uploadCsvFiles(files: File[]): Promise<IngestSummary> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));

  let response: Response;
  try {
    response = await fetch(`${INGEST_API_URL}/leads/ingest`, { method: 'POST', body: form });
  } catch {
    throw new Error('Could not reach the ingest API on port 8000. Is it running?');
  }
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'total' in body) return body as IngestSummary;
  throw new Error(body?.error ?? `The ingest API answered ${response.status}`);
}
