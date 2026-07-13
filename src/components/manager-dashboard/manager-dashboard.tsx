'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Star,
  Clock,
  Plus,
  MapPin,
  Zap,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store/use-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

/* ---------- types ---------- */
interface Venue {
  id: string;
  name: string;
  location: string;
  surfaceType: string;
  rating: number;
  managerId: string;
  totalSlots?: number;
  availableSlots?: number;
}

interface Slot {
  id: string;
  fieldId: string;
  time: string;
  timeType: string;
  basePrice: number;
  promoPrice: number | null;
  lifecycle: string;
}

interface Booking {
  id: string;
  playerName: string;
  venue: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  amount: number;
  date: string;
  playerId?: string;
}

/* ---------- mock data ---------- */
const revenueData = [
  { month: 'Jan', peak: 85000, promo: 52000 },
  { month: 'Feb', peak: 72000, promo: 45000 },
  { month: 'Mar', peak: 95000, promo: 60000 },
  { month: 'Apr', peak: 110000, promo: 68000 },
  { month: 'May', peak: 98000, promo: 58000 },
  { month: 'Jun', peak: 125000, promo: 78000 },
  { month: 'Jul', peak: 130000, promo: 82000 },
  { month: 'Aug', peak: 115000, promo: 70000 },
  { month: 'Sep', peak: 105000, promo: 65000 },
  { month: 'Oct', peak: 90000, promo: 55000 },
  { month: 'Nov', peak: 88000, promo: 53000 },
  { month: 'Dec', peak: 95000, promo: 60000 },
];

const kpiData = [
  { label: 'Total Revenue', value: 'BDT 1,203,000', icon: TrendingUp, color: 'text-green-600' },
  { label: 'Monthly Bookings', value: '84', icon: Calendar, color: 'text-foreground' },
  { label: 'Avg Rating', value: '4.7', icon: Star, color: 'text-yellow-500' },
  { label: 'Active Slots', value: '156', icon: Clock, color: 'text-blue-500' },
];

/* ---------- helper ---------- */
function formatCurrency(val: number) {
  return `BDT ${val.toLocaleString()}`;
}

/* ====================================================================
   ManagerDashboard
   ==================================================================== */
