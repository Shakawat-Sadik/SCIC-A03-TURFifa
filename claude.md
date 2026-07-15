# Turfifa — Project Handoff / Status

**Last updated:** 2026-07-13
**Status:** Fresh rebuild in progress. This is the active project directory (`turfifa.com`), replacing the old `A03-AshoKheli` directory. Project renamed **AshoKheli → Turfifa** during the migration.

---

## Why the old directory was abandoned

The previous build (in `A03-AshoKheli/src`, `/prisma`, `/db`) was audited against the PRD and found to violate the mandated tech stack on nearly every infrastructure point, despite looking functional on the surface:

| PRD requires | Old directory actually had |
|---|---|
| MongoDB + Mongoose/Typegoose | Prisma + **SQLite** (`db/custom.db`) |
| BetterAuth, server-side sessions | **No real auth** — email-only lookup, no passwords/sessions |
| Cloudinary | Not installed/used |
| SSLCommerz | Not installed/used |
| pnpm | **bun** (`bun.lock` deleted, scripts used `bun`) |
| Real Next.js App Router routes (`/explore`, `/explore/:id`, dashboards) | Single `/` route with a client-side `currentView` switch in `src/app/page.tsx` |

The booking-integrity logic also implemented the exact read-then-write race the PRD explicitly forbids (`findUnique` → check → `update` instead of an atomic conditional write). Payments, refund-gating, endorsement-based rating unlock, and cooldown/penalty enforcement were schema-only or entirely absent — several dashboard sections (Offers & Requests, Gameweeks Ledger) were admitted mocks per the old `worklog.md`.

**Decision:** repair was rejected as "rewrite in disguise." Full from-scratch was rejected because the frontend (shadcn components, OKLCH theme, landing sections, explore/detail pages, Recharts wiring, forms) was PRD-compliant and worth reusing. Chosen path: **scaffold clean here, port the view layer, rebuild the entire backend/data layer from zero.**

---

## PRD amendments (already applied, carried over in `Turfifa-PRD.md`)

The PRD was checked against the assignment brief (`requirements.md`, also in this directory) and patched before migration:

1. **Added `/contact`** as a second "additional page" alongside `/about` (assignment requires ≥2; PRD only had one).
2. **Added concrete route paths** to §5's router-path table (`/dashboard`, `/manager/turfs/add`, `/manager/turfs/manage`, `/profile`, etc.) — previously only page *names* were listed, no URLs.
3. **Added a "Global Footer" subsection** (§5) specifying site-map links, contact block, social links, legal links.
4. **Added a deviation note** under §1's auth bullet documenting that BetterAuth (DB-backed sessions) is an intentional substitution for the assignment's listed "MongoDB with JWT" option — same underlying requirement, stricter guarantee (instant session revocation on ban/freeze).

Re-skim `Turfifa-PRD.md` before writing new `/about`/`/contact` copy — a global rename pass (`AshoKheli` → `Turfifa`) was run on the PRD, this file, and the three ported components that had hardcoded brand text (`auth-views.tsx`, `landing-page.tsx`, `navbar-footer.tsx`). Don't reintroduce the old name in new copy.

