import { create } from 'zustand';

// ─── View names ──────────────────────────────────────────────────────────────
// Client-side "view switcher" names. RouteSync (src/components/shared/route-sync.tsx)
// keeps these in sync with real Next.js URLs.

export type ViewName =
  | 'landing'
  | 'explore'
  | 'venue-detail'
  | 'login'
  | 'register'
  | 'admin-dashboard'
  | 'manager-dashboard'
  | 'player-dashboard'
  | 'profile'
  | 'matchmaking'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms';

// ─── User data ───────────────────────────────────────────────────────────────

export interface PlayerData {
  id: string;
  positions: string[];
  attributes: Record<string, { value: number; endorsedByUsers: string[] } | number>;
  overallRating: number;
  currentStatus: string;
  accumulatedStars: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  height?: string | number;
  weight?: string | number;
}

// NOTE: kept as a plain `string` (rather than a `'player' | 'turf_manager' | 'admin'`
// literal union) because auth-views.tsx builds this object from an API response typed
// with `role: string`, so a literal union here would make `setUser(userData)` fail to
// type-check in a file we're not allowed to modify. Equality checks like
// `user.role === 'player'` still work fine against a plain string.
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  accountStatus: string;
  gateways: string[];
  player?: PlayerData;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

interface AppState {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => void;

  currentView: ViewName;
  navigate: (view: ViewName) => void;

  selectedVenueId: string | null;
  setSelectedVenueId: (id: string | null) => void;

  hasActiveMatch: boolean;
  setHasActiveMatch: (value: boolean) => void;

  theme: Theme;
  toggleTheme: () => void;
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, currentView: 'landing' }),

  currentView: 'landing',
  navigate: (view) => set({ currentView: view }),

  selectedVenueId: null,
  setSelectedVenueId: (id) => set({ selectedVenueId: id }),

  hasActiveMatch: false,
  setHasActiveMatch: (value) => set({ hasActiveMatch: value }),

  theme: 'light',
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyThemeClass(next);
    set({ theme: next });
  },
}));
