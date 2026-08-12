'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function ManagerDashboardError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="Your venue console"
      description="We couldn't load your turfs, slots, or booking queue. Your inventory is unchanged — this is a display problem."
    />
  );
}
