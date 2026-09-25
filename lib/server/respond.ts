import { NextResponse } from 'next/server';

/** Runs a read and turns a database failure into a 503 the UI can explain. */
export async function respond<T>(read: () => Promise<T>): Promise<NextResponse> {
  try {
    return NextResponse.json(await read(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[leadops-ui] MongoDB read failed:', detail);
    return NextResponse.json(
      { error: 'Could not reach MongoDB. Is the database (and the WSL relay) running?', detail },
      { status: 503 }
    );
  }
}
