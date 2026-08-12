'use client';

import { useAppStore } from '@/store/use-store';
import type { ApiResponse } from '@/lib/api-types';

// Client-side fetch wrapper — the browser calling turfifa-server (Express)
// directly, cross-origin. This is the PRIMARY path for authenticated/
// interactive calls (login, dashboards, booking, inline editing) — see
// Turfifa-PRD.md §1/§11. It's the one that actually exercises CORS and the
// JWT bearer flow end to end, which is why it isn't routed through a Next.js
// Server Action (see lib/actions.ts for why that layer is reserved for
// public, unauthenticated writes only).

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the automatic 401 -> refresh -> retry cycle (used by the refresh call itself). */
  skipAuthRetry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // De-dupe concurrent refresh attempts (e.g. several components 401 at once).
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // sends the httpOnly refresh cookie set by Express
        });
        const json: ApiResponse<{ accessToken: string }> = await res.json();
        if (!res.ok || !json.success || !json.data) {
          useAppStore.getState().logout();
          return false;
        }
        useAppStore.getState().setAccessToken(json.data.accessToken);
        return true;
      } catch {
        useAppStore.getState().logout();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, skipAuthRetry, headers, ...rest } = options;
  const token = useAppStore.getState().accessToken;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: requestHeaders,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error. Is the server running?',
      data: null,
    };
  }

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(endpoint, { ...options, skipAuthRetry: true });
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { success: false, message: 'Not authenticated', data: null };
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    return {
      success: false,
      message: `Request failed with status ${res.status}`,
      data: null,
    };
  }
  return json;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
