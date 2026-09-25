import { MongoClient, type Collection, type Document } from 'mongodb';

/**
 * One MongoClient per server process. In dev, Next.js re-evaluates modules on
 * every edit, so the client lives on globalThis to avoid a new pool each time.
 * Read-only: nothing in this app writes to MongoDB — uploads go through the
 * existing leadops-platform ingest API.
 */
const globalForMongo = globalThis as unknown as { leadopsMongo?: Promise<MongoClient> };

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local.');
  // Fail fast when MongoDB is unreachable instead of hanging a request for 30 s.
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, appName: 'leadops-ui' });
  return client.connect();
}

export async function consultantsCollection(): Promise<Collection<Document>> {
  globalForMongo.leadopsMongo ??= connect().catch((error: unknown) => {
    globalForMongo.leadopsMongo = undefined; // retry on the next request
    throw error;
  });
  const client = await globalForMongo.leadopsMongo;
  return client
    .db(process.env.MONGODB_DB || 'bench_outreach')
    .collection(process.env.MONGODB_COLLECTION || 'consultants');
}
