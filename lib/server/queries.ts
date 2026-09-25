import { ObjectId, type Document, type Filter, type Sort } from 'mongodb';
import { consultantsCollection } from './mongo';
import { ALL_STAGES, PROGRESS_STAGES, isStage, type Stage } from '../stages';
import type { BreakdownRow, Breakdowns, Consultant, ConsultantPage, Overview } from '../types';

const CONSULTANT_FIELDS = {
  first_name: 1,
  last_name: 1,
  email: 1,
  phone: 1,
  technology: 1,
  title: 1,
  seniority: 1,
  visa_status: 1,
  qualification_stage: 1,
  decision_maker: 1,
  opted_out: 1,
  email_status: 1,
} as const;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

function toConsultant(doc: Document): Consultant {
  const firstName = text(doc.first_name) ?? '';
  const lastName = text(doc.last_name);
  const email = text(doc.email) ?? '';
  const id = doc._id instanceof ObjectId ? doc._id : null;
  return {
    id: String(doc._id),
    name: [firstName, lastName].filter(Boolean).join(' ') || email || 'Unnamed',
    firstName,
    lastName,
    email,
    phone: text(doc.phone),
    technology: text(doc.technology),
    title: text(doc.title),
    seniority: text(doc.seniority),
    visaStatus: text(doc.visa_status),
    stage: isStage(doc.qualification_stage) ? doc.qualification_stage : 'loaded',
    decisionMaker: doc.decision_maker === true,
    optedOut: doc.opted_out === true,
    emailStatus: text(doc.email_status),
    createdAt: (id ? id.getTimestamp() : new Date()).toISOString(),
  };
}

/* ─────────────────────────── Overview ─────────────────────────── */

export async function getOverview(): Promise<Overview> {
  const collection = await consultantsCollection();
  const [facets] = await collection
    .aggregate<{
      total: { n: number }[];
      stages: { _id: unknown; n: number }[];
      decisionMakers: { n: number }[];
      optedOut: { n: number }[];
      emailStatus: { _id: unknown; n: number }[];
    }>([
      {
        $facet: {
          total: [{ $count: 'n' }],
          stages: [{ $group: { _id: '$qualification_stage', n: { $sum: 1 } } }],
          decisionMakers: [{ $match: { decision_maker: true } }, { $count: 'n' }],
          optedOut: [{ $match: { opted_out: true } }, { $count: 'n' }],
          emailStatus: [
            { $match: { email_status: { $nin: [null, ''] } } },
            { $group: { _id: '$email_status', n: { $sum: 1 } } },
          ],
        },
      },
    ])
    .toArray();

  const byStage = Object.fromEntries(ALL_STAGES.map((stage) => [stage, 0])) as Record<Stage, number>;
  for (const { _id, n } of facets?.stages ?? []) {
    // Documents without a stage count as freshly loaded.
    byStage[isStage(_id) ? _id : 'loaded'] += n;
  }

  // Cumulative: everyone at a progress stage or beyond it.
  const reached: Record<string, number> = {};
  let runningTotal = 0;
  for (const stage of [...PROGRESS_STAGES].reverse()) {
    runningTotal += byStage[stage];
    reached[stage] = runningTotal;
  }

  const recentDocs = await collection
    .find({}, { projection: CONSULTANT_FIELDS })
    .sort({ _id: -1 })
    .limit(6)
    .toArray();

  return {
    total: facets?.total[0]?.n ?? 0,
    decisionMakers: facets?.decisionMakers[0]?.n ?? 0,
    optedOut: facets?.optedOut[0]?.n ?? 0,
    byStage,
    reached,
    emailStatus: Object.fromEntries((facets?.emailStatus ?? []).map(({ _id, n }) => [String(_id), n])),
    recent: recentDocs.map(toConsultant),
    generatedAt: new Date().toISOString(),
  };
}

/* ─────────────────────────── Consultant list ─────────────────────────── */

const SORTABLE = {
  created: '_id',
  name: 'first_name',
  technology: 'technology',
  title: 'title',
  stage: 'qualification_stage',
} as const;
export type SortKey = keyof typeof SORTABLE;

export interface ListParams {
  q?: string;
  stage?: string;
  decisionMaker?: 'yes' | 'no';
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const MAX_PAGE_SIZE = 1000;

export async function listConsultants(params: ListParams): Promise<ConsultantPage> {
  const filter: Filter<Document> = {};
  const q = params.q?.trim();
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = ['first_name', 'last_name', 'email', 'technology', 'title'].map((field) => ({
      [field]: pattern,
    }));
  }
  if (params.stage && isStage(params.stage)) {
    // Consultants with no stage yet are shown as "loaded", so match them too.
    filter.qualification_stage =
      params.stage === 'loaded' ? { $in: ['loaded', null] } : params.stage;
  }
  if (params.decisionMaker) filter.decision_maker = params.decisionMaker === 'yes' ? true : { $ne: true };

  const sortField = SORTABLE[(params.sort as SortKey) ?? 'created'] ?? '_id';
  const direction = params.dir === 'asc' ? 1 : -1;
  const sort: Sort = sortField === '_id' ? { _id: direction } : { [sortField]: direction, _id: -1 };

  const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), MAX_PAGE_SIZE);
  const page = Math.max(params.page ?? 1, 1);

  const collection = await consultantsCollection();
  const [docs, total] = await Promise.all([
    collection
      .find(filter, { projection: CONSULTANT_FIELDS })
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .collation({ locale: 'en', strength: 2 }) // case-insensitive sort
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { rows: docs.map(toConsultant), total, page, pageSize };
}

/* ─────────────────────────── Breakdowns ─────────────────────────── */

const BREAKDOWN_LIMIT = 12;

async function breakdownBy(field: string): Promise<BreakdownRow[]> {
  const collection = await consultantsCollection();
  const rows = await collection
    .aggregate<{ _id: string; count: number; decisionMakers: number }>([
      {
        $group: {
          _id: {
            $let: {
              vars: { value: { $trim: { input: { $ifNull: [`$${field}`, ''] } } } },
              in: { $cond: [{ $eq: ['$$value', ''] }, 'Not set', '$$value'] },
            },
          },
          count: { $sum: 1 },
          decisionMakers: { $sum: { $cond: [{ $eq: ['$decision_maker', true] }, 1, 0] } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();

  const top = rows.slice(0, BREAKDOWN_LIMIT).map((row) => ({
    label: row._id,
    count: row.count,
    decisionMakers: row.decisionMakers,
  }));
  const rest = rows.slice(BREAKDOWN_LIMIT);
  if (rest.length) {
    top.push({
      label: `Other (${rest.length})`,
      count: rest.reduce((sum, row) => sum + row.count, 0),
      decisionMakers: rest.reduce((sum, row) => sum + row.decisionMakers, 0),
    });
  }
  return top;
}

export async function getBreakdowns(): Promise<Breakdowns> {
  const [technology, title, seniority, visaStatus] = await Promise.all([
    breakdownBy('technology'),
    breakdownBy('title'),
    breakdownBy('seniority'),
    breakdownBy('visa_status'),
  ]);
  return { technology, title, seniority, visaStatus };
}
