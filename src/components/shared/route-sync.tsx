'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, type ViewName } from '@/store/use-store';

// ─── View <-> pathname mapping ───────────────────────────────────────────────
// Static views map 1:1 to a route. 'venue-detail' is dynamic (/explore/[id])
// and is handled separately below.

const VIEW_TO_PATH: Record<Exclude<ViewName, 'venue-detail'>, string> = {
  landing: '/',
  explore: '/explore',
  login: '/login',
  register: '/register',
  'admin-dashboard': '/admin',
  'manager-dashboard': '/manager',
  'player-dashboard': '/player',
  profile: '/profile',
  matchmaking: '/matchmaking',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};

function pathnameToView(pathname: string): ViewName | null {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/explore/')) return 'venue-detail';
  for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
    if (path !== '/' && pathname === path) return view as ViewName;
  }
  return null;
}

function viewToPathname(view: ViewName, selectedVenueId: string | null): string | null {
  if (view === 'venue-detail') {
    return selectedVenueId ? `/explore/${selectedVenueId}` : null;
  }
  return VIEW_TO_PATH[view] ?? null;
}

/**
 * Mounted once in the root layout. Keeps the Zustand `currentView` (used by
 * the existing view-switcher components) and the real Next.js URL in sync,
 * in both directions:
 *  - store -> URL: when `navigate()` is called, push the matching route.
 *  - URL -> store: on browser back/forward, direct load, or <Link> nav,
 *    silently update `currentView` (no router push) to match the pathname.
 */
export function RouteSync() {
  const router = useRouter();
  const pathname = usePathname();
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);
  const selectedVenueId = useAppStore((s) => s.selectedVenueId);
  const setSelectedVenueId = useAppStore((s) => s.setSelectedVenueId);

  // Guards to avoid the two effects ping-ponging each other.
  const lastPushedPath = useRef<string | null>(null);
  const lastSyncedPath = useRef<string | null>(null);

  // store -> URL
  useEffect(() => {
    const targetPath = viewToPathname(currentView, selectedVenueId);
    if (!targetPath) return;
    if (targetPath === pathname) return;
    if (lastSyncedPath.current === targetPath) return;
    lastPushedPath.current = targetPath;
    router.push(targetPath);
  }, [currentView, selectedVenueId, pathname, router]);

  // URL -> store
  useEffect(() => {
    if (lastPushedPath.current === pathname) {
      lastPushedPath.current = null;
      return;
    }
    lastSyncedPath.current = pathname;

    if (pathname.startsWith('/explore/')) {
      const id = pathname.split('/')[2];
      if (id) setSelectedVenueId(id);
      if (currentView !== 'venue-detail') navigate('venue-detail');
      return;
    }

    const view = pathnameToView(pathname);
    if (view && view !== currentView) {
      navigate(view);
    }
    // Unmapped paths (e.g. 404) are left alone — currentView stays as-is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
