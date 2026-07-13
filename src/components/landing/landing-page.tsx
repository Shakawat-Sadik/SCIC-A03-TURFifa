'use client';

import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  MapPin,
  Users,
  Trophy,
  Star,
  Search,
  CalendarCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/use-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
};

/* ─── formation dots config (1-2-2-1) ─── */
const formationDots = [
  // GK
  { label: 'GK', row: 4, col: 2, color: 'bg-yellow-400' },
  // 2 defenders
  { label: 'LB', row: 3, col: 1, color: 'bg-blue-400' },
  { label: 'RB', row: 3, col: 3, color: 'bg-blue-400' },
  // 2 midfielders
  { label: 'LM', row: 2, col: 1, color: 'bg-emerald-400' },
  { label: 'RM', row: 2, col: 3, color: 'bg-emerald-400' },
  // 1 forward
  { label: 'ST', row: 1, col: 2, color: 'bg-red-400' },
];

/* ─── featured turfs data ─── */
const featuredTurfs = [
  {
    name: 'Tanvir Sports Complex',
    location: 'Dhanmondi, Dhaka',
    rating: 4.7,
    surface: 'Artificial Turf',
    price: 'From BDT 500/hr',
    gradient: 'from-emerald-500/30 via-green-600/20 to-teal-500/30',
  },
  {
    name: 'Prime Sports Hub',
    location: 'Mohammadpur, Dhaka',
    rating: 4.8,
    surface: 'Artificial Turf',
    price: 'From BDT 450/hr',
    gradient: 'from-green-500/30 via-lime-600/20 to-emerald-500/30',
  },
  {
    name: 'Urban Football Center',
    location: 'Banani, Dhaka',
    rating: 4.6,
    surface: 'Artificial Turf',
    price: 'From BDT 600/hr',
    gradient: 'from-teal-500/30 via-green-600/20 to-cyan-500/30',
  },
];

/* ─── testimonials data ─── */
const testimonials = [
  {
    quote:
      'Turfifa made organizing weekend matches so much easier. The booking system is smooth and the venue reviews are spot on.',
    name: 'Imran H.',
    title: 'Team Captain, Dhanmondi League',
    initials: 'IH',
    color: 'bg-emerald-600',
  },
  {
    quote:
      'The analytics feature helped me track my progress over the season. Seeing my passing accuracy improve has been incredibly motivating.',
    name: 'Sakib H.',
    title: 'Amateur Player',
    initials: 'SH',
    color: 'bg-teal-600',
  },
  {
    quote:
      'As a turf manager, the inventory management tools saved me hours every week. The automated slot generation is a game-changer.',
    name: 'Tanvir A.',
    title: 'Venue Manager',
    initials: 'TA',
    color: 'bg-green-700',
  },
];

