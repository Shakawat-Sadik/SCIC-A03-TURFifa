import Link from 'next/link';
import { ArrowRight, Zap, Target, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEAM = [
  {
    name: 'Imtiaz Ahmed',
    role: 'Co-founder & CEO',
    bio: 'Ex-Goldman Sachs analyst turned football obsessive. Played semi-pro for Abahani Club before building Turfifa.',
    avatar: 'IA',
  },
  {
    name: 'Farha Nusrat',
    role: 'CTO',
    bio: "Full-stack engineer and data scientist. Built the tactical analytics engine from scratch in under 6 months.",
    avatar: 'FN',
  },
  {
    name: 'Rafiqul Islam',
    role: 'Head of Operations',
    bio: 'Former venue manager at a Gulshan sports complex. Deep industry knowledge and a 500+ venue network.',
    avatar: 'RI',
  },
  {
    name: 'Tasnia Akter',
    role: 'Head of Design',
    bio: "UX designer with a decade in fintech. Redesigned Turfifa's booking flow, cutting drop-off by 62%.",
    avatar: 'TA',
  },
];

const VALUES = [
  {
    icon: Target,
    title: 'Player-First',
    desc: 'Every product decision starts with a simple question: does this make the game better for the player?',
  },
  {
    icon: Shield,
    title: 'Verified & Trusted',
    desc: 'We personally inspect every venue before listing. No fake reviews, no ghost venues.',
  },
  {
    icon: TrendingUp,
    title: 'Data-Driven',
    desc: 'Analytics that actually help you improve — not just vanity stats nobody looks at.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Book a turf in under 30 seconds. Our infrastructure handles 10,000+ concurrent sessions.',
  },
];

const HOW_IT_WORKS = [
  {
    label: 'For Players',
    steps: [
      'Search and filter verified turf venues',
      'Select a time slot with real-time availability',
      'Pay via bKash, Nagad, or Upay instantly',
      'Access tactical tools and player analytics',
    ],
  },
  {
    label: 'For Turf Managers',
    steps: [
      'List your venue with photos and specs',
      'Set pricing and manage slot availability',
      'Receive bookings and track revenue analytics',
      'Handle disputes through our resolution center',
    ],
  },
  {
    label: 'Our Promise',
    steps: [
      'Every venue independently verified',
      'Transparent BDT pricing, no hidden fees',
      'Fair cancellation and refund policy',
      '24/7 support for bookings and disputes',
    ],
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-foreground py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Our Story
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-background leading-tight mb-6">
            Built by players,
            <br />
            for players.
          </h1>
          <p className="text-base text-background/60 leading-relaxed max-w-xl mx-auto">
            Turfifa started in 2023 when three friends in Dhaka got frustrated spending
            45 minutes on WhatsApp just to book a 1-hour futsal slot. We knew there had
            to be a better way.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader
              eyebrow="Mission"
              title="Democratising access to quality football infrastructure"
            />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Bangladesh has over 40 million active football players, yet most struggle
              to find reliable, affordable venues. Informal coordination via phone calls
              and WhatsApp groups means missed games, double-bookings, and wasted
              evenings.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Turfifa solves this with a modern marketplace that connects players to
              vetted venues — and layers on a tactical analytics engine that helps
              amateur players train and track improvement like pros.
            </p>
            <Button asChild>
              <Link href="/explore">
                Explore venues <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-primary/20 to-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 border-y border-border py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="The Marketplace"
            title="How Turfifa works"
            description="A two-sided marketplace connecting amateur players with premium turf operators across Bangladesh."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((col) => (
              <div
                key={col.label}
                className="bg-card border border-border rounded-lg p-5"
              >
                <h3 className="font-bold text-foreground mb-4 text-sm">{col.label}</h3>
                <ul className="space-y-2.5">
                  {col.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="size-4 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader eyebrow="Core Values" title="What we stand for" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
            >
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <v.icon className="size-5" />
              </div>
              <h3 className="font-bold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted/40 border-t border-border py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="The Team" title="Who's building Turfifa" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-card border border-border rounded-lg p-5 text-center flex flex-col gap-3"
              >
                <div className="size-14 rounded-full bg-primary/15 text-primary font-black text-lg flex items-center justify-center mx-auto">
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{member.name}</h3>
                  <p className="text-xs text-primary font-semibold">{member.role}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-primary-foreground mb-4">
            Ready to play on Bangladesh&apos;s best turfs?
          </h2>
          <p className="text-primary-foreground/70 mb-6">
            Join 5,200+ teams already using Turfifa to book, play, and improve.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/login">
              Create your free account <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
