'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/use-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays,
  MapPin,
  Clock,
  CreditCard,
  Star,
  Trophy,
  Target,
  Pencil,
  CalendarCheck,
  Inbox,
  Sword,
} from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingSlot {
  startTime: string;
  endTime: string;
  field?: { name: string; location?: string } | null;
}

interface Booking {
  id: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
  kickoffDate?: string;
  slot?: BookingSlot;
  scouter?: { name: string } | null;
  player?: { name: string } | null;
}

interface MockOffer {
  id: string;
  playerName: string;
  venue: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined' | 'requested';
  type: 'sent' | 'received';
  rating?: number;
  position?: string;
}

interface MockMatchLog {
  id: string;
  venue: string;
  location: string;
  date: string;
  score: string;
  starPlayer: string;
  goals: { name: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockOffers: MockOffer[] = [
  { id: '1', playerName: 'Kamal Hossain', venue: 'Tanvir Sports Complex', time: '18:00 - 19:00', status: 'pending', type: 'sent' },
  { id: '2', playerName: 'Sakib Hasan', venue: 'Prime Sports Hub', time: '20:00 - 21:00', status: 'accepted', type: 'received' },
  { id: '3', playerName: 'Naim Rahman', venue: 'Dhaka Futsal Arena', time: '17:00 - 18:00', status: 'requested', type: 'sent' },
  { id: '4', playerName: 'Fahim Shahriar', venue: 'Green Field Zone', time: '19:00 - 20:00', status: 'pending', type: 'received' },
  { id: '5', playerName: 'Rafi Ahmed', venue: 'Tanvir Sports Complex', time: '21:00 - 22:00', status: 'declined', type: 'sent' },
  { id: '6', playerName: 'Imtiaz Khan', venue: 'Prime Sports Hub', time: '16:00 - 17:00', status: 'accepted', type: 'sent', rating: 78, position: 'ST' },
  { id: '7', playerName: 'Tarek Mahmud', venue: 'Dhaka Futsal Arena', time: '18:00 - 19:00', status: 'pending', type: 'sent', rating: 72, position: 'CM' },
  { id: '8', playerName: 'Sabbir Hossain', venue: 'Green Field Zone', time: '20:00 - 21:00', status: 'requested', type: 'received', rating: 81, position: 'CAM' },
  { id: '9', playerName: 'Mehedi Hasan', venue: 'Tanvir Sports Complex', time: '17:00 - 18:00', status: 'pending', type: 'received', rating: 69, position: 'CB' },
  { id: '10', playerName: 'Arif Rahman', venue: 'Prime Sports Hub', time: '19:00 - 20:00', status: 'accepted', type: 'received', rating: 75, position: 'LW' },
];

const mockMatchLogs: MockMatchLog[] = [
  { id: '1', venue: 'Tanvir Sports Complex', location: 'Dhanmondi', date: '2026-06-28', score: '3-2', starPlayer: 'Rafi Ahmed', goals: [{ name: 'Rafi Ahmed', count: 2 }, { name: 'Sakib Hasan', count: 1 }] },
  { id: '2', venue: 'Prime Sports Hub', location: 'Mohammadpur', date: '2026-06-21', score: '1-1', starPlayer: 'Kamal Hossain', goals: [{ name: 'Kamal Hossain', count: 1 }] },
  { id: '3', venue: 'Dhaka Futsal Arena', location: 'Mirpur', date: '2026-06-14', score: '4-1', starPlayer: 'Rafi Ahmed', goals: [{ name: 'Naim Rahman', count: 2 }, { name: 'Rafi Ahmed', count: 1 }, { name: 'Fahim Shahriar', count: 1 }] },
  { id: '4', venue: 'Green Field Zone', location: 'Uttara', date: '2026-06-07', score: '2-3', starPlayer: 'Sakib Hasan', goals: [{ name: 'Sakib Hasan', count: 2 }, { name: 'Imtiaz Khan', count: 1 }] },
  { id: '5', venue: 'Tanvir Sports Complex', location: 'Dhanmondi', date: '2026-05-31', score: '0-0', starPlayer: '', goals: [] },
  { id: '6', venue: 'Prime Sports Hub', location: 'Mohammadpur', date: '2026-05-24', score: '5-1', starPlayer: 'Rafi Ahmed', goals: [{ name: 'Rafi Ahmed', count: 3 }, { name: 'Naim Rahman', count: 1 }, { name: 'Fahim Shahriar', count: 1 }] },
  { id: '7', venue: 'Dhaka Futsal Arena', location: 'Mirpur', date: '2026-05-17', score: '2-2', starPlayer: 'Kamal Hossain', goals: [{ name: 'Kamal Hossain', count: 1 }, { name: 'Tarek Mahmud', count: 1 }] },
  { id: '8', venue: 'Green Field Zone', location: 'Uttara', date: '2026-05-10', score: '1-4', starPlayer: 'Sakib Hasan', goals: [{ name: 'Sakib Hasan', count: 1 }] },
  { id: '9', venue: 'Tanvir Sports Complex', location: 'Dhanmondi', date: '2026-05-03', score: '3-0', starPlayer: 'Naim Rahman', goals: [{ name: 'Naim Rahman', count: 2 }, { name: 'Imtiaz Khan', count: 1 }] },
  { id: '10', venue: 'Prime Sports Hub', location: 'Mohammadpur', date: '2026-04-26', score: '2-1', starPlayer: 'Rafi Ahmed', goals: [{ name: 'Rafi Ahmed', count: 1 }, { name: 'Kamal Hossain', count: 1 }] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'completed':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20';
    case 'cancelled':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
    case 'pending':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function offerStatusColor(status: string) {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'declined':
    case 'rejected':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
    case 'pending':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'requested':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount?: number) {
  if (amount == null) return 'N/A';
  return `৳ ${amount.toLocaleString('en-BD')}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BookingCard({ booking }: { booking: Booking }) {
  const slot = booking.slot;
  const field = slot?.field;

  return (
    <Card className="py-4 gap-0">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: venue & time */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm truncate">{field?.name ?? 'Unknown Venue'}</span>
          </div>
          {field?.location && (
            <span className="text-xs text-muted-foreground pl-6">{field.location}</span>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
            {slot && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {slot.startTime} - {slot.endTime}
              </span>
            )}
            {booking.kickoffDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatDate(booking.kickoffDate)}
              </span>
            )}
          </div>
        </div>

        {/* Right: status & amount */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant="outline" className={statusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
          {booking.paymentStatus && (
            <Badge variant="outline" className="text-xs">
              <CreditCard className="size-3 mr-1" />
              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
            </Badge>
          )}
          {booking.amount != null && (
            <span className="text-sm font-semibold">{formatCurrency(booking.amount)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingSkeleton() {
  return (
    <Card className="py-4 gap-0">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PlayerDashboard() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/bookings?playerId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data.slice(0, 20) : []);
      }
    } catch {
      // silently fail
    } finally {
      setBookingsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /* -- Offers data -- */
  const joinRequestsSent = mockOffers.filter((o) => o.type === 'sent');
  const joinOffersReceived = mockOffers.filter((o) => o.type === 'received');
  const scoutOffersExtended = mockOffers.filter((o) => o.type === 'sent' && o.rating != null);
  const scoutApplicants = mockOffers.filter((o) => o.type === 'received' && o.rating != null);

  const handleOfferAction = (action: 'accept' | 'decline' | 'approve' | 'reject') => {
    toast(`${action.charAt(0).toUpperCase() + action.slice(1)} action recorded!`);
  };

  /* -- Match logs -- */
  const maxDate = new Date(mockMatchLogs[0]?.date ?? 0).getTime();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Player Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your bookings, offers, and match history</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('explore')}>
          <CalendarCheck className="size-4 mr-1.5" />
          Book a Slot
        </Button>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="bookings" className="flex-1 sm:flex-none">
            <CalendarDays className="size-4 mr-1.5 hidden sm:inline-block" />
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex-1 sm:flex-none">
            <Sword className="size-4 mr-1.5 hidden sm:inline-block" />
            Offers &amp; Requests
          </TabsTrigger>
          <TabsTrigger value="gameweeks" className="flex-1 sm:flex-none">
            <Trophy className="size-4 mr-1.5 hidden sm:inline-block" />
            Gameweeks Ledger
          </TabsTrigger>
        </TabsList>

        {/* ---- TAB 1: My Bookings ---- */}
        <TabsContent value="bookings">
          {bookingsLoading ? (
            <div className="flex flex-col gap-3 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <BookingSkeleton key={i} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No bookings yet"
              description="Explore turfs to book your first slot!"
            />
          ) : (
            <ScrollArea className="max-h-[600px] mt-4">
              <div className="flex flex-col gap-3 pr-2">
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* ---- TAB 2: Offers & Requests ---- */}
        <TabsContent value="offers">
          <Tabs defaultValue="join" className="mt-4">
            <TabsList>
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="scout">Scout</TabsTrigger>
            </TabsList>

            {/* Join sub-filter */}
            <TabsContent value="join">
              <div className="space-y-6 mt-4">
                {/* Requests Sent */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Requests Sent ({joinRequestsSent.length})
                  </h3>
                  {joinRequestsSent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No requests sent yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {joinRequestsSent.map((offer) => (
                        <Card key={offer.id} className="py-3 gap-0">
                          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <span className="font-medium text-sm truncate">{offer.playerName}</span>
                              <span className="text-xs text-muted-foreground">{offer.venue} &middot; {offer.time}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={offerStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Offers Received */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Offers Received ({joinOffersReceived.length})
                  </h3>
                  {joinOffersReceived.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No offers received yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {joinOffersReceived.map((offer) => (
                        <Card key={offer.id} className="py-3 gap-0">
                          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <span className="font-medium text-sm truncate">{offer.playerName}</span>
                              <span className="text-xs text-muted-foreground">{offer.venue} &middot; {offer.time}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={offerStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                              {offer.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleOfferAction('accept')}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleOfferAction('decline')}>
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Scout sub-filter */}
            <TabsContent value="scout">
              <div className="space-y-6 mt-4">
                {/* Offers Extended */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Offers Extended ({scoutOffersExtended.length})
                  </h3>
                  {scoutOffersExtended.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No offers extended yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {scoutOffersExtended.map((offer) => (
                        <Card key={offer.id} className="py-3 gap-0">
                          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{offer.playerName}</span>
                                {offer.rating != null && (
                                  <Badge variant="outline" className="text-xs">{offer.rating} RAT</Badge>
                                )}
                                {offer.position && (
                                  <Badge variant="secondary" className="text-xs">{offer.position}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{offer.venue} &middot; {offer.time}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={offerStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applicants */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Applicants ({scoutApplicants.length})
                  </h3>
                  {scoutApplicants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applicants yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {scoutApplicants.map((offer) => (
                        <Card key={offer.id} className="py-3 gap-0">
                          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{offer.playerName}</span>
                                {offer.rating != null && (
                                  <Badge variant="outline" className="text-xs">{offer.rating} RAT</Badge>
                                )}
                                {offer.position && (
                                  <Badge variant="secondary" className="text-xs">{offer.position}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{offer.venue} &middot; {offer.time}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={offerStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                              {offer.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleOfferAction('approve')}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleOfferAction('reject')}>
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ---- TAB 3: Gameweeks Ledger ---- */}
        <TabsContent value="gameweeks">
          <ScrollArea className="max-h-[600px] mt-4">
            <div className="flex flex-col gap-3 pr-2">
              {mockMatchLogs.map((log) => {
                const logDate = new Date(log.date).getTime();
                const age = maxDate - logDate;
                const maxAge = maxDate - new Date(mockMatchLogs[mockMatchLogs.length - 1].date).getTime();
                const ageRatio = maxAge > 0 ? age / maxAge : 0;
                // Older = more faded: opacity from 1.0 down to 0.45
                const opacity = 1.0 - ageRatio * 0.55;

                return (
                  <Card
                    key={log.id}
                    className="py-4 gap-0"
                    style={{ opacity }}
                  >
                    <CardContent className="flex flex-col gap-2">
                      {/* Top row: venue, date, score */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{log.venue}</span>
                            <span className="text-xs">&middot; {log.location}</span>
                          </div>
                          <span className="text-xs text-muted-foreground pl-5.5">
                            {formatDate(log.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-2xl font-bold tracking-tight">{log.score}</span>
                          {log.starPlayer && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              <Star className="size-3 mr-1" />
                              {log.starPlayer}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Goals */}
                      {log.goals.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-border/50">
                          <Target className="size-3 text-muted-foreground" />
                          {log.goals.map((g) => (
                            <span key={g.name} className="text-xs text-muted-foreground">
                              {g.name}
                              {g.count > 1 && <span className="font-semibold ml-0.5">x{g.count}</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Edit Result button */}
                      <div className="pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground h-7"
                          onClick={() => toast('Edit mode coming soon')}
                        >
                          <Pencil className="size-3 mr-1" />
                          Edit Result
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}