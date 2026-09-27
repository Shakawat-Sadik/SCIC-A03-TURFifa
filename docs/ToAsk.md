stack: [
      "nodejs", "nestjs",
      "socketio", "graphql",
"postgreSQL", "prisma/drizzle", "zod", "betterAuth",
      "helmet", "multer", "jwt", "stripe", "sslcommerz", "cloudinary", "vercel", "render"
]

# Turfifa — Final PRD (1402-07-23 / 2023-10-15)

**Version 1.0** | Stable release — all amendments, feature additions, and routing decisions incorporated.

---

## 1. Executive Summary

**Turfifa** is an AI-first turf booking platform designed for Bangladesh. It connects turf owners with amateur players, handling turf discovery, booking, multi-gateway payments, and automated scheduling — all while operating on a verified-player rating system and dynamic availability.

### Core Philosophy
- **Trust over turf:** Verified players get lower fees, prioritized bookings, and exclusive features. Unverified players (ghost-riskers) pay premiums and face stricter limits.
- **Zero-touch booking:** AI-driven slot-suggestion and auto-calendar updates eliminate manual double-bookings.
- **Real-time coordination:** Live chat + dynamic pricing ensures immediate responses and fair market value.

### Key Features
- ✅ Player/Turf verification flows (national ID verification + AI-backed ID quality scoring).
- ✅ Dynamic pricing, pay-later/pay-now, multi-gateway payments (Stripe + SSLCommerz).
- ✅ AI slot-suggestion, turf-rating, and dynamic availability management.
- ✅ Real-time booking and cancellation enforcement (1–14 day refund gating).
- ✅ Player ratings, endorsement-based unlock, cooldowns, and penalties.
- ✅ Gameweeks, global/club/DM chat rooms, and club governance.
- ✅ Managerial tools: revenue dashboard, booking oversight, turf-level analytics.
- ✅ Built-in anti-ghosting: rating-gated features, real-name policies, verification tiers.

### Tech Philosophy
- **Production-grade stack:** NestJS, GraphQL, TypeScript strict, Prisma (PostgreSQL 15), Recharts, JWT, SSLCommerz, Stripe, Cloudinary, Vercel, Render (or Heroku fallback). All code **TypeScript only**; no embedded Python/Lua/LLM-generated English.
- **Zero-trust foundation:** AI used for verification, analysis, and suggestions — **not** for runtime gatekeeping, auth, or payment logic.
- **UX consistency:** One UI codebase (shadcn components, OKLCH theme) deployed across all surfaces; client-side routing driven by a single navigation tree (no embedded `currentView` flags in `page.tsx`).
- **Code quality:** Standardized naming (`pascalCase` for components, `snake_case` for database, `camelCase` for code), proper type usage, and documented edge cases (idempotency, race conditions, race-free booking/payment logic).

---

## 2. Players: Authentication & Profiles

### 2.1 Authentication (BetterAuth, public endpoints only)
All login endpoints are **public** for self-service; sessions handled via `BetterAuth` server-side cookies.

- **Signup:** Public; creates a **UNVERIFIED** player. Requires only display name, email, password, and optional phone number. AI-based name normalization runs on display name, not the official name stored in the database.
- **Login:** Public — supports email/password + social OAuth (Google/GitHub) via BetterAuth. Returns session cookie on success.
- **Logout:** Public (clears session cookie).

#### Public auth-related endpoints (client-facing only)

| Endpoint | Method | Description |
|---|---|---|
| `/login` | GET | Show login form (email/password + OAuth buttons) |
| `/signup` | GET | Show signup form (name, email, password, optional phone) |
| `/api/auth/callback/:provider` | GET | OAuth provider callback (handled by BetterAuth) |

### 2.2 Player Profile (UNVERIFIED → VERIFIED → ELITE/PRO)

