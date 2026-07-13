'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/use-store';
import { AlertTriangle, Loader2, User, ShieldCheck, Crown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LoginResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  accountStatus: string;
  gateways: string[];
  player?: {
    id: string;
    positions: string[];
    attributes: Record<string, { value: number; endorsedByUsers: string[] }>;
    overallRating: number;
    currentStatus: string;
    accumulatedStars: number;
    matchesPlayed: number;
    goals: number;
    assists: number;
  };
}

// ─── Register Schema ─────────────────────────────────────────────────────────

const POSITIONS = ['ST', 'CAM', 'CM', 'CDM', 'CB', 'GK', 'LW', 'RW', 'LB', 'RB', 'CF'] as const;
const GATEWAYS = ['bKash', 'Nagad', 'Upay', 'Others'] as const;
const ATTRIBUTES = ['ATT', 'PAS', 'STA', 'SPE', 'TEC', 'DEF'] as const;
const DEFAULT_ATTR = 65;

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    role: z.enum(['player', 'turf_manager']),
    phone: z.string().optional(),
    gateways: z.array(z.string()).min(1, 'Select at least one payment gateway'),
    customGatewayText: z.string().optional(),
    positions: z
      .array(z.string())
      .min(1, 'Select at least 1 position')
      .max(3, 'Select at most 3 positions'),
    attributes: z.record(z.number().min(40).max(95)),
  })
  .refine(
    (data) => {
      if (data.gateways.includes('Others') && !data.customGatewayText?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Please specify your custom payment gateway',
      path: ['customGatewayText'],
    },
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Login View ──────────────────────────────────────────────────────────────

export function LoginView() {
  const { setUser, navigate } = useAppStore();
  const { toast } = useToast();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const handleDemoLogin = async (email: string) => {
    setLoadingEmail(email);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'demo_login', email }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const user: LoginResponse = await res.json();
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        accountStatus: user.accountStatus,
        gateways: user.gateways,
        player: user.player
          ? {
              id: user.player.id,
              positions: user.player.positions,
              attributes: user.player.attributes,
              overallRating: user.player.overallRating,
              currentStatus: user.player.currentStatus,
              accumulatedStars: user.player.accumulatedStars,
              matchesPlayed: user.player.matchesPlayed,
              goals: user.player.goals,
              assists: user.player.assists,
            }
          : undefined,
      };
      setUser(userData);
      toast({ title: `Welcome back, ${user.name}!`, description: 'Login successful.' });

      if (user.role === 'admin') {
        navigate('admin-dashboard');
      } else if (user.role === 'turf_manager') {
        navigate('manager-dashboard');
      } else {
        navigate('player-dashboard');
      }
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to Turfifa to book turfs, manage matches, and more.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Button
            size="lg"
            className="h-14 text-base font-semibold"
            disabled={loadingEmail !== null}
            onClick={() => handleDemoLogin('player@turfifa.com')}
          >
            {loadingEmail === 'player@turfifa.com' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <User className="size-5" />
            )}
            Demo Player Login
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-14 text-base"
            disabled={loadingEmail !== null}
            onClick={() => handleDemoLogin('manager@turfifa.com')}
          >
            {loadingEmail === 'manager@turfifa.com' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ShieldCheck className="size-5" />
            )}
            Demo Manager Login
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-14 text-base"
            disabled={loadingEmail !== null}
            onClick={() => handleDemoLogin('admin@turfifa.com')}
          >
            {loadingEmail === 'admin@turfifa.com' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Crown className="size-5" />
            )}
            Demo Admin Login
          </Button>

          <div className="relative my-2">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              or register a new account
            </span>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <Button
            variant="link"
            onClick={() => navigate('register')}
            className="text-base"
          >
            Create Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ─── Register View ───────────────────────────────────────────────────────────

