'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function PlayerDashboardError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="Your dashboard"
      description="We couldn't load your bookings and match data. Your reservations are safe — this is a display problem."
    />
  );
}
