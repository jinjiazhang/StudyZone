'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

/**
 * Global error boundary for the app. Next.js renders this when a route throws
 * during render. `reset()` re-attempts to render the segment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for now; wire to Sentry when observability lands.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <ErrorState
        title="页面崩溃了"
        description="我们记录了这个错误。你可以重试，或返回首页。"
        onRetry={reset}
        className="max-w-sm"
      />
    </main>
  );
}
