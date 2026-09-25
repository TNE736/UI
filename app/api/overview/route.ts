import { respond } from '@/lib/server/respond';
import { getOverview } from '@/lib/server/queries';

export const dynamic = 'force-dynamic';

export function GET() {
  return respond(getOverview);
}
