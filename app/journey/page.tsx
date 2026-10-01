'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react';
import type { ConsultantPage } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { ALL_STAGES, PROGRESS_STAGES, STAGE_META, isClosing, nextStepFor, progressIndex } from '@/lib/stages';
import { cn } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StagePill } from '@/components/ui/StagePill';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRows, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { DataStamp } from '@/components/ui/DataStamp';
import { JourneyTimeline } from '@/components/consultants/JourneyTimeline';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function JourneyPage() {
  return (
    <Suspense>
      <Journey />
    </Suspense>
  );
}

function Journey() {
  const { data, error, fetching, updatedAt, retry } = useResource<ConsultantPage>(
    '/api/consultants?pageSize=1000&sort=created&dir=desc'
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const reduce = useReducedMotion();

  const people = useMemo(() => data?.rows ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return people.filter(
      (p) =>
        (!stage || p.stage === stage) &&
        (!needle || [p.name, p.email, p.technology, p.title].some((field) => field?.toLowerCase().includes(needle)))
    );
  }, [people, search, stage]);

  const selectedId = searchParams.get('id') ?? filtered[0]?.id ?? people[0]?.id ?? null;
  const person = people.find((p) => p.id === selectedId) ?? null;
  const select = (id: string) => router.replace(`/journey?id=${id}`, { scroll: false });
  const position = person ? filtered.findIndex((p) => p.id === person.id) : -1;
  const step = (delta: number) => {
    const target = filtered[position + delta];
    if (target) select(target.id);
  };

  // Arriving from a link (command menu, detail sheet): bring the person into view in the list.
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, data]);

  const closed = person ? isClosing(person.stage) : false;
  const index = person ? progressIndex(person.stage) : 0;
  const completed = person ? (closed ? 1 : index + 1) : 0;
  const progress = completed / PROGRESS_STAGES.length;
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of people) counts[p.stage] = (counts[p.stage] ?? 0) + 1;
    return counts;
  }, [people]);

  return (
    <>
      <PageHeader
        index="05"
        eyebrow="Trace"
        title="One consultant,"
        accent="end to end."
        description="Pick anyone to see how far they’ve come, where they came from and what happens next."
      >
        <DataStamp updatedAt={updatedAt} fetching={fetching} onRefresh={retry} />
      </PageHeader>

      {error && (
        <div className="mb-5">
          <ErrorState title={data ? 'Showing the last good data' : 'Couldn’t load consultants'} message={error} onRetry={retry} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* People */}
        <Card flush className="rise order-2 overflow-hidden lg:order-1" eyebrow="People" title={data ? `${filtered.length.toLocaleString()} of ${people.length.toLocaleString()}` : "Loading…"}>
          <div className="space-y-2.5 border-y border-line p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people…"
                aria-label="Search consultants"
                className="h-9 w-full rounded-control border border-line bg-surface-2 pl-9 pr-3 text-[14px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent/60 focus:shadow-[0_0_0_3px_var(--accent-soft)] sm:text-[13px]"
              />
            </label>
            <FilterSelect
              block
              label="Stage"
              anyLabel="All"
              value={stage}
              onChange={setStage}
              options={ALL_STAGES.filter((s) => stageCounts[s]).map((s) => ({ value: s, label: STAGE_META[s].label, count: stageCounts[s] }))}
            />
          </div>
          <ul className="thin-scroll max-h-[340px] overflow-y-auto p-1.5 lg:max-h-[620px]">
            {!data && (
              <li className="p-2">
                <SkeletonRows rows={8} />
              </li>
            )}
            {filtered.map((p) => {
              const active = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    ref={active ? activeRef : undefined}
                    type="button"
                    onClick={() => select(p.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-field px-2.5 py-2 text-left transition-colors duration-150',
                      active ? 'text-on-ink' : 'hover:bg-surface-2'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="journey-active"
                        transition={{ type: 'tween', duration: 0.2, ease: EASE_OUT }}
                        className="absolute inset-0 rounded-field bg-ink"
                        aria-hidden
                      />
                    )}
                    <Avatar name={p.name} size={30} className="relative" />
                    <span className="relative min-w-0 flex-1">
                      <span className={cn('block truncate text-[13px] font-medium', active ? 'text-on-ink' : 'text-ink')}>{p.name}</span>
                      <span className={cn('block truncate text-[11.5px]', active ? 'text-on-ink-faint' : 'text-faint')}>
                        {p.technology ?? p.email}
                      </span>
                    </span>
                    <span
                      className="relative h-2 w-2 shrink-0 rounded-full ring-2 ring-surface"
                      style={{ background: STAGE_META[p.stage].color }}
                      title={STAGE_META[p.stage].label}
                    />
                  </button>
                </li>
              );
            })}
            {data && filtered.length === 0 && (
              <li className="px-3 py-8 text-center text-[13px] text-muted">No one matches these filters.</li>
            )}
          </ul>
        </Card>

        {/* Profile + lifecycle */}
        <Card className="order-1 overflow-hidden lg:order-2">
          {!person ? (
            data ? (
              <EmptyState icon={<UserRound className="h-5 w-5" />} title="No consultants yet" description="Upload a CSV to start the pipeline." />
            ) : (
              <Skeleton className="h-96 w-full" />
            )
          ) : (
            <div key={person.id}>
              {/* Header */}
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={person.name} size={56} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-[30px] font-semibold leading-tight text-ink">{person.name}</h2>
                  <p className="truncate text-[13.5px] text-muted">
                    {[person.title, person.technology, person.visaStatus].filter(Boolean).join(' · ') || person.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StagePill stage={person.stage} />
                    {person.optedOut ? (
                      <StatusBadge tone="danger">Opted out</StatusBadge>
                    ) : person.decisionMaker ? (
                      <StatusBadge tone="success">Approved</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Awaiting approval</StatusBadge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={position <= 0}
                    aria-label="Previous consultant"
                    className="press grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="num px-1 text-[12px] text-faint">
                    {position >= 0 ? `${position + 1} / ${filtered.length}` : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={position < 0 || position >= filtered.length - 1}
                    aria-label="Next consultant"
                    className="press grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink disabled:opacity-35"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Lifecycle strip: seven stations, filling up to where they are. */}
              <div className="mt-7 rounded-panel bg-surface-2 p-5">
                <div className="mb-4 flex items-baseline justify-between text-[12.5px]">
                  <span className="text-muted">
                    {closed
                      ? `Closed as ${STAGE_META[person.stage].label.toLowerCase()}`
                      : `${completed} of ${PROGRESS_STAGES.length} stages complete`}
                  </span>
                  <span className="t-figure text-[22px] text-ink">{Math.round(progress * 100)}%</span>
                </div>
                <ol className="grid grid-cols-7 gap-1.5">
                  {PROGRESS_STAGES.map((s, i) => {
                    const reached = !closed ? i <= index : i === 0;
                    return (
                      <li key={s} className="min-w-0">
                        <span className="block h-2 overflow-hidden rounded-full bg-surface-3">
                          <motion.span
                            className="block h-full origin-left rounded-full"
                            style={{ background: i === index && !closed ? 'var(--accent)' : 'var(--ink)' }}
                            initial={reduce ? false : { scaleX: 0 }}
                            animate={{ scaleX: reached ? 1 : 0 }}
                            transition={{ duration: 0.22, ease: EASE_OUT, delay: reduce ? 0 : i * 0.07 }}
                          />
                        </span>
                        <span
                          className={cn(
                            'mt-2 hidden truncate text-[11px] sm:block',
                            reached ? 'font-medium text-ink' : 'text-faint'
                          )}
                        >
                          {STAGE_META[s].label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <p className="t-label mb-4">Timeline</p>
                  <JourneyTimeline consultant={person} animate />
                </div>
                <aside className="space-y-5">
                  <div className="rounded-field bg-accent-soft p-4">
                    <p className="t-label text-accent">Next step</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{nextStepFor(person)}</p>
                  </div>
                  <dl className="space-y-3.5 text-[13px]">
                    {[
                      ['Email', person.email],
                      ['Phone', person.phone],
                      ['Seniority', person.seniority],
                      ['Visa status', person.visaStatus],
                      ['Email status', person.emailStatus],
                      ['Added', new Date(person.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="t-label">{label}</dt>
                        <dd className="mt-0.5 break-words text-ink">{value || <span className="text-faint">Not set</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
