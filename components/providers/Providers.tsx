'use client';

import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { LiveProvider } from '@/lib/live';
import { SystemStatusProvider } from '@/lib/useSystemStatus';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiveProvider>
      <SystemStatusProvider>
        {/* Honour the OS reduced-motion setting for every motion component. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </SystemStatusProvider>
      <Toaster
        theme="light"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'var(--font-inter)' } }}
      />
    </LiveProvider>
  );
}
