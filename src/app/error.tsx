'use client';

import { RouteError, type RouteErrorProps } from '@/components/shared/route-error';

export default function AppError(props: RouteErrorProps) {
  return <RouteError {...props} />;
}
