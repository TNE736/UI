'use client';

import { ErrorState } from '@/components/ui/States';

/** Route-level safety net: a render error shows this instead of a blank page. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <ErrorState title="This page hit a problem." message={error.message} onRetry={reset} />
    </div>
  );
}
