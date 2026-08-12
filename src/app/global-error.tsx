'use client';

// Catches crashes in the root layout itself. Next.js replaces the entire
// document when this renders, so it must supply its own <html>/<body> and
// import the stylesheet — the root layout's imports do not apply here.
// Deliberately dependency-free: if the layout is what broke, pulling in
// Navbar/Footer/providers risks failing again inside the error page.
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-3">
            Application Error
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Turfifa failed to start.
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
            Something broke at the application level rather than on a single
            page. Reloading usually clears it.
          </p>

          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Reload Turfifa
          </button>

          {error.digest && (
            <p className="mt-8 text-xs text-muted-foreground/70 font-mono">
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
