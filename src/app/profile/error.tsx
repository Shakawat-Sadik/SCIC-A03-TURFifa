'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function ProfileError(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      surface="Your profile"
      description="We couldn't load your player card and attribute ratings. Nothing has been changed."
    />
  );
}
