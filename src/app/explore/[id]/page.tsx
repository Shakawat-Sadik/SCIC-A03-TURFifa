'use client';

import { use, useEffect } from 'react';
import { useAppStore } from '@/store/use-store';
import { VenueDetailView } from '@/components/explore/venue-detail';

export default function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const setSelectedVenueId = useAppStore((s) => s.setSelectedVenueId);

  useEffect(() => {
    setSelectedVenueId(id);
  }, [id, setSelectedVenueId]);

  return <VenueDetailView />;
}