export function ManagerDashboard() {
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('analytics');

  /* ---------- state for venues ---------- */
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [addVenueOpen, setAddVenueOpen] = useState(false);

  /* ---------- state for slots ---------- */
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  /* ---------- state for bookings ---------- */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  /* ---------- auto-generate dialog ---------- */
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [duration, setDuration] = useState('60');

  /* ---------- add venue form ---------- */
  const [newVenue, setNewVenue] = useState({ name: '', location: '', surfaceType: 'artificial_turf' });

  /* ---------- fetch venues ---------- */
  const fetchVenues = useCallback(async () => {
    setVenuesLoading(true);
    try {
      const res = await fetch('/api/turfs');
      if (res.ok) {
        const data = await res.json();
        const allVenues: Venue[] = Array.isArray(data) ? data : data.turfs ?? data.venues ?? [];
        // Filter by managerId if available
        const myVenues = user?.id
          ? allVenues.filter((v: Venue) => v.managerId === user.id)
          : allVenues;
        setVenues(myVenues);
      }
    } catch {
      toast.error('Failed to load venues');
    } finally {
      setVenuesLoading(false);
    }
  }, [user?.id]);

  /* ---------- fetch slots ---------- */
  const fetchSlots = useCallback(async (fieldId: string) => {
    if (!fieldId) return;
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/slots?fieldId=${fieldId}`);
      if (res.ok) {
        const data = await res.json();
        const arr: Slot[] = Array.isArray(data) ? data : data.slots ?? [];
        setSlots(arr);
      }
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  /* ---------- fetch bookings ---------- */
  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/bookings?playerId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const arr: Booking[] = Array.isArray(data) ? data : data.bookings ?? [];
        setBookings(arr);
      }
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  }, [user?.id]);

  /* ---------- load data on mount and tab change ---------- */
  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab, fetchBookings]);

  useEffect(() => {
    if (selectedVenueId) fetchSlots(selectedVenueId);
  }, [selectedVenueId, fetchSlots]);

  /* ---------- slot price save ---------- */
  const saveSlotPrice = async (slot: Slot, field: 'basePrice' | 'promoPrice', value: string) => {
    const num = value === '' ? 0 : Number(value);
    if (isNaN(num)) return;
    try {
      await fetch('/api/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          ...(field === 'basePrice' ? { basePrice: num } : { promoPrice: num || null }),
        }),
      });
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, [field]: num || null } : s)),
      );
      toast.success('Price updated');
    } catch {
      toast.error('Failed to update price');
    }
  };

  /* ---------- confirm booking ---------- */
  const confirmBooking = async (booking: Booking) => {
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed', paymentStatus: booking.paymentStatus }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'confirmed' } : b)),
      );
      toast.success('Booking confirmed');
    } catch {
      toast.error('Failed to confirm booking');
    }
  };

  /* ---------- cancel booking ---------- */
  const cancelBooking = async (booking: Booking) => {
    try {
      await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)),
      );
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  /* ---------- auto-generate slots ---------- */
  const autoGenerateSlots = async () => {
    if (!selectedVenueId) return;
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: selectedVenueId,
          openTime,
          closeTime,
          duration: Number(duration),
        }),
      });
      if (res.ok) {
        toast.success('Slots generated');
        setAutoGenOpen(false);
        fetchSlots(selectedVenueId);
      } else {
        toast.error('Failed to generate slots');
      }
    } catch {
      toast.error('Failed to generate slots');
    }
  };

  /* ---------- filtered slots ---------- */
  const filteredSlots = timeFilter === 'all'
    ? slots
    : slots.filter((s) => s.timeType === timeFilter);

  /* ---------- status badge helper ---------- */
  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      available: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'Available' },
      held: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Held' },
      booked: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Booked' },
      pending: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
      confirmed: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'Confirmed' },
      completed: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Completed' },
      cancelled: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
    };
    const info = map[status] ?? { cls: 'bg-muted text-muted-foreground', label: status };
    return <Badge variant="outline" className={info.cls}>{info.label}</Badge>;
  };

  const paymentBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      paid: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
      unpaid: { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Unpaid' },
      refunded: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Refunded' },
    };
    const info = map[status] ?? { cls: 'bg-muted text-muted-foreground', label: status };
    return <Badge variant="outline" className={info.cls}>{info.label}</Badge>;
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {user?.name ?? 'Manager'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="analytics">Business Analytics</TabsTrigger>
          <TabsTrigger value="venues">My Venues</TabsTrigger>
          <TabsTrigger value="inventory">Manage Inventory</TabsTrigger>
          <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: Business Analytics ========== */}
        <TabsContent value="analytics" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi) => (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{kpi.label}</CardDescription>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Revenue</CardTitle>
              <CardDescription>Peak vs Promo revenue over 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="promoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 70%, 55%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(142, 70%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => `${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border, #e5e7eb)' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="peak"
                      name="Peak Revenue"
                      stroke="hsl(142, 76%, 36%)"
                      fill="url(#peakGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="promo"
                      name="Promo Revenue"
                      stroke="hsl(142, 70%, 55%)"
                      fill="url(#promoGrad)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 2: My Venues ========== */}
        <TabsContent value="venues" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Venues ({venues.length})</h2>
            <Dialog open={addVenueOpen} onOpenChange={setAddVenueOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Add New Venue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Venue</DialogTitle>
                  <DialogDescription>Enter the details for your new venue.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="venue-name">Venue Name</Label>
                    <Input
                      id="venue-name"
                      placeholder="e.g. Green Arena"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-location">Location</Label>
                    <Input
                      id="venue-location"
                      placeholder="e.g. Dhanmondi, Dhaka"
                      value={newVenue.location}
                      onChange={(e) => setNewVenue({ ...newVenue, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-surface">Surface Type</Label>
                    <Select
                      value={newVenue.surfaceType}
                      onValueChange={(v) => setNewVenue({ ...newVenue, surfaceType: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select surface type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artificial_turf">Artificial Turf</SelectItem>
                        <SelectItem value="natural_grass">Natural Grass</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="futsal">Futsal (Hard Court)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddVenueOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => { toast.success('Venue creation initiated'); setAddVenueOpen(false); }}>
                    Create Venue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {venuesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : venues.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No venues found. Add your first venue to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => (
                <Card key={venue.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{venue.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {venue.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Surface</span>
                      <span className="font-medium capitalize">{venue.surfaceType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        {venue.rating?.toFixed(1) ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Slots</span>
                      <span className="font-medium">
                        {venue.availableSlots ?? 0} / {venue.totalSlots ?? 0} available
                      </span>
                    </div>
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => {
                        setSelectedVenueId(venue.id);
                        setActiveTab('inventory');
                      }}
                    >
                      <Zap className="h-4 w-4" />
                      Manage Slots
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== TAB 3: Manage Inventory ========== */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={autoGenOpen} onOpenChange={setAutoGenOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedVenueId}>
                  <Plus className="h-4 w-4" />
                  Auto-Generate Slots
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto-Generate Slots</DialogTitle>
                  <DialogDescription>Generate time slots for the selected venue.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="open-time">Opening Time</Label>
                    <Input
                      id="open-time"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-time">Closing Time</Label>
                    <Input
                      id="close-time"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slot-duration">Duration (minutes)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAutoGenOpen(false)}>Cancel</Button>
                  <Button onClick={autoGenerateSlots}>Generate</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!selectedVenueId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Select a venue above to manage its slots.</p>
              </CardContent>
            </Card>
          ) : slotsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Loading slots...</CardContent>
            </Card>
          ) : filteredSlots.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No slots found. Auto-generate slots to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Time Type</TableHead>
                      <TableHead className="min-w-[120px]">Base Price (BDT)</TableHead>
                      <TableHead className="min-w-[120px]">Promo Price (BDT)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.time}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{slot.timeType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-24"
                            defaultValue={slot.basePrice}
                            onBlur={(e) => saveSlotPrice(slot, 'basePrice', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-24"
                            defaultValue={slot.promoPrice ?? ''}
                            placeholder="—"
                            onBlur={(e) => saveSlotPrice(slot, 'promoPrice', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>{statusBadge(slot.lifecycle)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== TAB 4: Booking Requests ========== */}
        <TabsContent value="bookings" className="space-y-4">
          <h2 className="text-lg font-semibold">Booking Requests ({bookings.length})</h2>

          {bookingsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Loading bookings...</CardContent>
            </Card>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No booking requests found.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.playerName}</TableCell>
                        <TableCell>{b.venue}</TableCell>
                        <TableCell>{b.timeSlot}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>{formatCurrency(b.amount)}</TableCell>
                        <TableCell>{statusBadge(b.status)}</TableCell>
                        <TableCell>{paymentBadge(b.paymentStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {b.status === 'pending' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => confirmBooking(b)}
                              >
                                Confirm
                              </Button>
                            )}
                            {b.status !== 'cancelled' && b.status !== 'completed' && (
                              b.paymentStatus === 'paid' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-yellow-600 border-yellow-300"
                                  onClick={() => cancelBooking(b)}
                                >
                                  Refund Pending
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => cancelBooking(b)}
                                >
                                  Cancel
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}