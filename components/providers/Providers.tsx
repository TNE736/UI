'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { LiveProvider } from '@/lib/live';

/** Sonner defaults to the light theme; follow the app's theme instead. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: 'var(--font-geist-sans)' } }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <LiveProvider>
        {children}
        <ThemedToaster />
      </LiveProvider>
    </ThemeProvider>
  );
}
