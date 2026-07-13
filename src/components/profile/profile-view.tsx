'use client';

import { useAppStore, type UserData } from '@/store/use-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  CalendarCheck,
  Target,
  Handshake,
  Phone,
  Shield,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ATTRIBUTE_KEYS = ['ATT', 'PAS', 'STA', 'SPE', 'TEC', 'DEF'] as const;

function getTierFromRating(rating: number): string {
  if (rating >= 90) return 'Legend';
  if (rating >= 85) return 'Elite';
  if (rating >= 80) return 'Pro';
  if (rating >= 75) return 'Semi-Pro';
  if (rating >= 70) return 'Home Buddies';
  return 'Playing for Fun';
}

function tierBadgeColor(tier: string): string {
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function buildRadarData(attributes: Record<string, unknown>) {
  return ATTRIBUTE_KEYS.map((key) => {
    const raw = attributes[key];
    const value = typeof raw === 'object' && raw !== null && 'value' in (raw as Record<string, unknown>)
      ? (raw as { value: number }).value
      : typeof raw === 'number' ? raw : 50;
    return { attribute: key, value, fullMark: 100 };
  });
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="py-3 px-3 gap-0 flex-1 min-w-0">
      <CardContent className="flex flex-col items-center gap-1 pt-0">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-lg font-bold leading-none">{value}</span>
        <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Non-player profile (admin / manager)                               */
/* ------------------------------------------------------------------ */

function NonPlayerProfile({ user }: { user: UserData }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <Card className="py-6 gap-0">
        <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="flex flex-col gap-2 text-center sm:text-left min-w-0">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant="outline" className="w-fit mx-auto sm:mx-0">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
            </Badge>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground justify-center sm:justify-start">
                <Phone className="size-3.5" />
                {user.phone}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ProfileView() {
  const user = useAppStore((s) => s.user);

  if (!user) return null;

  // Non-player roles get a simpler card
  if (!user.player) {
    return <NonPlayerProfile user={user} />;
  }

  const { player } = user;
  const positions = Array.isArray(player.positions) ? player.positions : [];
  const primaryPosition = positions[0] ?? '—';
  const backupPositions = positions.slice(1);
  const tier = getTierFromRating(player.overallRating);
  const radarData = buildRadarData(player.attributes);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* ====== HEADER LAYOUT ====== */}
      <Card className="py-6 gap-0">
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-0">
          {/* ---- Left Column ---- */}
          <div className="flex flex-col gap-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">{user.name}</h1>
                {(player.height || player.weight) && (
                  <p className="text-sm text-muted-foreground">
                    {player.height && `Height: ${player.height}`}
                    {player.height && player.weight && ' / '}
                    {player.weight && `Weight: ${player.weight}`}
                  </p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              <StatCard icon={Star} label="Stars" value={player.accumulatedStars} />
              <StatCard icon={CalendarCheck} label="Matches" value={player.matchesPlayed} />
              <StatCard icon={Target} label="Goals" value={player.goals} />
              <StatCard icon={Handshake} label="Assists" value={player.assists} />
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" />
                {user.phone}
              </div>
            )}

            <Separator />

            {/* Primary Position */}
            <div>
              <span className="text-xl font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md inline-block">
                {primaryPosition}
              </span>
            </div>

            {/* Backup Positions */}
            {backupPositions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Also plays:
                </span>
                {backupPositions.map((pos) => (
                  <span key={pos} className="text-sm text-muted-foreground">
                    {pos}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---- Right Column: Radar Chart ---- */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[320px] aspect-square">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Attributes"
                    dataKey="value"
                    stroke="#16a34a"
                    fill="#22c55e"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>

        {/* ---- Bottom: Overall Rating + Tier ---- */}
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter text-primary leading-none">
                {player.overallRating}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Overall Rating</span>
            </div>
            <div className="h-12 w-px bg-border" />
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1.5 ${tierBadgeColor(tier)}`}
            >
              <Shield className="size-4 mr-1.5" />
              {tier}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}