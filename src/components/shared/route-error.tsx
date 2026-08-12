'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Shared UI for every route-level error.tsx boundary (PRD §5).
// Each route's error.tsx stays a thin wrapper around this so the crash screen
// is consistent everywhere and there's exactly one copy of the markup.

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Short label for what failed, e.g. "Explore". Used in the headline. */
  surface?: string;
  description?: string;
  /** Secondary escape hatch shown next to Try Again. */
  backHref?: string;
  backLabel?: string;
}

export function RouteError({
  error,
  reset,
  surface,
  description,
  backHref = '/',
  backLabel = 'Go Home',
}: RouteErrorProps) {
  useEffect(() => {
    // Surfaces the real cause in the browser console; production error
    // reporting would hook in here.
    console.error(`[route error]${surface ? ` ${surface}:` : ''}`, error);
  }, [error, surface]);

  return (
    <div className="min-h-[60vh] flex flex-1 flex-col items-center justify-center px-4 text-center">
      {/* Red card */}
      <div className="mb-8">
        <svg viewBox="0 0 200 140" className="w-40 h-auto" fill="none" aria-hidden="true">
          <rect
            x="72"
            y="24"
            width="56"
            height="80"
            rx="5"
            className="fill-destructive"
            opacity="0.9"
            transform="rotate(-12 100 64)"
          />
          <line
            x1="40"
            y1="122"
            x2="160"
            y2="122"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
        </svg>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-3">
        Something went wrong
      </p>
      <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
        {surface ? `${surface} took a knock.` : 'That play broke down.'}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
        {description ??
          'We hit an unexpected error loading this page. Give it another go — if it keeps happening, the problem is on our side.'}
      </p>

      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground/70 font-mono">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
