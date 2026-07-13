'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAppStore } from '@/store/use-store';
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  timeType: string;
  basePrice: number;
  promoPrice: number | null;
  lifecycle: string;
}

interface VenueData {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  surfaceType: string;
  supportedFormats: string[];
  amenities: string[];
  imageUrls: string[];
  rating: number;
  openingTime: string;
  closingTime: string;
  slotDurationMins: number;
  slots: SlotData[];
  _count: { bookingContracts: number };
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function VenueCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="p-4 flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

// ─── Venue Card ──────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: VenueData }) {
  const { setSelectedVenueId, navigate } = useAppStore();

  const lowestSlotPrice = venue.slots.reduce(
    (min, s) => Math.min(min, s.promoPrice ?? s.basePrice),
    Infinity,
  );

  const cheapestSlot = venue.slots.reduce(
    (best, s) => {
      const price = s.promoPrice ?? s.basePrice;
      return price < (best.promoPrice ?? best.basePrice) ? s : best;
    },
    venue.slots[0],
  );

  const hasPromo = cheapestSlot && cheapestSlot.promoPrice !== null;

  return (
    <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      {/* Image placeholder */}
      <div className="h-40 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <span className="text-primary/30 text-5xl font-bold select-none">
          {venue.title.charAt(0)}
        </span>
      </div>

      <CardContent className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-base leading-tight">{venue.title}</h3>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{venue.location}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium">{venue.rating.toFixed(1)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {venue.surfaceType}
          </Badge>
          {venue.supportedFormats.map((fmt) => (
            <Badge key={fmt} variant="secondary" className="text-xs">
              {fmt}
            </Badge>
          ))}
        </div>

        <div className="pt-1">
          {hasPromo ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground line-through">
                BDT {cheapestSlot.basePrice}
              </span>
              <span className="text-sm font-semibold text-primary">
                BDT {cheapestSlot.promoPrice}
              </span>
              <span className="text-xs text-muted-foreground">/hr</span>
            </div>
          ) : (
            <p className="text-sm font-semibold">
              From BDT {lowestSlotPrice === Infinity ? '—' : lowestSlotPrice}
              <span className="font-normal text-muted-foreground">/hr</span>
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => {
            setSelectedVenueId(venue.id);
            navigate('venue-detail');
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Explore Page ────────────────────────────────────────────────────────────

export function ExplorePage() {
  const { navigate } = useAppStore();
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [surfaceType, setSurfaceType] = useState('');
  const [timeType, setTimeType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('latest');

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (surfaceType) params.set('surfaceType', surfaceType);
      if (timeType) params.set('timeType', timeType);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/turfs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch venues');
      const data: VenueData[] = await res.json();
      setVenues(data);
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [search, surfaceType, timeType, minPrice, maxPrice, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchVenues, 300);
    return () => clearTimeout(timer);
  }, [fetchVenues]);

  const clearFilters = () => {
    setSearch('');
    setSurfaceType('');
    setTimeType('');
    setMinPrice('');
    setMaxPrice('');
    setSort('latest');
  };

  const hasActiveFilters = surfaceType || timeType || minPrice || maxPrice || sort !== 'latest';

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Explore Turfs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find and book the perfect turf for your next match.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or location..."
            className="pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Bar */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-fit"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                  !
                </Badge>
              )}
              <ChevronDown
                className={`size-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3">
            <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
              {/* Surface Type */}
              <div className="grid gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">
                  Surface Type
                </label>
                <Select value={surfaceType} onValueChange={(v) => setSurfaceType(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="Artificial Turf">Artificial Turf</SelectItem>
                    <SelectItem value="Natural Grass">Natural Grass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Type */}
              <div className="grid gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">
                  Time Type
                </label>
                <Select value={timeType} onValueChange={(v) => setTimeType(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="flex items-end gap-2">
                <div className="grid gap-1.5 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground">
                    Min Price
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="h-9"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <span className="text-muted-foreground pb-2">–</span>
                <div className="grid gap-1.5 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground">
                    Max Price
                  </label>
                  <Input
                    type="number"
                    placeholder="9999"
                    className="h-9"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="grid gap-1.5 min-w-[160px]">
                <label className="text-xs font-medium text-muted-foreground">
                  Sort By
                </label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="price_asc">Price Low → High</SelectItem>
                    <SelectItem value="price_desc">Price High → Low</SelectItem>
                    <SelectItem value="rating_desc">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={clearFilters}
                >
                  <X className="size-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Venue Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No venues found matching your criteria.
            </h3>
            {hasActiveFilters && (
              <Button
                variant="link"
                className="mt-2"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}