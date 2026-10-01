'use client';

import { Tabs } from '@base-ui/react/tabs';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Briefcase,
  Code2,
  Copy,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  Zap,
} from 'lucide-react';
import type { Consultant } from '@/lib/types';
import { useLive } from '@/lib/live';
import { PROGRESS_STAGES, STAGE_META, isClosing, nextStepFor, progressIndex } from '@/lib/stages';
import { cn, relativeTime } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { StagePill } from '@/components/ui/StagePill';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Drawer, DrawerClose, DrawerTitle } from '@/components/ui/Drawer';
import { JourneyTimeline } from './JourneyTimeline';

const TABS = ['Profile', 'Qualification', 'Outreach', 'Journey', 'Activity'] as const;
type Tab = (typeof TABS)[number];

/**
 * A consultant's profile: a bottom sheet on phones, a right-hand panel from
 * `sm` up. Tabs keep a long record scannable; the header always shows who,
 * where they are, and whether they're approved.
 */
export function ConsultantSheet({ consultant, onClose }: { consultant: Consultant | null; onClose: () => void }) {
  // Keep showing the last consultant while the sheet slides out.
  const [shown, setShown] = useState<Consultant | null>(consultant);
  const [tab, setTab] = useState<Tab>('Profile');
  if (consultant && consultant !== shown) {
    setShown(consultant);
    if (consultant.id !== shown?.id) setTab('Profile');
  }

  return (
    <Drawer
      open={consultant !== null}
      onOpenChange={(open) => !open && onClose()}
      title={shown?.name ?? 'Consultant'}
      width={480}
      header={shown ? <SheetHeader c={shown} /> : undefined}
      footer={
        shown && (
          <Link
            href={`/journey?id=${shown.id}`}
            className="press flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-on-ink shadow-glow hover:bg-ink-hover"
          >
            Open in Journey <ArrowRight className="h-4 w-4" />
          </Link>
        )
      }
    >
      {shown && (
        <Tabs.Root value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <Tabs.List className="thin-scroll sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-surface/95 px-4 backdrop-blur">
            {TABS.map((t) => (
              <Tabs.Tab
                key={t}
                value={t}
                className="relative shrink-0 rounded-control px-2.5 py-3 text-[13px] font-medium text-muted outline-none transition-colors duration-150 hover:text-ink data-[active]:text-ink focus-visible:bg-surface-2 focus-visible:text-ink"
              >
                {t}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className="absolute bottom-0 left-[var(--active-tab-left)] h-[2px] w-[var(--active-tab-width)] rounded-full bg-accent transition-[left,width] duration-200 ease-out" />
          </Tabs.List>
          <div className="p-5">
            <Tabs.Panel value="Profile">
              <ProfileTab c={shown} />
            </Tabs.Panel>
            <Tabs.Panel value="Qualification">
              <QualificationTab c={shown} />
            </Tabs.Panel>
            <Tabs.Panel value="Outreach">
              <OutreachTab c={shown} />
            </Tabs.Panel>
            <Tabs.Panel value="Journey">
              <JourneyTimeline consultant={shown} animate key={shown.id} />
            </Tabs.Panel>
            <Tabs.Panel value="Activity">
              <ActivityTab c={shown} />
            </Tabs.Panel>
          </div>
        </Tabs.Root>
      )}
    </Drawer>
  );
}

function SheetHeader({ c }: { c: Consultant }) {
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-line px-5 pb-5 pt-4">
      <span aria-hidden className="flow-grid absolute inset-0 opacity-50" />
      <div className="relative flex items-start gap-4">
        <Avatar name={c.name} size={52} />
        <div className="min-w-0 flex-1">
          <DrawerTitle className="font-display truncate text-[23px] font-semibold leading-tight text-ink">{c.name}</DrawerTitle>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {[c.title, c.technology].filter(Boolean).join(' · ') || c.email}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StagePill stage={c.stage} />
            {c.optedOut ? (
              <StatusBadge tone="danger">Opted out</StatusBadge>
            ) : c.decisionMaker ? (
              <StatusBadge tone="success">Approved</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Awaiting approval</StatusBadge>
            )}
          </div>
        </div>
        <DrawerClose />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
  copy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  href?: string;
  copy?: boolean;
}) {
  return (
    <div className="group flex items-center gap-3 py-3 text-[13.5px]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-surface-2 text-faint">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11.5px] text-faint">{label}</dt>
        <dd className="truncate text-ink">
          {value ? (
            href ? (
              <a href={href} className="underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-faint">Not set</span>
          )}
        </dd>
      </div>
      {copy && value && (
        <button
          type="button"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied`))}
          className="press grid h-8 w-8 place-items-center rounded-control text-faint hover:bg-surface-2 hover:text-ink"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ProfileTab({ c }: { c: Consultant }) {
  return (
    <dl className="divide-y divide-line">
      <Row icon={Mail} label="Email" value={c.email} href={`mailto:${c.email}`} copy />
      <Row icon={Phone} label="Phone" value={c.phone} href={c.phone ? `tel:${c.phone}` : undefined} copy />
      <Row icon={Code2} label="Technology" value={c.technology} />
      <Row icon={Briefcase} label="Title" value={c.title} />
      <Row icon={GraduationCap} label="Seniority" value={c.seniority} />
      <Row icon={ShieldCheck} label="Visa status" value={c.visaStatus} />
    </dl>
  );
}

function QualificationTab({ c }: { c: Consultant }) {
  const closed = isClosing(c.stage);
  const index = progressIndex(c.stage);
  const progress = closed ? 0 : index / (PROGRESS_STAGES.length - 1);
  return (
    <div className="space-y-5">
      <div className="rounded-field bg-surface-2 p-4">
        <p className="t-label">Next step</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{nextStepFor(c)}</p>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between text-[13px]">
          <span className="text-muted">Pipeline progress</span>
          <span className="num font-medium text-ink">
            {closed ? 'Closed' : `Stage ${index + 1} of ${PROGRESS_STAGES.length}`}
          </span>
        </div>
        <div className="flex gap-1">
          {PROGRESS_STAGES.map((s, i) => (
            <span
              key={s}
              title={STAGE_META[s].label}
              className={cn('h-1.5 flex-1 rounded-full', !closed && i <= index ? 'bg-accent' : 'bg-surface-3')}
            />
          ))}
        </div>
        <p className="num mt-2 text-[12px] text-faint">{Math.round(progress * 100)}% of the way to hand-off</p>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-field bg-line text-[13px]">
        {[
          ['Stage', STAGE_META[c.stage].label],
          ['Decision maker', c.decisionMaker ? 'Yes' : 'No'],
          ['Opted out', c.optedOut ? 'Yes' : 'No'],
          ['Seniority', c.seniority ?? 'Not set'],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface px-4 py-3">
            <dt className="t-label">{k}</dt>
            <dd className="mt-1 font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function OutreachTab({ c }: { c: Consultant }) {
  const emailed = progressIndex(c.stage) >= 1 && !isClosing(c.stage);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-field bg-surface-2 p-4">
        <div>
          <p className="t-label">Email status</p>
          <p className="mt-1.5 text-[15px] font-medium text-ink">{c.emailStatus ? c.emailStatus.toLowerCase() : 'No email recorded'}</p>
        </div>
        <StatusBadge tone={c.emailStatus ? 'success' : 'neutral'}>{c.emailStatus ? 'Recorded' : 'Pending'}</StatusBadge>
      </div>
      <ul className="space-y-2.5 text-[13.5px]">
        <Check2 ok={c.decisionMaker}>Approved for outreach (decision maker)</Check2>
        <Check2 ok={emailed}>Reached the Emailed stage</Check2>
        <Check2 ok={!c.optedOut}>{c.optedOut ? 'Opted out of contact' : 'Has not opted out'}</Check2>
      </ul>
      <p className="text-[12px] leading-relaxed text-faint">
        Outreach is sent by bench-outreach&rsquo;s Email Agent. This dashboard reads its results from MongoDB; it does not send email.
      </p>
    </div>
  );
}

function Check2({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={cn('h-2 w-2 rounded-full', ok ? 'bg-success' : 'bg-line-strong')} aria-hidden />
      <span className={ok ? 'text-ink' : 'text-muted'}>{children}</span>
      <span className="sr-only">{ok ? '(yes)' : '(no)'}</span>
    </li>
  );
}

function ActivityTab({ c }: { c: Consultant }) {
  const { events } = useLive();
  const mine = events.filter((e) => e.leadId === c.id);
  return (
    <div>
      <ol className="space-y-4">
        {mine.map((e) => (
          <li key={e.id} className="flex items-start gap-3 text-[13px]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-on-ink">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{e.type}</span>
              <span className="block text-[12px] text-faint">
                {e.source} · {e.status}
              </span>
            </span>
            <span className="num text-[12px] text-faint">{relativeTime(e.timestamp)}</span>
          </li>
        ))}
        <li className="flex items-start gap-3 text-[13px]">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
            <UserPlus className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-ink">Record created</span>
            <span className="block text-[12px] text-faint">Saved to MongoDB from a CSV upload</span>
          </span>
          <span className="num text-[12px] text-faint" title={new Date(c.createdAt).toLocaleString()}>
            {relativeTime(c.createdAt)}
          </span>
        </li>
      </ol>
      <p className="mt-5 text-[12px] leading-relaxed text-faint">
        Live events appear here while this tab is open. MongoDB doesn&rsquo;t keep a per-stage history, so earlier changes aren&rsquo;t listed.
      </p>
    </div>
  );
}
