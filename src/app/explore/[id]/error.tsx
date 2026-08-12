'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function VenueDetailError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="This venue"
      description="We couldn't load this turf's details. It may have been removed, or we hit a temporary problem."
      backHref="/explore"
      backLabel="Back to Explore"
    />
  );
}
