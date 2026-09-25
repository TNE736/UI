'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitCommitHorizontal, Search, UserRound } from 'lucide-react';
import type { ConsultantPage } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { PROGRESS_STAGES, STAGE_META, isClosing, progressIndex } from '@/lib/stages';
import { cn } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StagePill } from '@/components/ui/StagePill';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorBanner } from '@/components/ui/States';
import { JourneyTimeline } from '@/components/consultants/JourneyTimeline';

export default function JourneyPage() {
  return (
    <Suspense>
      <Journey />
    </Suspense>
  );
}

function Journey() {
  const { data, error } = useResource<ConsultantPage>('/api/consultants?pageSize=1000&sort=created&dir=desc');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const people = useMemo(() => data?.rows ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((p) =>
      [p.name, p.email, p.technology, p.title].some((field) => field?.toLowerCase().includes(needle))
    );
  }, [people, search]);

  const selectedId = searchParams.get('id') ?? people[0]?.id ?? null;
  const person = people.find((p) => p.id === selectedId) ?? null;
  const select = (id: string) => router.replace(`/journey?id=${id}`, { scroll: false });

  // Arriving from a link (command menu, detail sheet): bring the person into view in the list.
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, data]);

  const closed = person ? isClosing(person.stage) : false;
  const completed = person ? (closed ? 1 : progressIndex(person.stage) + 1) : 0;
  const progress = completed / PROGRESS_STAGES.length;

  return (
    <>
      <PageHeader tone="teal" icon={GitCommitHorizontal} eyebrow="Trace" title="Consultant journey" description="Pick anyone to see how far they’ve come: loaded → emailed → engaged → researched → followed up → qualified → handed off." />
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <Card flush className="rise overflow-hidden" title={`${people.length} consultants`} eyebrow="People">
          <div className="border-y border-line p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter…"
                aria-label="Filter consultants"
                className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-[14px] outline-none transition-[border-color] duration-150 placeholder:text-faint focus:border-accent/60 sm:text-[13px]"
              />
            </label>
          </div>
          <ul className="thin-scroll max-h-[560px] overflow-y-auto p-1.5">
            {!data &&
              Array.from({ length: 10 }, (_, i) => (
                <li key={i} className="p-1.5">
                  <Skeleton className="h-10 w-full" />
                </li>
              ))}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  ref={p.id === selectedId ? activeRef : undefined}
                  type="button"
                  onClick={() => select(p.id)}
                  aria-current={p.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150',
                    p.id === selectedId ? 'bg-accent-soft' : 'hover:bg-surface-2'
                  )}
                >
                  <Avatar name={p.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">{p.name}</span>
                    <span className="block truncate text-[11.5px] text-faint">{p.technology ?? p.email}</span>
                  </span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STAGE_META[p.stage].color }} title={STAGE_META[p.stage].label} />
                </button>
              </li>
            ))}
            {data && filtered.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-muted">No one matches “{search}”.</li>}
          </ul>
        </Card>

        <Card className="rise">
          {!person ? (
            data ? (
              <EmptyState icon={<UserRound className="h-5 w-5" />} title="No consultants yet" description="Upload a CSV to start the pipeline." />
            ) : (
              <Skeleton className="h-96 w-full" />
            )
          ) : (
            <div key={person.id} className="rise">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={person.name} size={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[20px] font-semibold tracking-tight">{person.name}</h2>
                  <p className="truncate text-[13px] text-muted">
                    {[person.title, person.technology, person.visaStatus].filter(Boolean).join(' · ') || person.email}
                  </p>
                </div>
                <StagePill stage={person.stage} />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">{closed ? `Closed as ${STAGE_META[person.stage].label.toLowerCase()}` : `${completed} of ${PROGRESS_STAGES.length} stages complete`}</span>
                  <span className="font-semibold tabular-nums text-fg">{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-accent-2 transition-transform duration-[250ms] ease-out"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </div>
              </div>

              <div className="mt-7 grid gap-8 md:grid-cols-[1fr_220px]">
                <JourneyTimeline stage={person.stage} />
                <dl className="space-y-3 text-[13px]">
                  {[
                    ['Email', person.email],
                    ['Phone', person.phone],
                    ['Seniority', person.seniority],
                    ['Decision maker', person.decisionMaker ? 'Yes' : 'Not yet'],
                    ['Email status', person.emailStatus],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11.5px] uppercase tracking-[0.1em] text-faint">{label}</dt>
                      <dd className="mt-0.5 break-words text-fg">{value || <span className="text-faint">Not set</span>}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
