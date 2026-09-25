import type { NextRequest } from 'next/server';
import { respond } from '@/lib/server/respond';
import { listConsultants } from '@/lib/server/queries';

export const dynamic = 'force-dynamic';

/** GET /api/consultants?q=&stage=&dm=yes|no&sort=&dir=asc|desc&page=&pageSize= */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dm = params.get('dm');
  return respond(() =>
    listConsultants({
      q: params.get('q') ?? undefined,
      stage: params.get('stage') ?? undefined,
      decisionMaker: dm === 'yes' || dm === 'no' ? dm : undefined,
      sort: params.get('sort') ?? undefined,
      dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
      page: Number(params.get('page')) || 1,
      pageSize: Number(params.get('pageSize')) || 25,
    })
  );
}
