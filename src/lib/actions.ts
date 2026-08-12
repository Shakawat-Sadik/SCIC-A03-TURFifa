'use server';

import type { ApiResponse } from '@/lib/api-types';

// Server Actions calling turfifa-server directly (Node -> Node, same-origin
// from Express's point of view — no CORS involved). Deliberately reserved
// for PUBLIC, unauthenticated write endpoints only: §5 of the PRD calls out
// /contact and the newsletter signup as the two routes that should still work
// with JS disabled (progressive enhancement) and are rate-limited server-side
// rather than per-user.
//
// Everything authenticated (login, bookings, dashboards, admin actions) goes
// through lib/api-client.ts instead — a real browser -> Express request, so
// the JWT bearer header and Express's cors() middleware are actually
// exercised, per Turfifa-PRD.md §1/§11. Do not add protected endpoints here;
// widening this file back into a BFF-for-everything defeats that.

const API_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.REMOTE_SERVER_URL
    : process.env.SERVER_URL || 'http://localhost:5000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok || !data || !data.success) {
      return {
        success: false,
        message: data?.message || `Request failed with status ${res.status}`,
        data: null,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Network error. Is the server running?',
      data: null,
    };
  }
}

// ─── Contact form (§5 Contact & Support) ──────────────────────────────────

export interface ContactFormInput {
  name: string;
  email: string;
  message: string;
}

export async function submitContactForm(
  input: ContactFormInput,
): Promise<ApiResponse<null>> {
  return fetchAPI<null>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Newsletter signup (§5 landing page, mandatory section 7) ────────────

export async function subscribeNewsletter(
  email: string,
): Promise<ApiResponse<null>> {
  return fetchAPI<null>('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
