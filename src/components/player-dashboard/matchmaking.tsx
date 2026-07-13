'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/use-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus, Users, Circle } from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PlayerStatus = 'idle' | 'organizing' | 'interested';

interface OrganizingPlayer {
  id: string;
  userId?: string;
  name?: string;
  tier?: string;
  overallRating?: number;
  positions?: string[];
  currentStatus?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIERS = ['Legend', 'Elite', 'Pro', 'Semi-Pro', 'Home Buddies', 'Playing for Fun'] as const;

const STATUS_OPTIONS: { value: PlayerStatus; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'organizing', label: 'Organizing' },
  { value: 'interested', label: 'Interested to Play' },
];

function tierColor(tier?: string | null): string {
  switch (tier) {
    case 'Legend':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25';
    case 'Elite':
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25';
    case 'Pro':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25';
    case 'Semi-Pro':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
    case 'Home Buddies':
      return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25';
    case 'Playing for Fun':
      return 'bg-gray-400/10 text-gray-500 dark:text-gray-400 border-gray-400/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function MatchmakingView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [currentStatus, setCurrentStatus] = useState<PlayerStatus>(
    (user?.player?.currentStatus as PlayerStatus) ?? 'idle'
  );
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const [players, setPlayers] = useState<OrganizingPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  /* ---- Fetch organizing players ---- */
  const fetchPlayers = useCallback(async () => {
    setPlayersLoading(true);
    try {
      const params = new URLSearchParams({ status: 'organizing' });
      if (search) params.set('search', search);
      if (tierFilter && tierFilter !== 'all') params.set('tier', tierFilter);
      const res = await fetch(`/api/players?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail
    } finally {
      setPlayersLoading(false);
    }
  }, [search, tierFilter]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  /* ---- Update player status ---- */
  const handleStatusChange = async (status: PlayerStatus) => {
    if (!user) return;
    setStatusUpdating(true);
    try {
      const res = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentStatus: status }),
      });
      if (res.ok) {
        setCurrentStatus(status);
        if (user.player) {
          setUser({ ...user, player: { ...user.player, currentStatus: status } });
        }
        toast(`Status updated to ${STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRequestToJoin = (playerName?: string) => {
    toast.success(`Request sent to ${playerName ?? 'player'}!`);
  };

  /* ---- Filtered list (client-side search also applied) ---- */
  const filtered = players.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Matchmaking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your availability and find players looking to organize matches
        </p>
      </div>

      {/* ---- Player Status Toggle ---- */}
      <Card className="mb-6">
        <CardContent className="pt-0">
          <p className="text-sm font-medium mb-3">Your Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={currentStatus === opt.value ? 'default' : 'outline'}
                size="sm"
                disabled={statusUpdating}
                onClick={() => handleStatusChange(opt.value)}
              >
                {currentStatus === opt.value && (
                  <Circle className="size-2 fill-current" />
                )}
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---- Search & Filter Bar ---- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {TIERS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ---- Results Grid ---- */}
      {playersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="py-4 gap-0">
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No organizing players found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No players are currently organizing matches matching your filters. Try adjusting your search or tier filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player) => {
            const primaryPosition = player.positions?.[0] ?? '—';
            const name = player.name ?? 'Unknown Player';
            const rating = player.overallRating ?? 0;

            return (
              <Card key={player.id} className="py-4 gap-0">
                <CardContent className="flex flex-col gap-3">
                  {/* Name + status dot */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight truncate">{name}</h3>
                    <span className="relative flex shrink-0 mt-1">
                      <span className="size-2.5 rounded-full bg-blue-500" />
                      <span className="absolute inset-0 size-2.5 rounded-full bg-blue-500 animate-ping opacity-75" />
                    </span>
                  </div>

                  {/* Rating + tier */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {rating} RAT
                    </Badge>
                    {player.tier && (
                      <Badge variant="outline" className={`text-xs ${tierColor(player.tier)}`}>
                        {player.tier}
                      </Badge>
                    )}
                  </div>

                  {/* Primary position */}
                  <div className="text-lg font-bold text-primary">
                    {primaryPosition}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => handleRequestToJoin(name)}
                  >
                    <UserPlus className="size-4 mr-1.5" />
                    Request to Join
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}