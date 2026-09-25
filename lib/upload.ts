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

export interface CsvPreview {
  rows: number;
  headers: string[];
  /** Consultant rosters have first_name + email and no company_id. */
  looksLikeConsultants: boolean;
}

export async function previewCsv(file: File): Promise<CsvPreview> {
  const parsed = Papa.parse<Record<string, string>>(await file.text(), {
    header: true,
    skipEmptyLines: 'greedy',
  });
  const headers = parsed.meta.fields ?? [];
  if (!headers.length) throw new Error('No header row found');
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const has = (...names: string[]) => names.some((name) => normalized.includes(name));
  return {
    rows: parsed.data.length,
    headers,
    looksLikeConsultants:
      has('firstname', 'fname') && has('email', 'emailaddress') && !has('companyid', 'compid'),
  };
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
