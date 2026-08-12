'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function AdminDashboardError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="The admin console"
      description="We couldn't load the auditing feed or dispute queue. No moderation actions were lost."
    />
  );
}
