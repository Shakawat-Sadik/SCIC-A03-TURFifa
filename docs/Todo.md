# Turfifa — Conclusive To-Do List

Tracks everything left to satisfy SCIC-13 (`docs/SCIC_EJP-13 Backend Project Requirements.md`) and land the architecture decided in `Turfifa-PRD.md`. Grouped by phase; do them roughly in order — frontend rewiring depends on the backend's real routes existing.

**Repo names as they actually exist on disk:**
- Frontend: `turfifa.com`
- Backend: `turfifa.com-behind_the_scene` — same name locally and on GitHub

---

## Phase 0 — Installation Chains (`pnpm`)

Both repos use pnpm exclusively (§1). Two separate chains — these are not run from the same directory or `package.json`.

### Frontend (`turfifa.com`)

- [x] `pnpm install` — lockfile synced after removing mongoose/typegoose/mongodb/better-auth/jsonwebtoken/cloudinary/sslcommerz-lts
- [ ] Create `.env.local.example` (the fresh-clone chain below references it, but it doesn't exist yet)

```bash
# from the turfifa.com root
pnpm install
pnpm dev                          # http://localhost:3000
```

Fresh-clone version (new machine, nothing installed yet):

```bash
git clone <turfifa.com-repo-url> turfifa.com
cd turfifa.com
corepack enable
pnpm install
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_BASE_URL to the backend's URL
pnpm dev
```

### Backend (`turfifa.com-behind_the_scene`) — scaffolded

Recorded as executed, not as instructions to re-run:

- [x] `pnpm init`, TypeScript, Express
- [x] Runtime deps: `express cors dotenv bcrypt jsonwebtoken @prisma/client @prisma/adapter-pg pg resend cloudinary sslcommerz-lts express-rate-limit zod`
- [x] Dev deps: `typescript tsx prisma @types/{node,express,cors,bcrypt,jsonwebtoken,pg}`
- [x] `tsconfig.json` (editor/typecheck, `noEmit`) + `tsconfig.build.json` (emit, `rootDir: src`, `outDir: dist`)
- [x] `prisma init` → `prisma.config.ts` + `prisma/schema.prisma`
- [x] `package.json` scripts: `dev`, `build`, `start`, `typecheck`, `migrate:dev`, `migrate:deploy`, `studio`, `seed`
- [x] `esbuild: true` in `pnpm-workspace.yaml` `allowBuilds` (tsx won't run without its binary)

> **Runner note:** the project is ESM (`"type": "module"`). `tsx` is the dev runner; `ts-node-dev` was removed as it's unreliable under ESM. Relative imports in `src/` need `.js` extensions.

#### Supabase setup (Postgres host only — not Auth/Storage, see PRD §1)

- [x] Supabase project created; both connection strings copied into `turfifa.com-behind_the_scene/.env`
- [x] `DATABASE_URL` → transaction-mode pooler (IPv4-only, so the IPv6 caveat is moot)
- [x] `DIRECT_URL` → session-mode pooler (migrations)
- [x] `PORT=5000`, `CORS_ORIGIN=http://localhost:3000`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` added

**Prisma 7 wiring (differs from Prisma 6 — the `datasource` block no longer holds URLs):**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"          // NOT "prisma-client-js"
  output   = "../src/generated/prisma" // inside src/ so it stays under rootDir
}

datasource db {
  provider = "postgresql"              // no url / directUrl here
}
```

```ts
// prisma.config.ts — CLI only (migrate, studio): uses DIRECT_URL
datasource: { url: process.env["DIRECT_URL"] }

// src/lib/prisma.ts — runtime queries: uses DATABASE_URL via the pg adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

Import the client from `"../generated/prisma/client.js"`, **not** `"@prisma/client"`.

Gotchas still worth knowing:

- **Don't hand-assemble connection strings** — copy from the dashboard; pooler vs. direct hostnames differ.
- **Shadow DB:** `prisma migrate dev` wants to create a temporary database, which hosted Supabase may refuse. Author migrations against a **local** Postgres, commit them, then `prisma migrate deploy` against Supabase.

#### Migration workflow

```bash
# local Postgres for authoring migrations
docker run --name turfifa-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:16

# temporarily point DIRECT_URL at localhost:5433 (the CLI reads DIRECT_URL, not DATABASE_URL)
pnpm migrate:dev --name init
pnpm studio

# then against Supabase (real .env):
pnpm migrate:deploy
```

Once both run: frontend `:3000`, backend `:5000`, CORS allowing `http://localhost:3000` with `credentials: true`.

---

## Phase 1 — Backend (`turfifa.com-behind_the_scene`)

### Done

- [x] Repo scaffolded; deps, tsconfigs, scripts, `.env` in place (Phase 0)
- [x] `prisma/schema.prisma` — full §10 schema: **18 enums, 15 models**, `@@map` on all 15, 11 `@@index`. `prisma validate` passes.
- [x] `prisma generate` → client emitted to `src/generated/prisma`
- [x] `.gitignore` — `node_modules`, `.env*`, `/src/generated`, `/dist`
- [x] `src/lib/prisma.ts` — `PrismaClient` + `PrismaPg` adapter singleton
- [x] `src/lib/responseEnvelope.ts` — `sendSuccess()`, `sendError()`, `ApiError`
- [x] `src/lib/errorHandler.ts` — terminal error middleware + `notFoundHandler`; Zod errors → 400 with field detail

### Next

- [ ] **Decide `index.ts` vs `app.ts` + `server.ts`.** SCIC-13 §2 names `app.ts` and `server.ts` explicitly in its required structure; `index.ts` is not in that spec. Current `src/index.ts` is a stub that never calls `listen()`.
- [ ] Folder layout per §12: `src/routes/`, `src/services/`, `src/lib/middleware/`
- [ ] `prisma migrate dev --name init` against local Postgres — **no migrations exist yet**; the schema has never been applied to any database
- [ ] Raw-SQL follow-up migration: partial unique index on `booking_contracts(slot_id)` WHERE `status IN ('HELD','CONFIRMED')` (§6 — Prisma DSL can't express partial indexes)
- [ ] `prisma migrate deploy` against Supabase; verify tables land in `public` and Supabase's `auth`/`storage` schemas are untouched
- [ ] `src/lib/jwt.ts` — sign/verify access (15 min) + refresh (7 day)
- [ ] `src/lib/bcrypt.ts` — hash/compare (cost factor 12 per Epic 1)
- [ ] `src/lib/middleware/requireAuth.ts` — verify JWT + live `accountStatus` DB check (§5)
- [ ] `src/lib/middleware/requireRole.ts`
- [ ] **`src/lib/middleware/requireVerifiedEmail.ts`** — Epic 1 gates booking/hosting/applying on `emailVerified`; this is a *separate* check from `requireAuth` and was missing from this list
- [ ] `src/lib/middleware/rateLimit.ts` — IP-keyed for `/contact`, `/newsletter` **and** per-user limiters for authenticated writes (booking, join requests, reviews) per §5
- [ ] **Soft-delete enforcement strategy** — decide and implement. Prisma's `$use` middleware is gone in v7; the current mechanism is a Client Extension (`$extends`) overriding `findMany`/`findUnique`/`delete`. Without this, `isDeleted` is a column nobody honours (Phase 5 verifies it, but nothing here *implements* it)
- [ ] `src/lib/cloudinary.ts` — signed-upload signature generation
- [ ] `src/lib/sslcommerz.ts` — initiate, IPN validation (`val_id`), refund API (§6)
- [ ] `src/lib/mailer.ts` — verification + reset emails (Resend)
- [ ] `cors()` with explicit origin (never `*`, since `credentials: true` forbids the wildcard)
- [ ] Services + routes, one pair per module (§11): `auth`, `player`, `venue`, `slot`, `booking`, `team`, `review`, `admin`, `notifications`
- [ ] **Scheduled/expiry work** — three time-based behaviours in the PRD have no implementation home yet. Decide cron-worker vs. lazy-evaluation-on-read for each:
  - Slot hold auto-expiry after 10 min when IPN never arrives (§6)
  - Player status auto-flip to Idle "when active windows expire" (Epic 2)
  - 6-hour cancellation cooldown expiry (Epic 2) — `cooldownExpiryTimestamp` can be lazily compared on read, but hold-expiry probably can't
- [ ] `prisma/seed.ts` — demo `player` / `turf_manager` / `admin` accounts (§13); register it for `prisma db seed` in `prisma.config.ts`
- [ ] Deploy to Render or Railway; wire `prisma migrate deploy` into the deploy step with `DATABASE_URL`/`DIRECT_URL` as host env vars
- [ ] Confirm the deployed URL responds; set it as `NEXT_PUBLIC_API_BASE_URL` / `SERVER_URL` / `REMOTE_SERVER_URL` in the frontend

## Phase 2 — Frontend: replace stale same-origin `/api/*` calls

### Architecture decisions (settled — these override PRD §1 where they differ)

1. **Public reads → hybrid Server/Client.** `/explore/:id` becomes a pure Server Component. `/explore` becomes a Server Component reading `searchParams` and fetching, with a small client component for filter controls that push to the URL. Gives shareable filtered URLs. *(PRD §1 already specifies Server Component reads; the code was 100% client-side, so this closes the gap.)*
2. **RouteSync gets removed.** Delete `RouteSync` + `currentView`/`navigate` from the store; migrate all 24 call sites across 7 files to `<Link>` / `useRouter`. Removes the duplicate navigation mechanism (SCIC-13 §7 clean-architecture).
3. **`api-types.ts` is the single source of truth for shapes.** Reshape the store's `UserData`/`PlayerData` to match the API (`fullName` not `name`, `AttributeStat[]` not `Record<...>`), and let `role` become a proper union instead of `string`.
4. **Order of work:** backend-independent polish first, then rewiring.

> The stale comment in `use-store.ts` claiming `auth-views.tsx` is "a file we're not allowed to modify" no longer applies — that constraint is lifted.

### Done

- [x] `src/lib/api-types.ts` — `ApiResponse<T>` envelope + all resource types
- [x] `src/lib/api-client.ts` — bearer token, 401 → refresh → retry, `credentials: 'include'`
- [x] `src/lib/actions.ts` — Server Actions for `/api/contact` + `/api/newsletter`
- [x] `src/store/use-store.ts` — `accessToken` + `setAccessToken`, cleared on `logout()`
- [x] `src/lib/auth.ts` — BetterAuth stub replaced with a pointer comment
- [x] **Fixed the broken production build.** `next build` was failing on 21 pre-existing TypeScript errors, which would have blocked Vercel deploy (Phase 6). Four distinct causes:
  - `admin-dashboard.tsx` — `a.user?.name` accessed on `unknown`; narrowed the cast
  - `admin-dashboard.tsx` — Recharts `percent` possibly undefined → `(percent ?? 0)`
  - `auth-views.tsx` ×2 — `as keyof RegisterFormValues` flattened the field path so `field.value` widened to a union; retyped as `` `attributes.${string}` `` and dropped the two now-needless `as number` casts
  - `manager-dashboard.tsx` — Recharts `Formatter` signature mismatch; let the param infer, coerce with `Number()`
  - `landing-page.tsx` ×16 — `ease: 'easeOut'` widening to `string`; annotated both variant objects as `Variants` (one root cause, 16 errors)
  - Verified: `tsc --noEmit` clean, `pnpm build` green, all 16 routes prerender

### Next

Every one of these calls a Next.js Route Handler that **was never built** (`src/app/api` doesn't exist). Dead code today; rewire to `apiClient` using §11 paths.

- [ ] **Remove RouteSync** (decision 2) — delete `src/components/shared/route-sync.tsx`, drop `currentView`/`navigate`/`ViewName` from the store, unmount from `layout.tsx`, convert 24 call sites in: `admin-dashboard`, `auth-views`, `explore-page`, `venue-detail`, `landing-page`, `player-dashboard`, `navbar-footer`
- [ ] **Reshape store types** (decision 3) — `UserData`/`PlayerData` to match `api-types.ts`; fix fallout in the 12 consuming components
- [ ] **Hybrid refactor** (decision 1) — `/explore` and `/explore/:id` to Server Components + client filter island; fold the skeleton loader and empty state in here rather than writing them twice

- [ ] `src/components/auth/auth-views.tsx` — `fetch('/api/auth')` ×2 → `apiClient.post('/api/auth/login' | '/api/auth/register')`; store `accessToken` via `setAccessToken`, not just `setUser`. Demo buttons need the passwords `prisma/seed.ts` actually sets.
- [ ] `src/components/admin-dashboard/admin-dashboard.tsx` — `fetch('/api/admin')` ×3 → `/api/admin/alerts` (GET), `/api/admin/alerts/:id` (PATCH), `/api/admin/users/:id/status` (PATCH)
- [ ] `src/components/explore/explore-page.tsx` — `fetch('/api/turfs?...')` → `apiClient.get('/api/venues?...')`
- [ ] `src/components/explore/venue-detail.tsx` — `fetch('/api/bookings')` → `apiClient.post('/api/bookings')`
- [ ] `src/components/manager-dashboard/manager-dashboard.tsx` — `fetch('/api/turfs')`, `fetch('/api/slots')` ×2 → `/api/venues`, `/api/venues/:venueId/slots/generate`, `/api/slots/:id`
- [ ] `src/components/player-dashboard/matchmaking.tsx` — `fetch('/api/players')` → `/api/teams` or `/api/players`; check §11 before rewiring
- [ ] `src/components/player-dashboard/player-dashboard.tsx` — `fetch('/api/bookings?playerId=...')` → `apiClient.get('/api/bookings')` (JWT scopes it server-side)
- [ ] After each rewire: read `data` from the `ApiResponse<T>` envelope, not a raw body
- [ ] **Notifications consumer** — §11 exposes `GET /api/notifications` and `PATCH /:id/read`; nothing on the frontend consumes them yet
- [ ] **Match hub + `[Match 🔔]` navbar badge** (§9) — `hasActiveMatch` exists in the store but no hub route, teammate list, or kickoff countdown
- [ ] **Cloudinary upload flow** — venue images / avatars. Frontend requests a signature, then uploads direct to Cloudinary (§1). *No signature endpoint exists in §11 — the PRD needs one added (see drift list).*

## Phase 3 — Public forms → `lib/actions.ts`

- [ ] `src/app/contact/page.tsx` — wire `handleSubmit` to `submitContactForm()`
- [ ] `src/components/landing/landing-page.tsx` — wire `handleSubscribe` to `subscribeNewsletter()`

## Phase 4 — Cleanup & sync

- [x] `pnpm install` to sync `pnpm-lock.yaml` after the dependency removals
- [x] **Remove the Supabase client libraries from the frontend** — `@supabase/ssr` + `@supabase/supabase-js` uninstalled, `src/lib/supabase/` deleted. These were the "Framework / client library" path: browser→Supabase direct with Supabase Auth, which bypasses Express+Prisma and contradicts SCIC-13 §4/§6/§9.
- [ ] Drop the two now-dead `NEXT_PUBLIC_SUPABASE_*` lines from `.env.local` — nothing reads them since the clients were removed
- [ ] Grep remaining `useAppStore` consumers for type-check breakage against `UserData`
- [ ] Re-check for leftover Mongoose/Typegoose files before submission (none found as of this pass)
- [ ] **`FORMAT_8V8` drift** — the schema's `PlayerFormat` enum gained `FORMAT_8V8`, but `src/lib/api-types.ts` still declares `PlayerFormat = '5v5' | '6v6' | '7v7'`, and PRD §10 gives `rosterLimit` derivations for only those three. Add `'8v8'` to the frontend type and decide its roster size (16, by the existing pattern).
- [ ] **Recharts zero-size container warning** — surfaced during `pnpm build` prerender: `The width(-1) and height(-1) of chart should be greater than 0`. A `ResponsiveContainer` is rendering into a zero-size parent. Harmless at build time but likely means an invisible chart on first paint. Pre-existing, unrelated to the build fix.

## Phase 5 — Verification pass against SCIC-13 checklist

- [ ] ≥4 services — 8 planned (`auth`, `player`, `venue`, `slot`, `booking`, `team`, `review`, `admin`) ✓ once built
- [x] ≥2 enums — 18 in `schema.prisma`
- [ ] Soft delete — two separate problems:
  - **Enforcement is unimplemented.** The columns exist; nothing honours them yet (see Phase 1).
  - **Coverage is 9 of 15 models — your call whether that passes.** SCIC-13 §3 says "Each model should contain: … Soft delete (isDeleted)". Read literally that's all 15. Current split:
    - *Soft (9):* `User`, `PlayerProfile`, `FieldVenue`, `SlotConfiguration`, `BookingContract`, `Review`, `Team`, `AdminAlert`, `Notification`
    - *Hard (6):* `PlayerAttribute`, `AttributeEndorsement`, `TeamMembership`, `TeamJoinRequest`, `EmailVerificationToken`, `PasswordResetToken`
    - The 6 are child/join/audit rows that die with their parent, which is defensible design — but a grader ticking boxes literally may not read it that way. Adding `isDeleted`/`deletedAt` to all 6 costs little and removes the argument; token tables in particular look odd with it.
- [ ] Full CRUD (Create/GetAll/GetById/Update/SoftDelete) per module — cross-check against §11, nothing partial
- [ ] `{success, message, data}` envelope on **every** route including error paths — helpers exist, routes don't yet
- [ ] CORS genuinely exercised — confirm cross-origin `Access-Control-Allow-Origin` in devtools on an `api-client.ts` call
- [ ] JWT + bcrypt end-to-end — register → login → protected route → refresh → logout, manually tested
- [ ] Prisma Studio demonstrated (SCIC-13 §6 lists it as a required feature)
- [ ] Indexes present (SCIC-13 §6) — `@@index` on `users.role`, `field_venues.managerId`, `booking_contracts.slotId`/`status`, etc. ✓ in schema; verify they survive migration
- [ ] API documentation artifact — export §11 (or generate Postman/Swagger)
- [ ] **Frontend polish gates from PRD §5:**
  - [x] Custom `not-found.tsx` (token-themed, not stock Next.js) — already existed; football-pitch SVG, working CTAs to `/` and `/explore`
  - [x] `error.tsx` boundaries on `/explore`, `/explore/:id`, and all dashboard routes — 10 new files. One shared `components/shared/route-error.tsx` (SCIC-13 §7 "No Duplicate Code") + thin wrappers at root, `/explore`, `/explore/[id]`, `/player`, `/manager`, `/admin`, `/profile`, `/matchmaking`. Each has contextual copy and a sensible escape hatch; retry wires to Next's `reset()`; renders `error.digest` when present.
  - [x] `global-error.tsx` — **not originally on this list.** Without it a root-layout crash renders a blank white page. It replaces the document, so it carries its own `<html>`/`<body>`, imports the stylesheet directly, and stays dependency-free (pulling in Navbar/providers risks failing again inside the error page).
  - [ ] Designed empty states for every list surface (Explore-after-filter, My Bookings, Manage Inventories, Offers & Requests, Gameweeks Ledger, Admin queues) — a bare "No data" string violates the no-placeholder rule. *Explore's lands with the hybrid refactor (Phase 2).*
  - [ ] Skeleton loaders on `/explore` matching the card grid dimensions. *Also lands with the hybrid refactor.*
- [ ] **Recharts surfaces wired to real API data** (§8) — player attribute radar, venue peak-hours bar, manager yearly high-low area, review distribution, formation pie

## Phase 6 — Submission (SCIC-13 §17, PRD §13)

- [ ] Live Backend API URL (Render/Railway)
- [ ] Live frontend URL (Vercel)
- [ ] Two GitHub repo links (`git init` on the backend is yours to run)
- [ ] Demo credentials (player/manager/admin) working against the deployed backend
- [ ] API documentation link/artifact

---

## PRD drift — `Turfifa-PRD.md` still needs updating

Reality has moved past the PRD in these places. None are blockers, but the doc is wrong where it says:

- [x] **Repo name** — backend renamed to `turfifa.com-behind_the_scene` throughout the PRD (8 references)
- [ ] **§10 datasource block** — still shows Prisma 6 style (`url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")` inside `datasource`). Prisma 7 puts URLs in `prisma.config.ts`; the `datasource` block carries only `provider`.
- [ ] **§10 generator** — says `prisma-client-js`; actual is `prisma-client` with a required `output` path.
- [ ] **§10 client import** — implies `@prisma/client`; actual is `../generated/prisma/client.js`. Affects every service file.
- [ ] **§10 driver adapter** — not mentioned at all. Prisma 7 requires `@prisma/adapter-pg` + `pg` for SQL; `PrismaClient` takes `{ adapter }`.
- [ ] **§12 file tree** — missing `prisma.config.ts`, `tsconfig.build.json`, `src/generated/`; shows a single `tsconfig.json`.
- [ ] **§11 missing endpoint** — no upload-signature route (e.g. `POST /api/uploads/signature`) even though §1 specifies signed Cloudinary uploads brokered by the backend.
- [ ] **§11 missing middleware** — `requireVerifiedEmail` is implied by Epic 1 but absent from the "Auth Middleware Conventions" list.
- [ ] **No scheduled-jobs section** — hold expiry, status auto-flip, and cooldown expiry are described behaviourally but no mechanism is specified anywhere.
