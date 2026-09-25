'use client';

import { Toaster } from 'sonner';
import { LiveProvider } from '@/lib/live';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiveProvider>
      {children}
      <Toaster
        theme="light"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'var(--font-geist-sans)' } }}
      />
    </LiveProvider>
  );
}
