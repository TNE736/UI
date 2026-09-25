/**
 * Browser-visible endpoints of the existing leadops-platform services.
 * Next.js inlines NEXT_PUBLIC_* at build time, so each is read literally.
 * 127.0.0.1 rather than localhost: WSL's relay can answer on ::1 for some ports.
 */
export const INGEST_API_URL = process.env.NEXT_PUBLIC_INGEST_API_URL || 'http://127.0.0.1:8000';
export const LIVE_UPDATES_URL =
  process.env.NEXT_PUBLIC_LIVE_UPDATES_URL || 'http://127.0.0.1:4100/events';
