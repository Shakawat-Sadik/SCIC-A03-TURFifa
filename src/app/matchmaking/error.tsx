'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function MatchmakingError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="Matchmaking"
      description="We couldn't load open teams and the difficulty ladder. Your existing contracts are unaffected."
    />
  );
}
