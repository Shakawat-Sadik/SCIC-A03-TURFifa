import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-1 flex-col items-center justify-center px-4 text-center">
      {/* Pitch illustration */}
      <div className="mb-8">
        <svg viewBox="0 0 200 140" className="w-48 h-auto opacity-40" fill="none">
          <rect
            x="10"
            y="10"
            width="180"
            height="120"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          <line
            x1="10"
            y1="70"
            x2="190"
            y2="70"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />
          <circle
            cx="100"
            cy="70"
            r="20"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />
          <text
            x="100"
            y="75"
            textAnchor="middle"
            className="fill-primary"
            fontSize="28"
            fontWeight="900"
          >
            ?
          </text>
        </svg>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
        404 — Page Not Found
      </p>
      <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
        You&apos;re offside.
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back to the pitch.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/explore">Explore Turfs</Link>
        </Button>
      </div>
    </div>
  );
}
