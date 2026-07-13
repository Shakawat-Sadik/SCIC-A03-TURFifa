'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type UserData } from '@/store/use-store';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Layers,
  Timer,
  Sparkles,
  Loader2,
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

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string };
}

interface VenueDetailData {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
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
  reviews: ReviewData[];
  ratingDistribution: Record<number, number>;
  _count: { bookingContracts: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIME_TYPE_COLORS: Record<string, string> = {
  morning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  afternoon: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  evening: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  night: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Gallery Placeholders ────────────────────────────────────────────────────

const GRADIENTS = [
  'from-emerald-400/20 to-teal-500/10',
  'from-amber-400/20 to-orange-500/10',
  'from-rose-400/20 to-pink-500/10',
];

function GalleryPlaceholders({ count }: { count: number }) {
  const show = Math.max(3, count);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: show }).map((_, i) => (
        <div
          key={i}
          className={`h-48 sm:h-56 rounded-lg bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
        >
          <span className="text-muted-foreground/30 text-4xl font-bold select-none">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Star Display ────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'size-5' : 'size-4';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Rating Distribution ─────────────────────────────────────────────────────

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
              <span className="font-medium">{star}</span>
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground w-8 text-right tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Slot Card ───────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  user,
  onBook,
  bookingId,
}: {
  slot: SlotData;
  user: UserData | null;
  onBook: (slot: SlotData) => void;
  bookingId: string | null;
}) {
  const isPlayer = user?.role === 'player';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {slot.startTime} – {slot.endTime}
          </span>
        </div>
        <Badge
          variant="secondary"
          className={`w-fit text-xs ${TIME_TYPE_COLORS[slot.timeType] ?? ''}`}
        >
          {slot.timeType.charAt(0).toUpperCase() + slot.timeType.slice(1)}
        </Badge>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          {slot.promoPrice !== null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground line-through">
                BDT {slot.basePrice}
              </span>
              <span className="font-semibold text-primary">
                BDT {slot.promoPrice}
              </span>
            </div>
          ) : (
            <span className="font-semibold">BDT {slot.basePrice}</span>
          )}
          <span className="text-xs text-muted-foreground block">/hr</span>
        </div>

        {isPlayer ? (
          <Button
            size="sm"
            disabled={bookingId === slot.id}
            onClick={() => onBook(slot)}
          >
            {bookingId === slot.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Book Now'
            )}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Login as player to book
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Venue Detail View ───────────────────────────────────────────────────────

export function VenueDetailView() {
  const { selectedVenueId, navigate, user } = useAppStore();
  const { toast } = useToast();

  const [venue, setVenue] = useState<VenueDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const fetchVenue = useCallback(async () => {
    if (!selectedVenueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/turfs/${selectedVenueId}`);
      if (!res.ok) throw new Error('Failed to fetch venue');
      const data: VenueDetailData = await res.json();
      setVenue(data);
    } catch {
      setVenue(null);
      toast({
        title: 'Error',
        description: 'Failed to load venue details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedVenueId, toast]);

  useEffect(() => {
    fetchVenue();
  }, [fetchVenue]);

  const handleBook = async (slot: SlotData) => {
    if (!user?.player?.id) return;
    setBookingId(slot.id);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          playerId: user.player.id,
          scouterId: user.player.id,
          amount: slot.basePrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Booking failed');
      }

      toast({
        title: 'Booking confirmed!',
        description: `Slot ${slot.startTime}–${slot.endTime} has been booked.`,
      });

      // Re-fetch to update available slots
      fetchVenue();
    } catch (err) {
      toast({
        title: 'Booking failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setBookingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col gap-6">
          <Skeleton className="h-9 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Venue not found.</p>
          <Button variant="link" onClick={() => navigate('explore')} className="mt-2">
            Back to Explore
          </Button>
        </div>
      </main>
    );
  }

  const availableSlots = venue.slots.filter((s) => s.lifecycle === 'available');
  const allReviews = venue.reviews;
  const totalReviews = allReviews.length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col gap-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 -ml-2"
          onClick={() => navigate('explore')}
        >
          <ArrowLeft className="size-4" />
          Back to Explore
        </Button>

        {/* Gallery */}
        <section aria-label="Venue images">
          <GalleryPlaceholders count={Math.max(venue.imageUrls.length, 3)} />
        </section>

        {/* Overview */}
        <section>
          <h1 className="text-2xl font-bold tracking-tight">{venue.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {venue.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {venue.rating.toFixed(1)}
              </span>
              <span>({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
            </span>
          </div>
          <StarDisplay rating={venue.rating} size="md" />
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {venue.fullDescription}
          </p>
        </section>

        <Separator />

        {/* Key Specifications */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Key Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="py-4 gap-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Layers className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surface Type</p>
                  <p className="font-medium text-sm">{venue.surfaceType}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="py-4 gap-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Supported Formats</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {venue.supportedFormats.map((fmt) => (
                      <Badge key={fmt} variant="secondary" className="text-xs">
                        {fmt}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-4 gap-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-medium text-sm">
                    {venue.openingTime} – {venue.closingTime}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="py-4 gap-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Timer className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Slot Duration</p>
                  <p className="font-medium text-sm">{venue.slotDurationMins} minutes</p>
                </div>
              </CardContent>
            </Card>

            {venue.amenities.length > 0 && (
              <Card className="py-4 gap-0 sm:col-span-2 lg:col-span-2">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {venue.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Separator />

        {/* Available Slots */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Available Time Slots</h2>
          {availableSlots.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No slots currently available.
            </p>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="morning">Morning</TabsTrigger>
                <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                <TabsTrigger value="evening">Evening</TabsTrigger>
                <TabsTrigger value="night">Night</TabsTrigger>
              </TabsList>

              {['all', 'morning', 'afternoon', 'evening', 'night'].map((tab) => {
                const filtered =
                  tab === 'all'
                    ? availableSlots
                    : availableSlots.filter((s) => s.timeType === tab);
                return (
                  <TabsContent key={tab} value={tab}>
                    <div className="flex flex-col gap-3 mt-2">
                      {filtered.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-6">
                          No slots available for this time.
                        </p>
                      ) : (
                        filtered.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            user={user}
                            onBook={handleBook}
                            bookingId={bookingId}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </section>

        <Separator />

        {/* Reviews */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          {totalReviews === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No reviews yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8">
              {/* Distribution */}
              <div>
                <h3 className="text-sm font-medium mb-3">Rating Distribution</h3>
                <RatingDistribution
                  distribution={venue.ratingDistribution}
                  total={totalReviews}
                />
              </div>

              {/* Review List */}
              <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1">
                {allReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{review.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <StarDisplay rating={review.rating} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}