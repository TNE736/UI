import { NextResponse } from 'next/server';
import { consultantsCollection } from '@/lib/server/mongo';

export const dynamic = 'force-dynamic';

/** GET /api/health — pings MongoDB and reports the round-trip time. Read-only. */
export async function GET() {
  const started = Date.now();
  try {
    const collection = await consultantsCollection();
    await collection.db.command({ ping: 1 });
    return NextResponse.json(
      { mongo: 'up', latencyMs: Date.now() - started, database: collection.dbName, collection: collection.collectionName },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ mongo: 'down', detail }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