**Resolved:** the `b4ZBIWFrk0` preset (vs. the PRD draft's `b4FCPsuZYu`) was an intentional swap — the old preset ID had gone stale. PRD §7 has been updated to document the actual command. Verified the OKLCH token *values* in the generated `globals.css` are unchanged from the PRD's draft palette (same green primary/chart ramp) — only `--radius` changed (`0.45rem` vs. the draft's `0.625rem`) and the file structure now uses a `@theme inline` block importing `shadcn/tailwind.css` plus a derived radius scale (`--radius-sm` … `--radius-4xl`). PRD §7 updated to match.

---

## Final tech stack — actual installed state

- **Next.js 16 (App Router) + TypeScript strict + Tailwind 4 + shadcn/ui.**
- shadcn initialized with:
  ```bash
  pnpm dlx shadcn@latest init --preset b4ZBIWFrk0 --base radix --template next --pointer
  pnpm dlx shadcn@latest add --all --overwrite
  ```
  This produced `components.json` with `"style": "radix-nova"`, `"baseColor": "mist"`, built on the consolidated **`radix-ui`** package + **`@base-ui/react`** (not the old per-component `@radix-ui/react-*` packages the ported feature components were originally written against). `src/components/ui/**` now has 63 freshly-generated files, overwriting the ones ported from the old project.
- MongoDB + Mongoose + `@typegoose/typegoose` — installed.
- BetterAuth — installed, not yet wired.
- Cloudinary — installed, not yet wired.
- SSLCommerz (`sslcommerz-lts`) — installed, not yet wired.
- Recharts — installed.
- `jsonwebtoken` + `@types/jsonwebtoken` — installed (see PRD §1 deviation note: BetterAuth is the actual auth mechanism; keep this only if a specific JWT use case shows up, e.g. signed Cloudinary upload params).
- pnpm confirmed (`pnpm-lock.yaml` present).

Install commands actually run:
```bash
pnpm add mongodb mongoose @typegoose/typegoose recharts better-auth cloudinary sslcommerz-lts jsonwebtoken
pnpm add -D @types/jsonwebtoken
pnpm dlx shadcn@latest init --preset b4ZBIWFrk0 --base radix --template next --pointer
pnpm dlx shadcn@latest add --all --overwrite
```

---

## Migration status

**Done:**
- [x] Next.js scaffold created at `turfifa.com/`.
- [x] All backend/payment/auth dependencies installed.
- [x] shadcn initialized and all `ui` primitives generated (63 files, `radix-nova` style).
- [x] `src/components/**` feature dirs ported from the old project (`admin-dashboard`, `auth`, `explore`, `landing`, `manager-dashboard`, `player-dashboard`, `profile`, `shared` — the ported `ui/` subfolder was superseded by the fresh shadcn output above).
- [x] `src/hooks/**` ported (`use-mobile.ts`, `use-toast.ts`).
- [x] `Turfifa-PRD.md` and `requirements.md` copied over.
- [x] Brand rename pass (`AshoKheli` → `Turfifa`) applied to the PRD, this file, and the three components with hardcoded brand strings.

- [x] **Compatibility pass on ported feature components** — done. `pnpm exec tsc --noEmit` compiles clean except a handful of pre-existing, narrowly-scoped type errors confined to `landing-page.tsx` (framer-motion `Variants`/`ease` typing — passes `ease: 'easeOut'` as a plain string instead of `as const`) and `manager-dashboard.tsx` (one recharts `Formatter` type mismatch). Not blocking; fix opportunistically.
- [x] **Real Next.js App Router routes built.** Rather than ripping out the ported components' `currentView`-switch API (`useAppStore().navigate('explore')` etc.), it was reconciled with real routing — see below. Live routes: `/`, `/explore`, `/explore/[id]`, `/login`, `/register`, `/profile`, `/player`, `/matchmaking`, `/manager`, `/admin`, `/about`, `/contact`, `/privacy`, `/terms`, plus `not-found.tsx`. Each `page.tsx` is a thin wrapper rendering the matching zero-prop component from `src/components/**`.
- [x] `src/store/use-store.ts` **recreated** (Zustand — `zustand` added as a dependency), deliberately *not* a straight revert of the old pattern: it still exports `useAppStore`/`navigate(view)`/`ViewName`/`UserData` so the ported components (all of which import it and previously failed to compile — `Cannot find module '@/store/use-store'`) work unmodified, but `src/components/shared/route-sync.tsx` (mounted once in `layout.tsx`) keeps `currentView` synced with the *real* URL bidirectionally — `navigate()` triggers an actual `router.push`, and browser back/forward or a direct URL load updates `currentView` to match (with ping-pong guards). So the store is glue for the existing view-switcher components, not the source of truth for what route is showing — the URL is.
- [x] Content pages ported from the Figma Make export at `../TURFifa figma/Design project instructions` (`about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `not-found.tsx`) — adapted to this repo's shadcn/`next/link` conventions, not copied verbatim (that export used react-router plus its own `AuthContext`/`data.ts`, neither of which exist here; `guidelines/Guidelines.md` and `ATTRIBUTIONS.md` in that export were checked and are just unfilled template boilerplate, nothing to port).
- [x] `src/components/shared/Navbar-x-Footer.tsx` fixed (was a broken stub — undefined `session` variable, import of a nonexistent `@/lib/auth-client`, a syntax error in a `.map()` callback). It is **not** wired into `layout.tsx` — `navbar-footer.tsx`'s `Navbar`/`Footer` are the ones actually mounted (in `RootLayout`, alongside `RouteSync` and `Toaster`). `Navbar-x-Footer.tsx` is now a valid-but-unused alternate; consolidate or delete it next time either navbar needs real changes.
- [x] Added `zustand`, `framer-motion`, `react-hook-form`, `zod@^3`, `@hookform/resolvers`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-toast` — missing dependencies the already-ported components required (`landing-page.tsx` needs framer-motion; `auth-views.tsx` needs react-hook-form/zod; `ui/form.tsx` and the now-mounted `Toaster` need the radix primitives). `zod` is pinned to v3 because `auth-views.tsx` uses v3-style `z.record(valueSchema)`.

**Not done yet — next steps in order:**
1. Write Mongoose/Typegoose models. Use the old project's `prisma/schema.prisma` (still in `A03-AshoKheli/prisma/schema.prisma`, not copied here) and PRD §10 as the spec.
2. Wire BetterAuth + RBAC route guards.
3. Build the actual `/api/**` route handlers — the ported components already call `fetch('/api/turfs')`, `fetch('/api/admin')`, etc.; those 404 in dev right now since no backend exists yet.
4. Build Cloudinary upload flow.
5. Build SSLCommerz payment flow (initiate/IPN/validate/refund) with the atomic slot-claim + unique partial-index integrity rules from PRD §6.
6. Wire the ported UI components to the new API/data layer once it exists.
7. Once real auth/session state lands, tighten the store's `UserData.role` (currently a loose `string`, kept that way because `auth-views.tsx` builds it from an untyped API response) into the PRD's actual role literal union, and reconcile `logout()` — it currently just clears local state, no BetterAuth session call yet.

## Explicitly not ported from the old project (intentional)
`src/lib/db.ts` (Prisma singleton), `src/app/api/**` (Prisma-coupled routes), `prisma/schema.prisma` (kept only as a reference in the old directory), `next-auth` dependency (unused, replaced by BetterAuth), `z-ai-web-dev-sdk` dependency, and all AI-sandbox artifacts (`Caddyfile`, `.zscripts/`, `mini-services/`, `examples/websocket/`, `download/`, `upload/`, `tool-results/`, `bun.lock`, `db/`).

Note: an earlier version of this file listed `src/store/use-store.ts` and real App Router routes as intentionally *not* ported — that's now out of date, see "Done" above. The store was rebuilt on purpose this round as a thin URL-sync bridge, not reinstated as the old app's sole navigation source of truth.
