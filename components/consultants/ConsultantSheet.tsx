'use client';

import { Dialog } from '@base-ui/react/dialog';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Briefcase, Code2, Mail, Phone, ShieldCheck, X } from 'lucide-react';
import type { Consultant } from '@/lib/types';
import { relativeTime } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { StagePill } from '@/components/ui/StagePill';
import { JourneyTimeline } from './JourneyTimeline';

/**
 * Side sheet with one consultant's details. Opened occasionally, so it gets a
 * standard drawer animation: slides from the right edge it lives on and
 * leaves the same way (spatial consistency), 300 ms on the iOS drawer curve.
 */
export function ConsultantSheet({
  consultant,
  onClose,
}: {
  consultant: Consultant | null;
  onClose: () => void;
}) {
  // Keep showing the last consultant while the sheet slides out.
  const [shown, setShown] = useState<Consultant | null>(consultant);
  if (consultant && consultant !== shown) setShown(consultant);

  return (
    <Dialog.Root open={consultant !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={[
            'fixed inset-y-0 right-0 z-50 flex w-[min(440px,100vw)] flex-col border-l border-line-strong bg-surface shadow-pop outline-none',
            'transition-transform duration-300 [transition-timing-function:var(--ease-drawer)]',
            'data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full',
            // Reduced motion: no slide, just appear.
            'motion-reduce:transition-none motion-reduce:data-[ending-style]:translate-x-0 motion-reduce:data-[starting-style]:translate-x-0',
          ].join(' ')}
        >
          {shown && <SheetBody consultant={shown} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetBody({ consultant: c }: { consultant: Consultant }) {
  const details = [
    { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
    { icon: Phone, label: 'Phone', value: c.phone, href: c.phone ? `tel:${c.phone}` : undefined },
    { icon: Code2, label: 'Technology', value: c.technology },
    { icon: Briefcase, label: 'Title', value: [c.title, c.seniority].filter(Boolean).join(' · ') || null },
    { icon: ShieldCheck, label: 'Visa status', value: c.visaStatus },
  ];

  return (
    <>
      <div className="flex items-start gap-3 border-b border-line p-5">
        <Avatar name={c.name} size={44} />
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate text-[17px] font-semibold tracking-tight">{c.name}</Dialog.Title>
          <Dialog.Description className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <StagePill stage={c.stage} />
            {c.decisionMaker && (
              <span className="rounded-full bg-success/12 px-2 py-0.5 font-medium text-success">Decision maker</span>
            )}
            {c.optedOut && <span className="rounded-full bg-danger/12 px-2 py-0.5 font-medium text-danger">Opted out</span>}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="press grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-4 w-4" />
        </Dialog.Close>
      </div>

      <div className="thin-scroll flex-1 space-y-6 overflow-y-auto p-5">
        <dl className="space-y-3">
          {details.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3 text-[13.5px]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
              <dt className="w-24 shrink-0 text-muted">{label}</dt>
              <dd className="min-w-0 break-words text-fg">
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
          ))}
        </dl>

        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Journey</p>
          <JourneyTimeline stage={c.stage} />
        </div>

        <p className="text-[12px] text-faint">
          Added {relativeTime(c.createdAt)}
          {c.emailStatus && <> · Email status: {c.emailStatus.toLowerCase()}</>}
        </p>
      </div>

      <div className="border-t border-line p-4">
        <Link
          href={`/journey?id=${c.id}`}
          className="press flex h-10 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface-2 text-sm font-medium transition-colors duration-150 hover:bg-surface-3"
        >
          Open in Journey <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
