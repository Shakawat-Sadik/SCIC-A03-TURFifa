'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function ExploreError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="Explore"
      description="We couldn't load the turf listings just now. Retry, or head back home while we sort it out."
    />
  );
}
