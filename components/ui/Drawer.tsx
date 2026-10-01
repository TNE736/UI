'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/format';

/**
 * One drawer for the whole app: a bottom sheet on phones, a panel sliding in
 * from the right from `sm` up. It enters and leaves along the same edge
 * (spatial consistency), 300 ms on the drawer curve; reduced motion fades.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  width = 440,
  header,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  width?: number;
  /** Replaces the default title row (the title is still used for the accessible name). */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/35 transition-opacity duration-300 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          style={{ '--drawer-w': `${width}px` } as React.CSSProperties}
          className={cn(
            'fixed z-50 flex flex-col bg-surface shadow-pop outline-none',
            // Phone: bottom sheet.
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-hero',
            // sm+: right-hand panel.
            'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(var(--drawer-w),100vw)] sm:rounded-none sm:border-l sm:border-line',
            'transition-transform duration-300 [transition-timing-function:var(--ease-drawer)]',
            'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
            'sm:data-[starting-style]:translate-x-full sm:data-[starting-style]:translate-y-0 sm:data-[ending-style]:translate-x-full sm:data-[ending-style]:translate-y-0',
            'motion-reduce:transition-opacity motion-reduce:data-[starting-style]:translate-x-0 motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[starting-style]:opacity-0 motion-reduce:data-[ending-style]:translate-x-0 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[ending-style]:opacity-0'
          )}
        >
          {/* Grab handle on phones. */}
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
          {header ?? (
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <Dialog.Title className="font-display text-[20px] font-semibold text-ink">{title}</Dialog.Title>
                {description && <Dialog.Description className="mt-0.5 text-[13px] text-muted">{description}</Dialog.Description>}
              </div>
              <DrawerClose />
            </div>
          )}
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="shrink-0 border-t border-line px-5 py-4">{footer}</div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DrawerClose({ className }: { className?: string }) {
  return (
    <Dialog.Close
      aria-label="Close"
      className={cn('press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted hover:bg-surface-3 hover:text-ink', className)}
    >
      <X className="h-4 w-4" />
    </Dialog.Close>
  );
}

export const DrawerTitle = Dialog.Title;