| Field | Type | Description |
|---|---|---|
| **id** | UUID (PK) | Player ID (primary key) |
| **displayName** | string (non-empty) | User-chosen display name — sanitized and lowercased on write for search indexing |
| **officialName** | string | Full name (optional; required for booking with ID verification) |
| **phone** | string | Optional phone number |
| **email** | string | Unique (index) |
| **profileImage** | string (URL) | Cloudinary hosted image (see §14) |
| **avatar** | enum {UNVERIFIED, VERIFIED, ELITE, PRO} | Status badge |
| **isBanned** | boolean | Admin-enforced ban flag (prevents login + public/private visibility) |
| **isFeatured** | boolean | Optional highlight for verified users |
| **isVerifiedByAdmin** | boolean | True once admin-approved |
| **verifiedAt** | timestamp | Date of admin verification |
| **aiVerificationStatus** | enum {PENDING, PASSED, FAILED} | AI-run national ID quality check |
| **aiVerificationBadge** | string | AI analysis badge text |
| **aiVerificationReport** | JSONB | Raw AI scoring artifacts |
| **totalRating** | number | Average rating from endorsements (0–5) |
| **endorsementCount** | number | Number of endorsements received |
| **bookingCount** | number | Number of successfully completed bookings |
| **isPremiumUser** | boolean | True for ELITE/PRO (lower fees, extended access) |
| **isBlocked** | boolean array | List of player IDs this user has blocked |
| **walletBalance** | number (cents) | Real balance used for instant refunds |
| **refundFenceEnd** | timestamp | End date/time when the current booking’s refund fence expires |
| **cooldownUntil** | timestamp | Cooldown enforced after disputes or booking cancellations |
| **subscriptionTier** | enum {FREE, GOLD, PLATINUM, DIAMOND} | Subscription level (see §5) |
| **subscriptionExpiresAt** | timestamp | Subscription end time |
| **stripeCustomerId** | string | Stripe customer identifier (for subscriptions) |
| **sslcommerzId** | string | SSLCommerz customer identifier |
| **createdAt** | timestamp | Record creation time |
| **updatedAt** | timestamp | Last update time |

### 2.3 Uniqueness and Constraints
- `email` unique (index).
- `phone` unique (index, optional).
- `displayName` unique (index).
- **One club per player:** A player may belong to at most one club. Enforced by unique constraint on `(playerId, clubId)` and by the business logic in `/api/clubs`.

---

## 3. Verification Workflow

**AI-based, two-stage verification process** that automatically grades ID quality before admin approval.

### 3.1 Initial Registration
- User provides **email, password, display name, optional phone**. Status = `UNVERIFIED`.
- Optional AI-based display-name clustering: AI suggests canonical names to reduce dups (e.g., “Saif Rony” → “Saif” or “Rony”).

### 3.2 Tier Progression (UNVERIFIED → VERIFIED → ELITE/PRO)

| Tier | Requirements |
|---|---|---|---|
| **UNVERIFIED** | New accounts (no verification completed) |
| **VERIFIED** | **Admin approval + Validated National ID** (e.g., NID, Passport, Driving License) |
| **ELITE** | ≥ 20 verified bookings OR 5 bookings with AI rating ≥ 4.5 |
| **PRO** | ≥ 50 verified bookings AND average endorsement rating ≥ 4.8 |

### 3.3 AI ID Verification (two-stage)

#### Stage 1 — Quality Check (runs on submit, no admin needed)
- **Input:** Raw photo + optional text capture.
- **AI steps:**
  1. **Face comparison:** Person in photo vs face on ID; if mismatch → auto-reject.
  2. **Text extraction (OCR):** Extract all text fields.
  3. **Cross-field validation:** Verify ID number format, dates, name consistency.
  4. **Quality scoring:** Image clarity, blur, lighting, metadata consistency.
- **Output:** `aiVerificationStatus` (`PENDING/PASSED/FAILED`), `aiVerificationBadge` (short human-readable status), `aiVerificationReport` (detailed JSON artifacts).
- **Logic:**
  - `PASSED` → status becomes `PENDING` for admin review.
  - `FAILED` → status becomes `FAILED` with auto-rejection reason.
  - `PENDING` → status