export function RegisterView() {
  const { setUser, navigate } = useAppStore();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'player',
      phone: '',
      gateways: [],
      customGatewayText: '',
      positions: [],
      attributes: Object.fromEntries(ATTRIBUTES.map((a) => [a, DEFAULT_ATTR])),
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedRole = watch('role');
  const selectedGateways = watch('gateways');
  const selectedPositions = watch('positions');
  const isPlayer = selectedRole === 'player';

  const togglePosition = (pos: string) => {
    const current = selectedPositions || [];
    if (current.includes(pos)) {
      setValue('positions', current.filter((p: string) => p !== pos), {
        shouldValidate: true,
      });
    } else if (current.length < 3) {
      setValue('positions', [...current, pos], { shouldValidate: true });
    }
  };

  const toggleGateway = (gw: string) => {
    const current = selectedGateways || [];
    if (current.includes(gw)) {
      setValue(
        'gateways',
        current.filter((g: string) => g !== gw),
        { shouldValidate: true },
      );
    } else {
      setValue('gateways', [...current, gw], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'register',
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone || undefined,
        gateways: data.gateways,
        customGatewayText: data.customGatewayText || undefined,
      };

      if (isPlayer) {
        payload.positions = data.positions;
        // Convert attributes to the expected format
        const attrs: Record<string, { value: number; endorsedByUsers: string[] }> = {};
        for (const [key, val] of Object.entries(data.attributes)) {
          attrs[key] = { value: val as number, endorsedByUsers: [] };
        }
        payload.attributes = attrs;
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }

      const user = await res.json();
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        accountStatus: user.accountStatus,
        gateways: user.gateways,
        player: user.player
          ? {
              id: user.player.id,
              positions: user.positions,
              attributes: user.attributes,
              overallRating: user.player.overallRating,
              currentStatus: user.player.currentStatus,
              accumulatedStars: user.player.accumulatedStars,
              matchesPlayed: user.player.matchesPlayed,
              goals: user.player.goals,
              assists: user.player.assists,
            }
          : undefined,
      };
      setUser(userData);
      toast({ title: 'Account created!', description: 'Welcome to Turfifa.' });

      if (user.role === 'turf_manager') {
        navigate('manager-dashboard');
      } else {
        navigate('player-dashboard');
      }
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join Turfifa and start booking turfs today.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label>Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="player" id="role-player" />
                      <Label htmlFor="role-player" className="font-normal cursor-pointer">
                        Player
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="turf_manager" id="role-manager" />
                      <Label htmlFor="role-manager" className="font-normal cursor-pointer">
                        Turf Manager
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                placeholder="01XXXXXXXXX"
                {...register('phone')}
              />
            </div>

            {/* Payment Gateways */}
            <div className="grid gap-2">
              <Label>Payment Gateways</Label>
              <div className="flex flex-wrap gap-4">
                {GATEWAYS.map((gw) => (
                  <div key={gw} className="flex items-center gap-2">
                    <Checkbox
                      id={`gw-${gw}`}
                      checked={selectedGateways?.includes(gw)}
                      onCheckedChange={() => toggleGateway(gw)}
                    />
                    <Label
                      htmlFor={`gw-${gw}`}
                      className="font-normal cursor-pointer"
                    >
                      {gw}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.gateways && (
                <p className="text-sm text-destructive">{errors.gateways.message}</p>
              )}
            </div>

            {/* Custom Gateway Text */}
            {selectedGateways?.includes('Others') && (
              <div className="grid gap-2">
                <Label htmlFor="customGateway">Specify Custom Gateway</Label>
                <Input
                  id="customGateway"
                  placeholder="e.g. Rocket, Dutch Bangla Bank"
                  {...register('customGatewayText')}
                  aria-invalid={!!errors.customGatewayText}
                />
                {errors.customGatewayText && (
                  <p className="text-sm text-destructive">
                    {errors.customGatewayText.message}
                  </p>
                )}
              </div>
            )}

            {/* ── Player-only fields ── */}
            {isPlayer && (
              <>
                <Separator />

                {/* Positions */}
                <div className="grid gap-2">
                  <Label>
                    Positions{' '}
                    <span className="text-muted-foreground font-normal">
                      (1–3)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map((pos) => {
                      const isSelected = selectedPositions?.includes(pos);
                      const isDisabled =
                        !isSelected && (selectedPositions?.length ?? 0) >= 3;
                      return (
                        <div key={pos} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`pos-${pos}`}
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={() => togglePosition(pos)}
                          />
                          <Label
                            htmlFor={`pos-${pos}`}
                            className={`font-normal cursor-pointer text-sm ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {pos}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.positions && (
                    <p className="text-sm text-destructive">
                      {errors.positions.message}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Attributes */}
                <div className="grid gap-3">
                  <Label>Player Attributes</Label>
                  {ATTRIBUTES.map((attr) => (
                    <Controller
                      key={attr}
                      name={`attributes.${attr}` as keyof RegisterFormValues}
                      control={control}
                      render={({ field }) => (
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{attr}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {field.value as number}
                            </span>
                          </div>
                          <Slider
                            min={40}
                            max={95}
                            step={1}
                            value={[field.value as number]}
                            onValueChange={([val]) => field.onChange(val)}
                          />
                        </div>
                      )}
                    />
                  ))}
                  <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <span>
                      These attributes are locked once submitted. Choose carefully!
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="mt-2 h-11 text-base" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => navigate('login')}
            >
              Log In
            </Button>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}