/* ─── main component ─── */
export function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Subscribed successfully!');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════ 1. HERO SECTION ═══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 md:py-24 flex flex-col items-center text-center gap-8">
          {/* Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Book Turf.{' '}
            <span className="text-primary">Play Football.</span>{' '}
            Track Your Game.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-muted-foreground max-w-2xl text-base sm:text-lg leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            The all-in-one platform for amateur football, futsal, and 6v6
            turf enthusiasts. Discover venues, book slots, and analyze your
            match performance.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Button
              size="lg"
              className="text-base px-8"
              onClick={() => navigate('explore')}
            >
              Explore Turfs
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              onClick={() => navigate('register')}
            >
              Get Started
            </Button>
          </motion.div>

          {/* 6v6 Formation Miniature */}
          <motion.div
            className="mt-4"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="relative w-64 h-44 sm:w-80 sm:h-52 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-green-700/80 to-green-900/90 overflow-hidden shadow-lg">
              {/* Pitch lines */}
              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 -translate-y-1/2" />
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/40" />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
              {/* Top goal area */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-10 border-b border-l border-r border-white/30 rounded-b-lg" />
              {/* Bottom goal area */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-10 border-t border-l border-r border-white/30 rounded-t-lg" />

              {/* Player dots — 1-2-2-1 formation on a 5-col, 5-row grid */}
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 p-3 sm:p-4">
                {formationDots.map((dot, i) => (
                  <motion.div
                    key={dot.label}
                    className="flex flex-col items-center justify-center"
                    style={{
                      gridColumn: dot.col + 1,
                      gridRow: dot.row,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <div
                      className={`${dot.color} w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md border-2 border-white/70`}
                    />
                    <span className="text-[9px] sm:text-[10px] text-white/80 font-medium mt-0.5 leading-none">
                      {dot.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              6v6 Formation Preview — 1-2-2-1
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ 2. LIVE USAGE METRICS ═══════════════════ */}
      <section className="border-t bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              value: '150+',
              label: 'Verified Venues',
            },
            {
              icon: Users,
              value: '5,000+',
              label: 'Active Players',
            },
            {
              icon: Trophy,
              value: '12,000+',
              label: 'Bookings Completed',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              <Card className="text-center py-8">
                <CardContent className="flex flex-col items-center gap-3 px-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <stat.icon className="size-6 text-primary" />
                  </div>
                  <span className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ 3. FEATURED TURFS ═══════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Featured Turfs
            </h2>
            <p className="text-muted-foreground mt-2">
              Top-rated venues loved by players
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTurfs.map((turf, i) => (
              <motion.div
                key={turf.name}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="overflow-hidden py-0 gap-0">
                  {/* Image placeholder */}
                  <div
                    className={`h-44 bg-gradient-to-br ${turf.gradient} flex items-center justify-center`}
                  >
                    <span className="text-white/50 text-sm font-medium">
                      Turf Photo
                    </span>
                  </div>
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="text-lg">{turf.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {turf.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <Star className="size-3 mr-1 text-yellow-500 fill-yellow-500" />
                        {turf.rating}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {turf.surface}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <span className="text-sm font-semibold text-primary">
                      {turf.price}
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={5}
          >
            <Button variant="outline" onClick={() => navigate('explore')}>
              View All Turfs
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ 4. HOW IT WORKS ═══════════════════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            className="text-center mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How It Works
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-start md:items-stretch gap-6 md:gap-0">
            {[
              {
                icon: Search,
                title: 'Search',
                desc: 'Find the perfect turf near you using filters for location, surface type, and time.',
              },
              {
                icon: CalendarCheck,
                title: 'Select & Book',
                desc: 'Choose your preferred time slot, review pricing, and confirm your booking instantly.',
              },
              {
                icon: BarChart3,
                title: 'Play & Track',
                desc: 'Enjoy your game and track your match performance with built-in analytics.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="flex-1 flex items-start gap-4 md:gap-0"
              >
                <div className="flex-1 flex flex-col items-center text-center px-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <step.icon className="size-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {/* Arrow between steps (hidden on last) */}
                {i < 2 && (
                  <div className="hidden md:flex items-center justify-center pt-5 px-2">
                    <ArrowRight className="size-5 text-muted-foreground/50" />
                  </div>
                )}
                {/* Arrow on mobile (below each except last) */}
                {i < 2 && (
                  <div className="flex md:hidden justify-center w-full py-2">
                    <ArrowRight className="size-5 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. TACTICAL MODULE PREVIEW ═══════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            className="text-center mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              6v6 Tactical Planner
            </h2>
            <p className="text-muted-foreground mt-2">
              Plan your formations like a pro
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            <div className="relative w-full max-w-md">
              {/* Mini football pitch */}
              <div className="relative w-full aspect-[3/4] rounded-xl border-2 border-white/60 bg-gradient-to-b from-green-600 via-green-700 to-green-800 overflow-hidden shadow-xl">
                {/* Outer boundary padding */}
                <div className="absolute inset-3 border border-white/30 rounded-md">
                  {/* Center line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 -translate-y-1/2" />
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/40" />
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60" />

                  {/* Top penalty area */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-14 border-b border-l border-r border-white/30 rounded-b-lg" />
                  {/* Top goal box */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 border-b border-l border-r border-white/25 rounded-b-md" />
                  {/* Top goal */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-2.5 border-b border-l border-r border-white/50 rounded-b-sm bg-white/10" />

                  {/* Bottom penalty area */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-14 border-t border-l border-r border-white/30 rounded-t-lg" />
                  {/* Bottom goal box */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-5 border-t border-l border-r border-white/25 rounded-t-md" />
                  {/* Bottom goal */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2.5 border-t border-l border-r border-white/50 rounded-t-sm bg-white/10" />

                  {/* Penalty spots */}
                  <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />
                  <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />

                  {/* Corner arcs */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-full" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-full" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-full" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-full" />

                  {/* Player dots — 1-2-2-1 formation */}
                  {[
                    { label: 'ST', top: '22%', left: '50%', color: 'bg-red-400' },
                    { label: 'LM', top: '38%', left: '25%', color: 'bg-emerald-400' },
                    { label: 'RM', top: '38%', left: '75%', color: 'bg-emerald-400' },
                    { label: 'LB', top: '58%', left: '25%', color: 'bg-blue-400' },
                    { label: 'RB', top: '58%', left: '75%', color: 'bg-blue-400' },
                    { label: 'GK', top: '78%', left: '50%', color: 'bg-yellow-400' },
                  ].map((p, idx) => (
                    <motion.div
                      key={p.label}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      style={{ top: p.top, left: p.left }}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.3 + idx * 0.08,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <div
                        className={`${p.color} w-7 h-7 rounded-full shadow-lg border-2 border-white/80`}
                      />
                      <span className="text-[10px] text-white/90 font-semibold mt-1 drop-shadow-sm leading-none">
                        {p.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
          >
            Available to all registered team captains. Plan, share, and
            execute your game strategy.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════ 6. TESTIMONIALS ═══════════════════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              What Players Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6 flex flex-col gap-4 h-full">
                    {/* Quote */}
                    <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    {/* Author */}
                    <div className="flex items-center gap-3 pt-2">
                      <Avatar className="size-10">
                        <AvatarFallback
                          className={`${t.color} text-white text-xs font-semibold`}
                        >
                          {t.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. NEWSLETTER & FAQ ═══════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Newsletter */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
            >
              <Card className="p-6 sm:p-8 h-full flex flex-col justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Stay in the Game
                </h2>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Get updates on new venues, features, and exclusive offers.
                </p>
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-3 mt-6"
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="whitespace-nowrap">
                    Subscribe
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* FAQ */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger>
                    How do I book a turf?
                  </AccordionTrigger>
                  <AccordionContent>
                    Simply browse our Explore page, filter by your preferred
                    location and time, select a slot, and complete your
                    payment. Your booking is confirmed instantly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>
                    What payment methods are supported?
                  </AccordionTrigger>
                  <AccordionContent>
                    We support bKash, Nagad, Upay, Rocket, and all major
                    credit/debit cards through our secure SSLCommerz payment
                    gateway.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>
                    Can I cancel a booking?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, you can cancel up to 2 hours before your scheduled
                    time for a full refund minus processing fees. Late
                    cancellations may incur a cooldown penalty.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4">
                  <AccordionTrigger>
                    How does the matchmaking system work?
                  </AccordionTrigger>
                  <AccordionContent>
                    Set your status to &ldquo;Organizing&rdquo; to host a
                    match, or &ldquo;Interested to Play&rdquo; to find
                    games. Other players can view your profile and difficulty
                    tier to join matches that match their skill level.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}