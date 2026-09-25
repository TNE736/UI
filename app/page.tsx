'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Overview } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { useLive } from '@/lib/live';
import { NAV } from '@/components/shell/nav';
import { Waves } from '@/components/home/Waves';
import { pillPrimary, pillSecondary } from '@/components/ui/PageHeader';

const FLOW = [
  { title: 'Upload', text: 'A consultant CSV is checked in the browser and sent to the ingest API.' },
  { title: 'Store', text: 'New people land in MongoDB as “loaded”. Existing ones are never overwritten.' },
  { title: 'Approve', text: 'Marking someone a decision maker in Compass releases them to outreach.' },
  { title: 'Reach out', text: 'bench-outreach’s Email Agent sends a role that matches their title.' },
  { title: 'Qualify', text: 'Replies are researched, followed up and handed to the Bench TA team.' },
];

export default function HomePage() {
  const { data } = useResource<Overview>('/api/overview');
  const { status } = useLive();
  const explore = NAV.filter((item) => item.href !== '/');

  return (
    <>
      {/* Hero */}
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mt-8">
        <Waves />
        <div className="rise relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="eyebrow mb-7 justify-center">
            <span aria-hidden className="h-px w-10 bg-accent/50" />
            <span>LeadOps Studio</span>
            <span aria-hidden className="h-px w-10 bg-accent/50" />
          </p>

          <h1 className="font-display text-[46px] font-semibold leading-[1.02] text-ink sm:text-[68px] lg:text-[84px]">
            Every consultant,
            <br />
            one living <em className="font-medium italic text-accent">pipeline.</em>
          </h1>

          <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-muted">
            Upload a roster, watch it land in MongoDB, and follow each consultant from the first email to the
            hand-off — as it happens.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/overview" className={pillPrimary}>
              Open the overview <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/upload" className={pillSecondary}>
              Upload a CSV
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {data ? `${data.total} consultants in MongoDB` : 'Reading MongoDB…'}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {data ? `${data.reached.emailed ?? 0} emailed so far` : 'Counting outreach…'}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {status === 'live' ? 'Live updates on' : 'Refreshing every 15 seconds'}
            </li>
          </ul>
        </div>
      </section>

      {/* How it flows */}
      <section className="mx-auto max-w-6xl py-16">
        <p className="eyebrow mb-4">
          <span className="font-display text-[13px] font-medium tracking-normal">01</span>
          <span className="text-muted">How it flows</span>
          <span aria-hidden className="h-px w-16 bg-line-strong" />
        </p>
        <h2 className="font-display max-w-2xl text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">
          From a spreadsheet to a <em className="font-medium italic text-accent">conversation.</em>
        </h2>

        <ol className="mt-10 grid gap-px overflow-hidden rounded-[22px] bg-line shadow-card sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map((step, index) => (
            <li key={step.title} className="bg-surface p-6">
              <span className="font-display text-[15px] font-medium text-accent">0{index + 1}</span>
              <p className="font-display mt-3 text-[22px] font-semibold text-ink">{step.title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Explore */}
      <section className="mx-auto max-w-6xl pb-10">
        <p className="eyebrow mb-4">
          <span className="font-display text-[13px] font-medium tracking-normal">02</span>
          <span className="text-muted">Explore</span>
          <span aria-hidden className="h-px w-16 bg-line-strong" />
        </p>
        <h2 className="font-display max-w-2xl text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">
          Pick a place to <em className="font-medium italic text-accent">start.</em>
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {explore.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="press group flex flex-col rounded-[22px] bg-surface p-6 shadow-card transition-shadow duration-200 ease-out hover:shadow-pop"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-faint transition-colors duration-150 group-hover:text-accent" strokeWidth={1.75} />
                <ArrowUpRight className="h-4 w-4 text-faint transition-[color,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
              </div>
              <p className="font-display mt-8 text-[24px] font-semibold text-ink">{label}</p>
              <p className="mt-1.5 text-[13.5px] text-muted">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
