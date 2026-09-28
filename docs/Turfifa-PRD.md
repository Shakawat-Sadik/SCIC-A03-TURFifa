# Product Requirement Document (PRD)

**Project Name:** Turfifa — Tactical Analytics & Turf Booking Platform

**Author:** Shakawat Sadik (Full-Stack Developer)

**Status:** Approved / Build Spec

**Binding backend spec:** `docs/Backend_design_Preplans.md`

---

## 0. Document Conventions

xxx- **`[REQUIRED]`** — mandated by SCIC-13. Must ship in Phase 1.
xxx- **`[EXTENSION]`** — beyond the brief, built to acquire a specific engineering skill. Phase 2 or 3. Never blocks submission.

xxxPhase definitions and the skill-acquisition map live in SCIC-13 §11. The short version: **Phase 1 is the submission line.** Everything after it is upside.

---

## 1. Technology Stack & Architecture

### 1.1 Architectural Thesis

Turfifa is a Turf football management platform with three properties that shape every decision below:

1. **Inventory is exclusive.** A time slot sells exactly once. Two people clicking "book" in the same second is not an edge case — it is the peak-hour normal case. This makes concurrency control the spine of the system, not a footnote.
2. **Money moves through a third party.** SSLCommerz and Stripe (for Foreign account exchange) confirms payment asynchronously by webhook. The system must be correct when that webhook arrives twice, arrives late, or never arrives at all.
3. **State is shared and time-sensitive.** A slot going from available to held is information other viewers need _now_, not on their next refresh. As the first candidate successfully send the purchase request, a 15 minutes temporary lock will be placed on that slot. If a candidate fail to process payment or The turf manager doesn't confirm candidates slot purchase within 15 minutes, then slot goes back to the pool as available.

Those three facts justify the queue, the outbox, and the realtime plane respectively. Every architectural choice below traces back to one of them — nothing is here because it looked impressive on a diagram.

### 1.2 Monorepo

**Turborepo + pnpm workspaces**, replacing the earlier two-repository plan.

The reason is concrete: tRPC delivers end-to-end type safety by having the frontend import the backend's `AppRouter` **type**. Across two repositories that means publishing a versioned npm package on every backend change — a publish-install-rebuild cycle on every field rename, in solo development. In one repository it is an import statement, and a renamed Prisma field surfaces as a red squiggle in a React component before the dev server even restarts.

```text
turfifa/
├── apps/
│   ├── web/         Next.js 16 · React 19 · Tailwind 4 · shadcn/ui
│   ├── api/         NestJS 11 · the control plane
│   ├── worker/      NestJS standalone · BullMQ processors      [EXTENSION]
│   └── realtime/    Go 1.23 + Fiber · the data plane           [EXTENSION]
├── packages/
│   ├── db/          Prisma schema, migrations, seed
│   ├── contracts/   Zod schemas + domain event payloads
│   ├── proto/       gRPC .proto + generated TS/Go stubs        [EXTENSION]
│   └── config/      shared eslint · tsconfig · prettier
└── docs/
```

Graders receive one repository link containing both frontend and backend, satisfying the submission requirement.

### 1.3 Frontend — `apps/web`

- **Framework:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui on the `radix-nova` preset (§7).
- **Server state: TanStack React Query, exclusively.** Every piece of data that lives in the database is React Query's responsibility — caching, background refetch, invalidation, optimistic updates, retry. No server data is ever copied into a client store, because two copies of the same fact drift.
- **Client state: Zustand.** Only genuinely client-owned state — the in-memory access token, theme, sidebar collapse, notification badge count, socket connection status.
- **Complex local state: Redux Toolkit** `[EXTENSION]` — scoped to exactly one feature, the tactical formation planner (§9.3). Drag-and-drop positioning with undo/redo history and time-travel debugging is the textbook case where a reducer-and-action-log model beats a simple store. Applied nowhere else. Using both Zustand and RTK across the same domain would be incoherent; using each where it fits is a design decision worth defending.
- **Forms:** React Hook Form with a Zod resolver, using the _same_ schema object `apps/api` validates against.
- **Charts:** Recharts, themed from the `--chart-*` tokens (§8).
- **Animation:** Framer Motion for the hero tactical preview, live-update flashes on the slot board, and dashboard transitions.
- **Realtime:** a WebSocket client to `apps/realtime`, pushing invalidations into React Query rather than maintaining a parallel cache.
- **Payments:** Stripe.js + Stripe Elements for international card collection (card details never touch the server). SSLCommerz redirect handles all domestic methods. Gateway is chosen before the Stripe Element mounts so the wrong SDK is never loaded.

### 1.4 Backend — `apps/api` (NestJS)

- **Runtime:** NestJS 11 on Node.js 22 with the Fastify adapter, TypeScript strict.
- **Database:** PostgreSQL 16 on **Supabase**, used strictly as a Postgres host — not its Auth, not its Storage, not its auto-generated REST API. Auth is hand-rolled JWT (SCIC-13 §4 requires exactly that), media is Cloudinary, all access is via Prisma. Supabase's own `auth`/`storage` schemas are untouched; Prisma manages only `public`.
- **ORM:** Prisma 6, owned by `packages/db`. Dual connection URLs — pooler for queries, direct for migrations (SCIC-13 §1.4).
- **Cache, queues, pub/sub:** Redis (Upstash or Railway). One dependency, three jobs: cache store, BullMQ backing store, and the Redis Streams bus feeding `apps/realtime`.
- **Auth:** `@nestjs/jwt` + bcrypt, refresh-token rotation with reuse detection (SCIC-13 §4).
- **API surfaces:** REST at `/api/*` (mandated, public, webhook-facing) and tRPC at `/trpc/*` (the app's own authenticated screens). Both are thin transports over one service layer.
- **Payments:** dual-gateway — SSLCommerz (server-validated IPN + refund API, domestic methods) and Stripe (`stripe-node` SDK, Payment Intents, Refunds API, webhook signature verification, international cards). Both gateways share one refund-gated state machine (§6.4); the gateway field on the contract is the only branch point.
- **Media:** Cloudinary signed uploads; the API secret never reaches the browser.

### 1.5 Realtime — `apps/realtime` (Go + Fiber) `[EXTENSION]`

Go owns the **data plane**: WebSocket connections, room membership, presence, and event fanout. It holds no business logic and never opens a Postgres connection.

The boundary is chosen so Go is _obviously_ the right tool rather than an arbitrary slice of CRUD moved to another language. Holding thousands of mostly-idle connections is a goroutine-per-connection problem, which is precisely what Go's runtime is built for — and because the service owns no domain rules, it can be reasoned about, deployed, and restarted entirely independently.

- **Nest → Go:** asynchronous, over Redis Streams. Consumer groups give at-least-once delivery with replay after a restart.
- **Go → Nest:** gRPC, and only for the two things that genuinely need a synchronous typed reply — resolving a socket's subscription permissions on connect, and fetching a roster snapshot on room join.
- **Auth:** the gateway verifies the access token **locally** using the JWT public key. No network round-trip on connect.

The two services never share a database transaction, and coupling runs one direction only.

### 1.6 Type Safety Chain

The property this project is built to demonstrate: **one definition per shape, verified by the compiler at every layer.**

```text
  packages/db/prisma/schema.prisma
        │  prisma generate
        ▼
  Prisma model types ── consumed by ──► apps/api service layer
        │                                      │
        │                                      │  procedures return
        ▼                                      ▼
  packages/contracts/  ──────────────►  tRPC AppRouter type
   Zod schemas                                 │
   (input validation)                          │  import type
        │                                      ▼
        ├──► ZodValidationPipe    (REST input)  apps/web
        ├──► .input()             (tRPC input)  useQuery / useMutation
        └──► zodResolver          (RHF, browser)  fully typed, zero codegen
```

Rename `baseStandardPrice` in the schema and the build breaks in the React component that renders it. That is the whole point, and it is why the monorepo and tRPC decisions are load-bearing rather than decorative.

### 1.7 Observability `[EXTENSION]`

- **Tracing:** OpenTelemetry SDK in both NestJS and Go, exporting OTLP to Grafana Tempo. Context propagates browser → Next → Nest → BullMQ job → Redis Stream → Go, so one booking renders as one trace.
- **Metrics:** Prometheus. RED metrics (rate, errors, duration) on the booking path, plus queue depth, job failure rate, and WebSocket connection count.
- **Logging:** Pino, structured JSON, with a correlation ID injected by middleware and carried through every layer.
- **Errors:** Sentry on both frontend and backend.
- **Health:** `@nestjs/terminus` — `/healthz` (process alive) and `/readyz` (Postgres and Redis reachable), distinguished so a rolling deploy does not route traffic to an instance that cannot serve it.

### 1.8 Hosting

| Service          | Platform                            |
| ---------------- | ----------------------------------- |
| `apps/web`       | Vercel                              |
| `apps/api`       | Railway / Render                    |
| `apps/worker`    | Railway / Render — separate process |
| `apps/realtime`  | Railway / Render — separate process |
| PostgreSQL       | Supabase                            |
| Redis            | Upstash / Railway                   |
| Traces & metrics | Grafana Cloud (free tier)           |

---

## 2. Project Overview & Objectives

Turfifa is a production-grade, full-stack platform serving amateur football, futsal, and 6v6 turf communities. It does two jobs at once: it is a **booking marketplace** connecting players to local venues, and it is an **RPG-style competitive layer** — player attribute ratings, contract-based matchmaking, squad formation, and post-match endorsements — that turns one-off pickup games into a persistent competitive record.

The second half is what separates it from a generic booking app. Anyone can list a venue and take a payment. Turfifa also tracks who actually showed up, how they played, and whether their self-reported rating survives contact with their teammates' opinions.

### Primary Objectives

- **Role-based execution** — strict RBAC across Player (buyer), Turf Manager (seller), and System Admin, enforced server-side and mirrored client-side only for UX.
- **Discovery and booking** — search, filter, and book by surface type, location, price, availability, and automated time-of-day classification.
- **Booking integrity** — a slot sells exactly once, under concurrency, with payment and refund rules gating every state transition.
- **Fair matchmaking** — reliability enforced through short-notice contract-drop penalties and automatic admin escalation.
- **Dynamic inventory yield** — managers mass-generate slot grids, edit rows inline, and run promotional pricing.
- **Data-driven dashboards** — Recharts visualisations for booking habits, seasonal spend, revenue curves, and match performance.
- **End-to-end type safety** — one schema definition, verified by the compiler from Postgres column to React prop.
- **Operational visibility** `[EXTENSION]` — the system explains itself under load through traces, metrics, and a queue dashboard.

---

## 3. Target Audience & Core Personas

**The Player / Scouter (buyer).** Books turf slots, sets an operational status, hosts games as a "Scouter," joins open teams, and rates teammates on concrete performance metrics. Cares about: is this pitch free on Friday at 8pm, and is this squad at my level?

**The Turf Manager (seller).** Manages venue profiles, automates pricing schedules, and monitors business growth through multi-variable analytics. Cares about: which hours are dead, what should I discount, and did that booking actually get paid?

**The System Admin.** Oversees platform health, resolves short-notice drop-out disputes, handles attribute-rating adjustment requests, and freezes or bans bad actors. Cares about: what is broken, who is abusing the system, and which refunds are stuck?

---

## 4. Epic & Feature Specifications

### Epic 1: Identity, Registration & Onboarding `[REQUIRED]`

- **Role-based registration** — built with shadcn/ui form primitives, validated by the Zod schema shared with the server. Role selection (Player / Turf Manager) branches the onboarding flow.
  - _Preferred payment vectors:_ multi-select over bKash, Nagad, Upay, Others. Checking "Others" reveals a free-text field. Actual routing happens inside SSLCommerz's hosted checkout, so this is stored as a **display preference**, not a payment router.
  - _Base position array:_ select 1–3 positions from standard football tags (ST, CAM, CB, GK, …). The primary pick becomes the preferred position tag.

- **Locked parameter rating system.** Players define six baseline attributes at registration: Attack (ATT), Passing (PAS), Strength/Stamina (STA), Speed (SPE), Technical/Dribbling (TEC), Defense (DEF).
  - _Gatekeeper range rule:_ self-assigned values are capped at **40–95**. An attribute reaches up to **100** only after accumulating **10 unique verified endorsements** from matches actually played.
  - _Modification prevention:_ once committed, values freeze. A late submission attempt returns an explicit warning directing the user to file an admin adjustment dispute. Server-side, `PATCH /api/players/:id` rejects any attempt to write `PlayerAttribute.value` post-commit — the freeze is enforced in the service, not just hidden in the UI.

- **Demo access utility** — one-click "Demo Player," "Demo Manager," and "Demo Admin" buttons that auto-fill seeded credentials, so a reviewer can evaluate all three role classes in under a minute.

- **JWT auth** — registration bcrypt-hashes at cost 12; login issues a 15-minute access token (response body, held in Zustand memory) plus a 7-day refresh token (`httpOnly` cookie, hashed row in `refresh_tokens`). Rotation with reuse detection: replaying a used refresh token revokes the whole family and raises an `AdminAlert`. Full flow in SCIC-13 §4.

- **Email verification & password reset** — custom, no third-party auth library. Both issue single-use time-boxed tokens (SHA-256 stored, never plaintext) delivered by Resend. Unverified accounts can browse `/explore` but cannot book, host, or apply — enforced by `EmailVerifiedGuard`.

- **Google OAuth with account linking** `[EXTENSION]` — signing in with Google using an email that already has a password account **links** the identity to the existing `User` rather than silently creating a duplicate. Account linking is the part of OAuth that is actually interesting and the part most tutorials skip.

### Epic 2: Contractual Matchmaking & The Scouting Engine `[REQUIRED]`

- **Tri-state status lifecycle** — players switch between Idle ⚪, Organizing 🔵, and Interested to Play 🟢. Status auto-reverts to Idle when the active window expires (a delayed BullMQ job in Phase 2; a periodic sweep in Phase 1).

- **The Difficulty Sorting Ladder** — search Organizing players filtered by a computed overall-rating tier:

  | Tier            | Range    |
  | --------------- | -------- |
  | Legend          | 90–95    |
  | Elite           | 85–89    |
  | Pro             | 80–84    |
  | Semi-Pro        | 75–79    |
  | Home Buddies    | 70–74    |
  | Playing for Fun | below 70 |

- **Contract cooldowns & short-notice penalties.**
  - Player and Scouter agreeing to a slot enter a locked contract.
  - Cancelling triggers an immediate **6-hour global application cooldown** on the cancelling account.
  - _Late pull-out:_ a drop within **2 hours** of kickoff dispatches an automated ticket to the admin alert stream, flagging the user for review. This is what gives the penalty teeth — the cooldown alone is cheap.

- **Team / squad formation** — an Organizing player hosts a match and owns a `Team` capped at a format-derived roster size (12 for 6v6 including subs). Players discover open teams through the Difficulty Ladder and send a join request; the captain accepts or declines from the **Offers & Requests Matrix**. Captains can also directly offer a slot to a specific player, bypassing the open queue. Accepted members feed the navbar Match hub roster (§9.2) and the Gameweeks Ledger endorsement flow.

### Epic 3: High-Yield Slot Engine & Booking Workflows `[REQUIRED]`

- **Venue profile creation** — an authenticated Turf Manager creates a field profile: title, short and full descriptions, location, surface type, supported formats, amenities, and Cloudinary image references. This seeds the slot engine. Strict rule: no Lorem Ipsum — real Dhaka addresses, realistic prices, genuine descriptions.

- **Automated serial grid drop** — managers specify opening time, closing time, and slot duration. Confirm computes:

$$\text{Total Slots} = \frac{\text{Closing Time} - \text{Opening Time}}{\text{Slot Duration}}$$

Generating a month of slots across several venues is thousands of rows and must not block an HTTP request. Phase 1 runs it in a single batched `createMany` transaction with a hard cap; Phase 2 moves it to a BullMQ job with progress reported back over WebSocket.

- **Automated time-type classification** — each generated slot is tagged from its start time:

  | Type      | Window        |
  | --------- | ------------- |
  | Morning   | up to 11:59   |
  | Afternoon | 12:00 – 16:59 |
  | Evening   | 17:00 – 19:59 |
  | Night     | 20:00 onward  |

- **Inline editable matrix cells** — generated slots render in inline-editable inputs, restricted to the owning manager and admins, for overriding individual prices or blocking times. Mutations are optimistic through React Query and roll back on server rejection.

- **Promotional strikethrough engine** — when a promo price is set, the UI renders the base price struck through in `text-muted-foreground` alongside the active `text-primary` discount. Token-driven, so it holds in dark mode.

- **Booking integrity** — a slot sells exactly once. Concurrency, hold window, and payment mechanics in §6.

### Epic 4: Live Availability & Presence `[EXTENSION]`

The problem this solves is real, not decorative: at peak hours multiple people browse the same venue's Friday-evening grid simultaneously. Without push, the first one to click wins and everyone else gets a `409` on a slot their screen still shows as green. That is a bad experience caused by stale state, and polling every few seconds to paper over it wastes requests while still being wrong between ticks.

- **Live slot board** — when a slot moves to `HELD` or `BOOKED`, every client viewing that venue sees it flip within a second, with a brief Framer Motion highlight so the change is noticed rather than silently applied.
- **Presence** — "4 people are viewing this venue," and on high-demand slots "2 people are looking at this time." Genuine booking-urgency signal, and the natural demo of a presence-tracking hub.
- **Match hub** — the confirmed roster and live kickoff countdown update without a refresh as teammates accept.
- **Notification badge** — server-pushed, replacing polling.
- **Mechanism** — Nest writes a domain event to the outbox in the same transaction as the state change; the relay publishes it to a Redis Stream; the Go gateway consumes it and fans it out to the room. Clients translate the push into a React Query invalidation rather than patching a second cache.

### Epic 5: Background Job System `[EXTENSION]`

Turfifa already generates work that has no business happening inside a request/response cycle. BullMQ makes that explicit.

| Job                   | Trigger                      | Why it cannot be inline                                                                           |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `slot-hold-expiry`    | delayed 10 min on checkout   | Must fire even if the user closes the tab — otherwise abandoned checkouts strand inventory        |
| `cooldown-release`    | delayed 6h on cancellation   | Nothing is listening 6 hours later                                                                |
| `status-auto-idle`    | delayed to window expiry     | Same                                                                                              |
| `refund-retry`        | on SSLCommerz refund failure | Needs exponential backoff; a dead-letter queue routes exhausted retries to the admin dispute desk |
| `slot-grid-generate`  | manager confirms grid        | Thousands of rows; would time out the request                                                     |
| `notification-fanout` | domain event                 | Fanning out to a full roster shouldn't slow the captain's response                                |
| `match-reminder`      | scheduled T-24h and T-2h     | Scheduled work by definition                                                                      |
| `outbox-relay`        | repeating, every second      | Publishes committed events to Redis Streams                                                       |
| `email-dispatch`      | any transactional email      | An SMTP timeout must never fail a registration                                                    |

**Bull Board** mounts at `/admin/queues`, admin-guarded — job state, retry counts, and failure reasons visible rather than inferred from logs.

### Epic 6: Outbound Webhooks `[EXTENSION]`

Turf managers frequently run their own booking sheet or POS. Rather than asking them to poll, Turfifa becomes a webhook _provider_:

- Managers register endpoint URLs and subscribe to events (`booking.confirmed`, `booking.cancelled`, `refund.completed`, `slot.released`).
- Deliveries are signed **HMAC-SHA256** over the raw body with a per-subscription secret, sent as `X-Turfifa-Signature` alongside `X-Turfifa-Timestamp`. Receivers verify the signature and reject timestamps outside a 5-minute window, which is what makes replay attacks fail.
- Failures retry with exponential backoff (1m, 5m, 30m, 2h, 12h). Consecutive failures past a threshold auto-disable the subscription and notify the manager.
- Every attempt is logged with status code, response body excerpt, and duration, viewable in the manager dashboard.

This pairs with the _inbound_ SSLCommerz IPN so both directions of the webhook pattern are implemented — receiving one correctly and delivering one reliably are different skills.

### Epic 7: Player Clubs `[REQUIRED]`

Clubs are a **persistent social and identity layer** — a clan-style group that a player belongs to independent of any individual match or booking. Booking remains individual; clubs own no financial role. The motivation is community continuity: players who regularly play together should have a shared identity, a shared chat room, and a shared public profile that outlasts any single session.

#### 7.1 Club Structure & Roles

- **One club per player.** A player must leave their current club before creating or joining another. This keeps identity unambiguous — a player's club tag is a single affiliation, not a list.
- **Maximum roster size: 30 members** (including the owner). Chosen to be large enough for a real community but small enough that membership carries weight.
- **Three roles:**

  | Role | Permissions |
  |---|---|
  | **Owner** | Full control: edit club profile, invite, kick, promote/demote, disband, transfer ownership |
  | **Club Admin** (co-admin) | Invite members, kick non-admin members, post messages on behalf of the club in DMs to turf managers |
  | **Member** | Participate in club chat, visible on the club profile roster |

- **Transfer & disband:** The owner can transfer ownership to any Club Admin. Disbanding the club soft-deletes the `Club` record and removes all `ClubMembership` rows (hard delete, as they are join records — §10 schema note).

#### 7.2 Club Profile

Each club has a public-facing profile page at `/clubs/:id`:

```text
+---------------------------------------------------------------+
| [CLUB EMBLEM / INITIALS AVATAR]    Club Name  [TAG]          |
| Description (max 200 chars)                                   |
| Founded: <date>  ·  Members: <n>/30  ·  Avg. Rating: <n>     |
|                                                               |
| [ROSTER TABLE]  Name · Position · Overall · Role · Joined    |
+---------------------------------------------------------------+
```

- **Club tag:** 3–5 uppercase letters, unique platform-wide, editable once after creation. Displayed in brackets beside the name everywhere a club is referenced (e.g., `[DHKF]`).
- **Average overall rating:** derived from the mean of all current members' `overallRating` values. Recomputed on membership change; not stored — computed at query time and cached for 60 seconds.
- **Privacy setting:** controls discoverability and join mechanics:

  | Setting | Browse | Join |
  |---|---|---|
  | Open | Public on `/clubs` | Any player can send a join request |
  | Invite Only (default) | Public on `/clubs` | Only via invite from owner/admin |
  | Closed | Hidden from `/clubs` | No new members |

#### 7.3 Invite & Join Flow

**Invite path (Invite Only / Open):**
1. Owner or Club Admin opens the invite modal. Searches players by **display name (fuzzy, minimum 3 chars)** or **exact user ID**.
2. Search results exclude: current club members, players already in another club, players with a pending invite from this club.
3. Sending an invite creates a `ClubInvite` row and dispatches a `Notification` of type `CLUB_INVITE` to the target player.
4. The target player sees the invite in their notification feed with Accept / Decline. Pending invites **expire after 48 hours** (a `ClubInviteExpiry` BullMQ delayed job in Phase 2; a scheduled DB sweep in Phase 1).
5. On accept: a `ClubMembership` row is created, the `ClubInvite` is marked `ACCEPTED`, and the new member is added to the club's private chat room.

**Join request path (Open clubs only):**
1. A player viewing a public Open club can click "Request to Join."
2. Creates a `ClubInvite` row with `direction: REQUESTED`.
3. Owner and Club Admins see the request in `/clubs/:id/manage` under a "Requests" tab. Accept/Decline works identically to the invite path, from the other side.

**Kick:** Owner/Admin selects a member from the roster in `/clubs/:id/manage`. Kicks remove the `ClubMembership` row (hard delete — it is a join record). The kicked player is also removed from the club chat room's `ChatRoomMember` row.

#### 7.4 Club Routes

Added to the route map (§5.1):

- **`/clubs`** — public browse: search by name or tag, filter by privacy (Open only), sort by avg. rating or member count.
- **`/clubs/:id`** — public club profile.
- **`/clubs/:id/manage`** — owner/admin panel (roster, pending invites/requests, club settings). Protected: `ClubAdmin` or `Owner` role required.
- **`/clubs/create`** — club creation form. Player-only, redirect if already in a club.

#### 7.5 Free Tier Note

No additional paid infrastructure. Club data is plain Postgres rows. Invite expiry in Phase 1 runs as a scheduled DB sweep (a `cron` task inside NestJS `@nestjs/schedule`, no BullMQ needed). The club chat room is created automatically when the club is created (`ChatRoom` row, type `CLUB`) and requires no separate provisioning.

---

### Epic 8: Messaging & Chat System `[REQUIRED]`

Three distinct communication surfaces, unified under a **right-hand side drawer** triggered by a persistent chat icon in the navbar. The drawer has three tabs: **🌐 Global**, **🏰 Club**, **💬 Messages**. Unread counts badge each tab independently. The Club tab is hidden when the logged-in user has no club membership.

#### 8.1 Global Chat Room

A single platform-wide live feed.

- **Who can post:** Admins and Players. Turf Managers are **read-only** — they see all messages but the message input is replaced with a muted label "You can receive messages via Direct Messages."
- **Rolling 200-message buffer.** The buffer is enforced server-side: when a new message is inserted and the total count for the global room exceeds 200, the oldest row is **hard-deleted** (not soft-deleted — it carries no meaning once purged, and soft-delete would let the count grow unboundedly). The client always fetches the latest 200 on open; no pagination, no history before the buffer.
- **Message content:** plain text only, max 500 characters. No attachments, embeds, or reactions in Phase 1.
- **Moderation:** Admins can delete any message. A deleted message's `content` is replaced with `[Message removed by admin]` and `isDeleted` is set `true`. The row is retained so the thread does not develop gaps — readers see a tombstone, not a missing entry.
- **Rate limit:** 1 message per 2 seconds per user, Redis-keyed. Enforced by `@nestjs/throttler`.

#### 8.2 Club Chat Rooms

Each club has a private chat room created automatically when the club is created.

- **Who can post:** all `ClubMembership` members (Owner, Club Admin, Member). Turf Managers or Admins who are invited into the club as members participate fully with no restriction.
- Same **200-message rolling buffer** and hard-delete mechanic as the global room.
- **Moderation:** Owner and Club Admins can delete messages within their club room. Global Admins can delete in any room.
- On member kick or club disband, the member's `ChatRoomMember` row is removed. They lose access immediately.

#### 8.3 Direct Messages (DMs)

One-on-one messaging, primarily for player/club inquiries to turf managers and manager replies.

**Permission matrix:**

| Sender | Can DM |
|---|---|
| Player | Any Turf Manager |
| Club Admin | Any Turf Manager (can send "on behalf of [Club Name]" by toggling a flag at send time, which prepends a club tag to the message display) |
| Turf Manager | Any Player, any Admin |
| Admin | Anyone |

- Initiating a DM with a turf manager is surfaced on the venue detail page (`/explore/:id` → "Message Manager" button) and in the club management panel.
- **No rolling cap on DMs.** History is retained in full and paginated: 20 messages per load, infinite scroll upward.
- A `Notification` of type `DIRECT_MESSAGE` is created for the recipient on each new DM, incrementing the drawer badge.
- DM threads are listed in the **💬 Messages** tab, ordered by most recent message. Each thread shows: counterpart name, role badge, last message preview (truncated at 60 chars), timestamp.

#### 8.4 "On Behalf Of Club" Flag

When a Club Admin sends a DM to a turf manager with the club flag toggled:
- The message is stored with `onBehalfOfClubId` set to the club's ID.
- The receiving turf manager sees the message attributed as: **"[DHKF] Shakawat Sadik"** — the club tag rendered in the primary token colour before the sender name.
- This is a display convention only. The actual `senderId` is always the individual user; the club tag is a label, not a separate actor.

#### 8.5 Drawer UX

```text
┌─────────────────────────────┐
│  💬 Turfifa Chat         ✕  │
│  [🌐 Global] [🏰 Club] [💬]│
├─────────────────────────────┤
│                             │
│  [message list — scrollable]│
│                             │
├─────────────────────────────┤
│  [input field]   [Send ▶]   │
└─────────────────────────────┘
```

- Drawer opens from the right, overlaying content (not pushing it). Width: 360px on desktop, full-width on mobile (sheet pattern from shadcn/ui `<Sheet side="right">`).
- Message list scrolls independently. New messages auto-scroll to the bottom only if the user is already at the bottom (no forced scroll that interrupts reading).
- Timestamps: relative (e.g. "2 min ago") for messages within the last hour, absolute time for older.
- Turf Manager global tab: message input replaced by a grey info banner — "Post in the global chat is not available for Turf Managers."

#### 8.6 Realtime — Phase Plan

- **Phase 1:** React Query polling. Global room and DM thread list refetch every 5 seconds (`refetchInterval: 5000`). Adequate for launch; no additional infrastructure.
- **Phase 2/3:** WebSocket push via the existing `apps/realtime` Go gateway. New subscription topics: `room:global`, `room:club:{clubId}`, `user:{id}` (for DM notifications). Each push triggers a React Query invalidation for the relevant room, not a direct cache patch — the same pattern as the slot board (§9.4).

#### 8.7 Free Tier Note

Phase 1 chat requires zero additional paid services. Polling is client-driven; the server responds with a standard REST query. No Redis pub/sub, no WebSocket server, no queue worker needed at launch. The 200-message hard-delete rule also keeps Postgres storage flat rather than growing with traffic.

---

## 5. Route-by-Route Blueprint & Dashboards

### 5.1 Route Map

**Public (logged out)** — `/` · `/explore` · `/explore/:id` · `/about` · `/contact` · `/login` · `/register` · `/privacy` · `/terms` · `/clubs` · `/clubs/:id`

**Player (logged in)** — `/dashboard` · `/dashboard/bookings` · `/dashboard/matrix` · `/dashboard/ledger` · `/profile` · `/match/:teamId` · `/clubs/create` · `/clubs/:id/manage`

**Turf Manager** — `/manager` · `/manager/turfs/add` · `/manager/turfs/manage` · `/manager/turfs/:id/slots` · `/manager/bookings` · `/manager/webhooks` `[EXTENSION]`

**Admin** — `/admin` · `/admin/users` · `/admin/alerts` · `/admin/venues` · `/admin/queues` `[EXTENSION]` · `/admin/webhooks` `[EXTENSION]`

**Chat drawer** — not a route; a persistent `<Sheet side="right">` overlay accessible from any page via the navbar chat icon. Contains global, club, and DM tabs (§8.5).

Navbar shows a minimum of 3 routes logged out and 5+ logged in, satisfying the layout requirement.

### 5.2 Public Layer

- **`/` (Home)** — the 7 mandatory sections below.
- **`/about`** — platform mission, how the marketplace works, the story behind Turfifa. Zero placeholder copy.
- **`/contact`** — contact form (name, email, message) plus real support email, phone, city, and social links, sharing a source of truth with the footer.
- **`/explore` (Core Finder Engine)**
  - _Search:_ debounced query across venue titles, descriptions, and locations.
  - _Filtering (minimum two simultaneous fields):_ surface type, price range, rating, and automated `timeType`. Filter state lives in the URL query string, so a filtered view is shareable and survives a refresh — and Server Components can render it directly.
  - _Sorting & pagination:_ price ascending, rating descending, or newest, with cursor-based pagination.
  - _Responsive grid:_ 4 columns desktop, 2 tablet, 1 mobile.
  - _Skeleton loader:_ dimensionally exact shimmer cards matching the real grid, so there is no layout shift on data arrival.
- **`/explore/:id` (Details)**
  - _Media reel_ — Cloudinary-hosted carousel.
  - _Overview_ — long-form description, venue rules, amenities, location.
  - _Key specifications_ — dimensions, optimal player count, lighting quality, pricing structure.
  - _Availability grid_ — slots by day and time type, live-updating in Phase 3.
  - _Review aggregator_ — Recharts rating distribution alongside individual reviews.

### 5.3 The 7 Mandatory Landing Sections `[REQUIRED]`

1. **Hero** — 60–70vh maximum, strong headline, booking CTA, and an interactive 6v6 tactical miniature preview.
2. **Live usage metrics** — real counters for active bookings, registered teams, and vetted venues. Real aggregates from the database, cached for 60 seconds — not hardcoded numbers.
3. **Featured turfs** — top-rated pitches with quick-view indicators.
4. **How it works** — Search → Select Formation → Reserve Slot.
5. **Tactical module preview** — the 6v6 pitch planner available to registered captains.
6. **Verified testimonials** — statements from local league captains.
7. **Newsletter + FAQ** — email capture beside a shadcn Accordion covering platform rules.

### 5.4 Global Footer `[REQUIRED]`

Present on every route, with **zero `#` placeholder links**: site map (Home, Explore, About, Contact, plus role-relevant dashboard links when logged in), contact block (support email, phone, city — same source as `/contact`), social links opening in new tabs, and legal links to `/privacy` and `/terms` that resolve to real pages.

### 5.5 Error, Empty & Abuse States `[REQUIRED]`

- **404** — custom `not-found.tsx` on the token theme, with CTAs back to `/` and `/explore`.
- **500** — route-level `error.tsx` boundaries on `/explore`, `/explore/:id`, and every dashboard, offering retry rather than a blank crash.
- **Empty states** — every list that can legitimately be empty (filtered Explore results, My Bookings, Manage Inventories, Offers & Requests, Gameweeks Ledger, admin queues) ships a designed empty state: icon, one line of real copy, and a relevant CTA. A bare "No data" string violates the no-placeholder-content rule.
- **Rate limiting** — public unauthenticated writes (`/contact`, newsletter) IP-keyed at 5/hour; authenticated writes (booking, join requests, reviews) per-user. Redis-backed via `@nestjs/throttler`, so limits hold across multiple instances rather than resetting per process.

### 5.6 Player Dashboard

1. **My Bookings** — timeline of the latest 20 confirmed reservations with payment status and cancellation windows.
2. **Offers & Requests Matrix**
   - _Join filter:_ requests sent to Scouters (_Requested_) and invites received (_Offer_).
   - _Scout filter:_ offers extended to target players (_Offered_) and the applicant queue for hosted matches (_Interested_).
3. **Gameweeks Ledger** — up to 10 historical match logs in muted low-opacity styling. Captains edit results (scorelines, goals, assists, star players) and nominate squad members to endorse performance metrics, feeding the attribute endorsement system.
4. **Spend analytics** — monthly expenditure area chart.
5. **My Club** — a dashboard card showing the player's current club (name, tag, member count, role badge). Links to the club profile and, for Owner/Club Admin, the club management panel. If the player has no club, the card shows an empty state: "You're not in a club yet" with a CTA to browse `/clubs` or create one.

### 5.7 Turf Manager Dashboard

- **Business analytics grid** — a rolling 12-month high-low line/area chart plotting peak revenue potential against off-peak promotional floors.
- **Incoming requests queue** — sortable, with modals summarising player details, comments, and payment status.
- **Confirmed bookings table** — live operational view allowing modification or cancellation up to 1 hour before kickoff. **Cancellation is refund-gated:** a paid booking cannot be cancelled until an SSLCommerz refund clears (§6.4). Until then the slot stays locked and cannot be resold.
- **Slot grid manager** — inline-editable matrix with bulk generation.
- **Webhook settings** `[EXTENSION]` — endpoint registration, event subscriptions, delivery log, and a test-fire button.

### 5.8 Admin Dashboard

- **Global auditing feed** — freeze, limit, or remove abusive users and fraudulent venues. Because auth is stateless JWT rather than server-side sessions, revocation works through a per-request check: `JwtAuthGuard` verifies the token **and** loads the user's current `accountStatus` from Postgres on every protected call, rejecting `403` immediately. Moderation takes effect on the offender's very next request. `POST /api/auth/refresh` performs the same check, so a frozen user cannot mint new access tokens at all.
- **Dispute center** — short-notice cancellation alerts, attribute adjustment requests, failed refunds, and refresh-token reuse detections, all reading from `AdminAlert`.
- **Platform metrics** — GMV, booking volume, active users, cancellation rate.
- **Queue dashboard** `[EXTENSION]` — Bull Board at `/admin/queues`.

### 5.9 Notifications

In-app only for MVP — the `[Match 🔔]` navbar badge and dashboard toasts. No email or push notifications are required by the brief. `Notification` rows are created server-side whenever a contract is confirmed, cancelled, or refunded, or an endorsement is requested. Phase 1 fetches them via React Query with a polling interval; Phase 3 replaces polling with a server push over WebSocket.

---

## 6. Payments, Refunds & Booking Integrity

This section is the engineering core of the project. It is worth reading closely — most of what makes Turfifa more than a CRUD app lives here.

### 6.1 Payment Flow (SSLCommerz)

1. **Initiate** — checkout creates a `PENDING` transaction and calls SSLCommerz's initiate endpoint, receiving a `GatewayPageURL`. The player is redirected to the hosted payment page (cards, bKash, Nagad, Rocket, Upay, internet banking).
2. **Validate server-side** — the browser redirect to the success URL is **never trusted on its own**. Anyone can navigate to a success URL. Confirmation happens only when SSLCommerz's **IPN** reaches the server _and_ the transaction is independently re-validated through the validation API using `val_id`. Only a `VALID`/`VALIDATED` response flips the booking to `PAID`/`CONFIRMED`.
3. **Persist** — `tran_id` and `bank_tran_id` are stored on the `BookingContract` for later refund calls.

### 6.2 Anti–Double-Sell

A slot must never sell twice. Three independent layers, each catching what the previous one misses:

- **Atomic claim.** Booking creation runs in a Prisma `$transaction` that conditionally updates `SlotConfiguration.lifecycle` from `AVAILABLE` to `HELD` with the expected state in the `WHERE` clause, and creates the `BookingContract` only if that update affected exactly one row. The loser of a race sees `count === 0` and is rejected with `409`. There is no read-then-write gap for two requests to slip through.
- **Database guarantee.** A partial unique index on `booking_contracts (slot_id) WHERE status IN ('HELD','CONFIRMED')` makes a second active booking on one slot impossible even under an application-logic bug. Declared via a raw SQL migration, since Prisma's DSL cannot express partial indexes. This layer exists precisely because the first layer is code, and code has bugs.
- **Hold window.** On checkout the slot enters `HELD` for 10 minutes, tied to the pending transaction. If IPN validation never arrives, the hold expires and the slot returns to `AVAILABLE` — preventing both double-sell and inventory stranded by abandoned checkouts.

### 6.3 Idempotency & The Transactional Outbox `[EXTENSION]`

Webhooks are delivered **at least once**. SSLCommerz can and will send the same IPN twice — on network retry, on their side timing out after we already committed. Handled naively, a duplicate IPN double-confirms a booking or double-credits a refund.

**Inbound idempotency.** Every IPN is keyed by `tran_id + status`. The handler inserts into an `idempotency_keys` table with a unique constraint _inside the same transaction_ as the state change. A duplicate hits the constraint, the transaction rolls back, and the endpoint returns the original stored response with `200`. Returning `200` matters: an error status makes the gateway retry forever.

**Outbound consistency — the dual-write problem.** Confirming a booking means writing to Postgres _and_ publishing an event. Doing both directly creates a failure window: if the process dies between commit and publish, the booking is confirmed but nobody is ever told. The transactional outbox closes it:

```text
  ┌─ single Postgres transaction ──────────────────────┐
  │  UPDATE booking_contracts SET status = 'CONFIRMED' │
  │  UPDATE slot_configurations SET lifecycle='BOOKED' │
  │  INSERT INTO outbox_events (type, payload)         │
  └────────────────────────────────────────────────────┘
                          │  commits atomically
                          ▼
              outbox-relay (BullMQ, ~1s)
                          │
                          ▼
              Redis Stream ──► apps/realtime ──► WebSocket clients
                           └─► notification-fanout job
                           └─► outbound webhook delivery
```

The event is committed with the state change or not at all. The relay may publish a message twice after a crash — which is fine, because consumers are idempotent by design. **At-least-once delivery plus idempotent consumers** is the standard, correct trade; exactly-once delivery is not a thing you can buy.

### 6.4 Refund Policy & Refund-Gated Cancellation

Refund rules mirror the 2-hour late-pull-out threshold, so cancellation semantics stay consistent platform-wide:

| Scenario                           | Outcome                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| Player cancels ≥ 2h before kickoff | Full refund minus the non-refundable gateway processing fee        |
| Player cancels < 2h before kickoff | No refund, plus a 6-hour cooldown and an admin alert               |
| Turf Manager cancels (any time)    | Always a full refund — the manager is at fault                     |
| Platform / venue fault             | Full refund including the processing fee, absorbed by the platform |

**A manager cannot free or resell a paid slot until the player is made whole.** The state machine:

```text
  CONFIRMED + PAID
        │  manager requests cancel
        ▼
  REFUND_PENDING ──► call SSLCommerz refund API (bank_tran_id)
        │
        ├── refund succeeds ──► CANCELLED · slot released · player notified
        │
        └── refund fails ─────► BLOCKED
                                booking stays REFUND_PENDING
                                slot stays locked (NOT resellable)
                                AdminAlert raised → Dispute Center
                                refund-retry job with exponential backoff
```

**The guard:** the cancel handler rejects any manager cancellation where `paymentStatus === 'PAID' && refundStatus !== 'SUCCEEDED'`. The slot staying locked on failure is deliberate — releasing it would let the venue resell inventory a player has paid for and not been refunded.

### 6.5 Dual Gateway — Stripe (International Cards) + SSLCommerz (Domestic)

#### Why two gateways

SSLCommerz covers every payment method a Bangladesh-based player needs: local Visa/Mastercard, bKash, Nagad, Rocket, Upay, Dutch-Bangla internet banking. Stripe is added for one specific gap: **international card holders** — players booking from abroad or carrying a card issued outside Bangladesh. SSLCommerz's acquirer may decline foreign-issued cards; Stripe's global acquiring network accepts them natively. The gateways do not overlap in their intended use; the system routes automatically rather than forcing the user to know which to pick.

#### Gateway detection and routing

1. At checkout the backend calls `POST /api/bookings/:id/detect-gateway`. The handler reads the user's IP geolocation (MaxMind GeoLite2, bundled — no external call) and the `gateways` preference stored on the `User` record (set at registration).
2. **Decision rule:**
   - If IP country is `BD` and no international-card preference is flagged → return `SSLCOMMERZ`.
   - If IP country is non-BD, or user has previously chosen Stripe → return `STRIPE`.
3. The frontend receives the gateway recommendation and renders the corresponding checkout UI:
   - `SSLCOMMERZ` → "Pay with local methods" button; click redirects to SSLCommerz hosted page.
   - `STRIPE` → Stripe Elements card input mounts inline; no page redirect.
4. **User override:** a toggle at the bottom of the checkout modal — "Switch to international card / Switch to local payment" — re-calls the endpoint with an explicit `preferredGateway` override and re-renders the UI. The override is stored on the `BookingContract` and not persisted to the user profile (the next checkout detects fresh).

#### Stripe payment flow

1. **Initiate** — `POST /api/bookings/:id/checkout` with `gateway: STRIPE` in the body. Backend creates a Stripe Payment Intent (`stripe.paymentIntents.create`) with `amount` in BDT smallest unit (paisa), `currency: 'bdt'`, `metadata: { bookingId }`, and `idempotencyKey: bookingId`. Returns `{ clientSecret }` to the frontend.
2. **Collect & confirm** — Stripe Elements card input collects PAN, expiry, CVC. Frontend calls `stripe.confirmCardPayment(clientSecret)`. No card data ever reaches the server.
3. **Webhook confirmation** — Stripe delivers `payment_intent.succeeded` to `POST /api/stripe/webhook`. The handler:
   - Verifies the Stripe-Signature header with `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. Rejects any request that fails verification.
   - Looks up the `BookingContract` by `metadata.bookingId`.
   - Inserts into `idempotency_keys` with key `stripe:{paymentIntentId}:succeeded` inside the same transaction as the state change. Duplicate webhook → unique constraint fires → transaction rolls back → handler returns `200` with the cached response (same behaviour as SSLCommerz IPN, §6.3).
   - Flips `BookingContract.status` to `CONFIRMED`, `paymentStatus` to `PAID`, writes `stripePaymentIntentId`.
4. **Failed payment** — `payment_intent.payment_failed` webhook sets `paymentStatus` back to `UNPAID`, releases the `HELD` slot to `AVAILABLE`.

#### Stripe refund flow

Stripe refunds mirror the SSLCommerz refund-gated state machine (§6.4) exactly — the gateway field is the only branch:

```text
  CONFIRMED + PAID (gateway: STRIPE)
        │  cancel requested
        ▼
  REFUND_PENDING ──► stripe.refunds.create({ payment_intent: stripePaymentIntentId })
        │
        ├── refund succeeds (Stripe webhook: charge.refunded) ──► CANCELLED · slot released
        │
        └── refund fails ─────────────────────────────────────► BLOCKED
                                                                  AdminAlert raised
                                                                  refund-retry job (Phase 2)
```

#### Schema additions

```prisma
enum PaymentGateway {
  SSLCOMMERZ
  STRIPE
}
```

Fields added to `BookingContract`:

```prisma
paymentGateway        PaymentGateway?   // set on checkout initiation
stripePaymentIntentId String?           // stored on Stripe checkout; used for refund
```

#### Free tier note

Stripe charges 2.9 % + $0.30 per successful transaction (no monthly fee, no setup cost). SSLCommerz charges 1.5–2 % depending on method. Both are pay-per-use and incur no cost until a payment actually succeeds — appropriate for free-tier launch with zero upfront infrastructure spend. The MaxMind GeoLite2 database is free and bundled as a binary asset; no API subscription is required.

---

## 7. Visual Hierarchy & Design System

### Project & Design-System Setup

- **Package Manager:** pnpm.
- **Shadcn/UI Initialization:** the project and theme are scaffolded via the shared preset:

```bash
pnpm dlx shadcn@latest init --preset b4ZBIWFrk0 --base radix --template next --pointer
pnpm dlx shadcn@latest add --all --overwrite
```

- This installs the Next.js template on the `radix-nova` style (`baseColor: mist`, built on the consolidated `radix-ui` + `@base-ui/react` packages rather than individual `@radix-ui/react-*` packages) and writes the token theme below into `app/globals.css` via a `@theme inline` block that imports `shadcn/tailwind.css`. **Tokens are the single source of truth** — components reference semantic tokens (`bg-primary`, `text-muted-foreground`, `border`, etc.), never hardcoded hex. _(Superseded an earlier draft preset ID, `b4FCPsuZYu` — the token values below are unchanged between the two, only the init command and generated UI primitive layer differ.)_

### Design Tokens (`app/globals.css`)

The palette is OKLCH and theme-aware (light + dark). The primary hue sits in the green band (~128–131°), carrying the synthetic-turf identity from earlier drafts — now expressed as tokens with full dark-mode support, so the old hardcoded emerald/slate hex values are retired in favor of the variables below.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.148 0.004 228.8);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.148 0.004 228.8);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.148 0.004 228.8);
  --primary: oklch(0.841 0.238 128.85);
  --primary-foreground: oklch(0.405 0.101 131.063);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.963 0.002 197.1);
  --muted-foreground: oklch(0.56 0.021 213.5);
  --accent: oklch(0.963 0.002 197.1);
  --accent-foreground: oklch(0.218 0.008 223.9);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.925 0.005 214.3);
  --input: oklch(0.925 0.005 214.3);
  --ring: oklch(0.723 0.014 214.4);
  --chart-1: oklch(0.897 0.196 126.665);
  --chart-2: oklch(0.768 0.233 130.85);
  --chart-3: oklch(0.648 0.2 131.684);
  --chart-4: oklch(0.532 0.157 131.589);
  --chart-5: oklch(0.453 0.124 130.933);
  --radius: 0.625rem;
  --sidebar: oklch(0.987 0.002 197.1);
  --sidebar-foreground: oklch(0.148 0.004 228.8);
  --sidebar-primary: oklch(0.648 0.2 131.684);
  --sidebar-primary-foreground: oklch(0.986 0.031 120.757);
  --sidebar-accent: oklch(0.963 0.002 197.1);
  --sidebar-accent-foreground: oklch(0.218 0.008 223.9);
  --sidebar-border: oklch(0.925 0.005 214.3);
  --sidebar-ring: oklch(0.723 0.014 214.4);
}

.dark {
  --background: oklch(0.148 0.004 228.8);
  --foreground: oklch(0.987 0.002 197.1);
  --card: oklch(0.218 0.008 223.9);
  --card-foreground: oklch(0.987 0.002 197.1);
  --popover: oklch(0.218 0.008 223.9);
  --popover-foreground: oklch(0.987 0.002 197.1);
  --primary: oklch(0.768 0.233 130.85);
  --primary-foreground: oklch(0.405 0.101 131.063);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.275 0.011 216.9);
  --muted-foreground: oklch(0.723 0.014 214.4);
  --accent: oklch(0.275 0.011 216.9);
  --accent-foreground: oklch(0.987 0.002 197.1);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.56 0.021 213.5);
  --chart-1: oklch(0.897 0.196 126.665);
  --chart-2: oklch(0.768 0.233 130.85);
  --chart-3: oklch(0.648 0.2 131.684);
  --chart-4: oklch(0.532 0.157 131.589);
  --chart-5: oklch(0.453 0.124 130.933);
  --sidebar: oklch(0.218 0.008 223.9);
  --sidebar-foreground: oklch(0.987 0.002 197.1);
  --sidebar-primary: oklch(0.768 0.233 130.85);
  --sidebar-primary-foreground: oklch(0.274 0.072 132.109);
  --sidebar-accent: oklch(0.275 0.011 216.9);
  --sidebar-accent-foreground: oklch(0.987 0.002 197.1);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.56 0.021 213.5);
}
```

**Token intent map** (how the palette binds to features):

- `--primary` (turf green): CTAs, active/confirmed states, and the live discount price.
- `--background` / `--card` / `--border`: structural surfaces — replaces the retired slate-dark backgrounds.
- `--muted-foreground`: the struck-through _original_ price — replaces the previously hardcoded `text-slate-400` so it holds up in dark mode.
- `--destructive`: cancellations, short-notice penalties, and block/freeze/ban actions.
- `--chart-1 … --chart-5` (green ramp): Recharts series palette (see §8).
- `--sidebar-*`: the dashboard shell for the player / manager / admin navigation.

### Layout Uniformity

- **Card Constraints:** Absolute size consistency across all explore cards; corner radius driven by the token `--radius` — set to `0.45rem` by the `radix-nova` preset actually installed (supersedes earlier drafts' `0.625rem`/8px notes). The preset also derives `--radius-sm` through `--radius-4xl` as multiples of `--radius` for consistent scaling across component sizes. Smooth hover transformations.
- **Grid Framework:** Standard 4-column layout on wide screens (`lg:grid-cols-4`), adapting to 2 columns on tablets and 1 column on mobile.
- **Zero Placeholders:** Strict rule prohibiting `Lorem Ipsum` filler text. All entities must use realistic addresses, prices, descriptions, and structural summaries.

---

## 8. Data Analytics & Recharts Mapping

All Recharts series draw from the `--chart-1 … --chart-5` tokens in §7, so charts stay on-brand and theme-aware in both light and dark mode. Every chart family maps to a concrete surface — none exist for decoration:

| Chart                | Surface                | Question it answers                                                                    |
| -------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| **Radar**            | Profile header         | How is this player's ability distributed across the six attributes?                    |
| **Bar**              | Venue detail           | Which hours are busy? (Players find quiet slots; managers find pricing opportunities.) |
| **Area / Line**      | Manager dashboard      | How is revenue trending across 12 months, peak versus promotional floor?               |
| **Area**             | Player dashboard       | What am I spending on turf per month?                                                  |
| **Bar / aggregator** | `/explore/:id` reviews | How are ratings distributed — is a 4.2 average five 4s or a mix of 5s and 1s?          |
| **Pie / Radar**      | Team analytics         | Which formations and tactical setups get chosen?                                       |

Aggregates are computed server-side in dedicated analytics endpoints (`GET /api/venues/:id/analytics`, `GET /api/players/:id/analytics`), never by shipping raw booking rows to the browser and reducing them in React. Analytics queries are Redis-cached with a 5-minute TTL `[EXTENSION]` and invalidated on the relevant write.

---

## 9. Component-Driven User Interfaces

### 9.1 Player Profile Header

```text
+-------------------------------------------------------------------------+
| [ PROFILE IMAGE ]                                     [ RECHARTS RADAR ]|
| Full Name Text Layout                                 [  CHART DISPLAY ]|
| Height / Weight Metric Strings                        Tracks ATT, PAS,  |
| Stars Counter / Matches Played / Goals / Assists      STA, SPE, TEC, DEF|
| Contact Number Reference Input Line                                     |
|                                                                         |
| -> Primary Position Text Banner (Large Bold Font Size) | Overall Rating |
| -> Secondary Backup Roles (Muted Miniature Text Variants)               |
+-------------------------------------------------------------------------+
```

### 9.2 Global Match Button Utility

When a contract updates successfully, a `[Match 🔔]` badge renders in the global navbar. It routes to a dedicated hub tracking venue address, slot timing, the confirmed teammate list (with the user's own name highlighted in the primary token colour), and an animated countdown to kickoff.

Phase 1 drives this with a React Query polling interval. Phase 3 replaces polling with a WebSocket subscription `[EXTENSION]` — the countdown becomes genuinely live, and a teammate accepting appears instantly rather than up to a poll-interval late.

### 9.3 Tactical Formation Planner `[EXTENSION]`

A drag-and-drop 6v6 pitch where captains position their confirmed roster, save named formations, and step backward and forward through changes.

**This is the one feature backed by Redux Toolkit rather than Zustand**, and the reason is specific: undo/redo over a positional state tree is exactly the problem an action log and pure reducers solve well. Every drag is a dispatched action; history is the action list; undo is replay to index _n_. Doing that in a plain mutable store means hand-rolling a history stack and hoping every mutation path remembers to push onto it. Redux DevTools time-travel also makes the feature debuggable in a way no other approach here would be.

Everywhere else in the app, Zustand is the right size for the job. Using both is a deliberate scoping decision, not indecision — and being able to explain _why each one is where it is_ is worth more than picking a side.

### 9.4 Live Slot Board `[EXTENSION]`

The venue availability grid, subscribed to that venue's realtime room. On a push:

- The affected cell transitions to its new state with a brief Framer Motion highlight — a state change the user did not cause should be _noticed_, not silently applied under their cursor.
- The push triggers a React Query invalidation for that venue's slot list rather than patching client state directly. The socket says _what changed_; React Query remains the single source of truth for _what the data is_. Two caches with two update paths is how subtle inconsistency bugs get in.
- Presence renders as an unobtrusive "4 people viewing" indicator, escalating to a per-slot warning on contested times.

---

## 10. Database Schema (Prisma / PostgreSQL)

Lives in `packages/db/prisma/schema.prisma` — owned by the shared package, not by `apps/api`, so the worker and any future service consume the same generated client rather than each defining their own.

Fully normalised: real foreign keys, explicit join tables, and native Postgres enums. Soft delete (`isDeleted` + `deletedAt`) and `createdAt`/`updatedAt` on every primary entity. Pure join and audit rows — memberships, endorsements, tokens, outbox, deliveries — are hard-deleted by design, because they carry no independent meaning; soft-deleting the parent is what matters, and blanket soft delete on join tables quietly breaks uniqueness constraints.

**Compliance:** 10 domain modules (minimum 4), 22 enums (minimum 2), full relational modelling, soft delete, timestamps, and `@@map()` throughout.

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Supabase Supavisor pooler — application queries
  directUrl = env("DIRECT_URL")   // session-mode/direct — migrations + Prisma Studio (§1)
}

// ── Enums ───────────────────────────────────────────────────────────────

enum UserRole {
  PLAYER
  TURF_MANAGER
  ADMIN
}

enum AccountStatus {
  ACTIVE
  LIMITED
  FROZEN
  BANNED
}

enum MatchStatusState {
  IDLE
  ORGANIZING
  INTERESTED
}

enum AttributeCode {
  ATT
  PAS
  STA
  SPE
  TEC
  DEF
}

enum SurfaceType {
  INDOOR
  ARTIFICIAL_TURF
  NATURAL_GRASS
}

enum PlayerFormat {
  FORMAT_5V5
  FORMAT_6V6
  FORMAT_7V7
}

enum SlotTimeType {
  MORNING
  AFTERNOON
  EVENING
  NIGHT
}

enum SlotLifecycle {
  AVAILABLE
  HELD
  BOOKED
}

enum BookingStatus {
  HELD
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  UNPAID
  PENDING
  PAID
  REFUND_PENDING
  REFUNDED
}

enum RefundStatus {
  NONE
  REQUESTED
  SUCCEEDED
  FAILED
}

enum ReviewTargetType {
  VENUE
  PLAYER
}

enum TeamMemberRole {
  CAPTAIN
  MEMBER
}

enum RequestDirection {
  REQUESTED
  OFFERED
}

enum RequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum AdminAlertType {
  LATE_PULL_OUT
  ATTRIBUTE_DISPUTE
  USER_REPORT
  REFUND_FAILURE
}

enum AdminAlertStatus {
  OPEN
  REVIEWING
  RESOLVED
}

enum NotificationType {
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  REFUND_UPDATE
  MATCH_INVITE
  ENDORSEMENT_REQUEST
  CLUB_INVITE          // invite or join-request received (Epic 7)
  DIRECT_MESSAGE       // new DM received (Epic 8)
}

enum PaymentGateway {
  SSLCOMMERZ
  STRIPE
}

enum ClubPrivacy {
  OPEN
  INVITE_ONLY
  CLOSED
}

enum ClubMemberRole {
  OWNER
  ADMIN
  MEMBER
}

enum ClubInviteDirection {
  INVITED    // owner/admin → player
  REQUESTED  // player → club (open clubs only)
}

enum ClubInviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum ChatRoomType {
  GLOBAL
  CLUB
  DIRECT
}

enum ChatSenderPermission {
  FULL     // can read and post
  READONLY // can read only (Turf Manager in GLOBAL room)
}

// ── Core identity ───────────────────────────────────────────────────────

model User {
  id                String        @id @default(uuid())
  email             String        @unique
  passwordHash      String
  fullName          String
  role              UserRole
  accountStatus     AccountStatus @default(ACTIVE)
  emailVerified     Boolean       @default(false)
  phoneOptional     String?
  avatarUrl         String?
  gateways          String[]      @default([]) // preferred payment method tags: bKash, Nagad, Upay, Others
  customGatewayText String?
  isDeleted         Boolean       @default(false)
  deletedAt         DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  playerProfile        PlayerProfile?
  managedVenues         FieldVenue[]            @relation("VenueManager")
  hostedTeams            Team[]                  @relation("TeamCaptain")
  teamMemberships        TeamMembership[]
  teamJoinRequests        TeamJoinRequest[]
  scoutedContracts        BookingContract[]       @relation("ContractScouter")
  playedContracts         BookingContract[]       @relation("ContractPlayer")
  attributeEndorsements   AttributeEndorsement[]
  authoredReviews          Review[]                @relation("ReviewAuthor")
  targetedReviews         Review[]                @relation("ReviewTargetPlayer")
  notifications            Notification[]
  adminAlertsRaised       AdminAlert[]            @relation("AlertSubject")
  adminAlertsResolved     AdminAlert[]            @relation("AlertResolver")
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens      PasswordResetToken[]
  refreshTokens            RefreshToken[]
  oauthAccounts            OAuthAccount[]
  webhookSubscriptions     WebhookSubscription[]
  ownedClubs               Club[]                  @relation("ClubOwner")
  clubMembership           ClubMembership?         // null if not in any club
  sentClubInvites          ClubInvite[]            @relation("ClubInviteSender")
  receivedClubInvites      ClubInvite[]            @relation("ClubInviteRecipient")
  chatRoomMemberships      ChatRoomMember[]
  sentChatMessages         ChatMessage[]           @relation("ChatMessageSender")

  @@index([role])
  @@map("users")
}

model PlayerProfile {
  id                     String            @id @default(uuid())
  userId                 String            @unique
  user                   User              @relation(fields: [userId], references: [id])
  positions              String[]          // 1–3 values, e.g. ["ST", "CAM"]
  currentStatus          MatchStatusState  @default(IDLE)
  cooldownExpiryTimestamp DateTime?
  accumulatedStars        Int               @default(0)
  overallRating           Int               @default(0) // derived, recalculated on attribute change
  isDeleted               Boolean           @default(false)
  deletedAt                DateTime?
  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt

  attributes PlayerAttribute[]

  @@map("player_profiles")
}

model PlayerAttribute {
  id              String        @id @default(uuid())
  playerProfileId String
  playerProfile   PlayerProfile @relation(fields: [playerProfileId], references: [id])
  code            AttributeCode
  value           Int           // 40–95 baseline; scales to 100 once endorsement count >= 10
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  endorsements AttributeEndorsement[]

  @@unique([playerProfileId, code])
  @@map("player_attributes")
}

model AttributeEndorsement {
  id                String          @id @default(uuid())
  playerAttributeId String
  playerAttribute   PlayerAttribute @relation(fields: [playerAttributeId], references: [id])
  endorserId        String
  endorser          User            @relation(fields: [endorserId], references: [id])
  createdAt         DateTime        @default(now())

  @@unique([playerAttributeId, endorserId]) // one endorsement per verifier per attribute
  @@map("attribute_endorsements")
}

// ── Venues & slots ──────────────────────────────────────────────────────

model FieldVenue {
  id                  String        @id @default(uuid())
  managerId           String
  manager             User          @relation("VenueManager", fields: [managerId], references: [id])
  title               String
  shortDescription    String
  fullDescription     String
  location            String
  surfaceType         SurfaceType
  supportedFormats    PlayerFormat[]
  amenities           String[]      @default([])
  imageUrls           String[]      @default([])
  rating               Float         @default(0)
  openingTime          String        // "HH:MM"
  closingTime          String        // "HH:MM"
  slotDurationMinutes Int
  isDeleted            Boolean       @default(false)
  deletedAt             DateTime?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  slots SlotConfiguration[]
  teams Team[]
  reviews Review[] @relation("ReviewTargetVenue")

  @@index([managerId])
  @@index([surfaceType, rating])   // /explore filter + sort path
  @@map("field_venues")
}

model SlotConfiguration {
  id                     String         @id @default(uuid())
  fieldId                String
  field                  FieldVenue     @relation(fields: [fieldId], references: [id])
  startTimeWindow        String         // "HH:MM"
  endTimeWindow          String         // "HH:MM"
  timeType               SlotTimeType
  baseStandardPrice      Int            // integer BDT
  promotionalOfferPrice  Int?
  lifecycle              SlotLifecycle  @default(AVAILABLE)
  holdExpiresAt          DateTime?
  isDeleted              Boolean        @default(false)
  deletedAt              DateTime?
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt

  bookingContracts BookingContract[]
  teams            Team[]

  @@index([fieldId])
  @@index([fieldId, startTimeWindow])  // availability grid ordering
  @@index([lifecycle])                 // hold-expiry sweep
  @@map("slot_configurations")
}

// ── Booking & payments ──────────────────────────────────────────────────

model BookingContract {
  id                String        @id @default(uuid())
  slotId            String
  slot              SlotConfiguration @relation(fields: [slotId], references: [id])
  scouterId         String
  scouter           User          @relation("ContractScouter", fields: [scouterId], references: [id])
  playerId          String
  player            User          @relation("ContractPlayer", fields: [playerId], references: [id])
  status            BookingStatus @default(HELD)
  agreedAt          DateTime      @default(now())
  kickoffTimestamp  DateTime
  cancelledById     String?
  flaggedToAdmin    Boolean       @default(false)

  amount                Int             // integer BDT
  currency              String          @default("BDT")
  paymentGateway        PaymentGateway? // set on checkout initiation; null until checkout starts
  paymentStatus         PaymentStatus   @default(UNPAID)
  sslTranId             String?
  sslBankTranId         String?
  stripePaymentIntentId String?         // set for STRIPE gateway; used for refunds
  refundStatus          RefundStatus    @default(NONE)
  refundedAt            DateTime?

  isDeleted         Boolean       @default(false)
  deletedAt         DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  reviews  Review[]
  alerts   AdminAlert[]
  notifications Notification[]

  @@index([slotId])
  @@index([status])
  // Partial unique index over (slotId) WHERE status IN ('HELD','CONFIRMED')
  // added via a follow-up raw SQL migration — see §6, Anti-Double-Sell.
  @@map("booking_contracts")
}

// ── Reviews ─────────────────────────────────────────────────────────────

model Review {
  id                String           @id @default(uuid())
  authorId          String
  author            User             @relation("ReviewAuthor", fields: [authorId], references: [id])
  targetType        ReviewTargetType
  targetVenueId     String?
  targetVenue       FieldVenue?      @relation("ReviewTargetVenue", fields: [targetVenueId], references: [id])
  targetPlayerId    String?
  targetPlayer      User?            @relation("ReviewTargetPlayer", fields: [targetPlayerId], references: [id])
  bookingContractId String?
  bookingContract   BookingContract? @relation(fields: [bookingContractId], references: [id])
  rating            Int              // 1–5, validated at the service layer
  comment           String
  isDeleted         Boolean          @default(false)
  deletedAt         DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  // Exactly one of targetVenueId / targetPlayerId is set, matching targetType.
  // Enforced in the service layer (Postgres CHECK constraints aren't expressed
  // in the Prisma DSL, so this is validated in services/review/ before insert).

  @@map("reviews")
}

// ── Teams & matchmaking ─────────────────────────────────────────────────

model Team {
  id          String       @id @default(uuid())
  captainId   String
  captain     User         @relation("TeamCaptain", fields: [captainId], references: [id])
  fieldId     String
  field       FieldVenue   @relation(fields: [fieldId], references: [id])
  slotId      String
  slot        SlotConfiguration @relation(fields: [slotId], references: [id])
  format      PlayerFormat
  rosterLimit Int          // derived from format, e.g. FORMAT_6V6 -> 12
  isDeleted   Boolean      @default(false)
  deletedAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  memberships    TeamMembership[]
  joinRequests   TeamJoinRequest[]

  @@index([captainId])
  @@map("teams")
}

model TeamMembership {
  id       String          @id @default(uuid())
  teamId   String
  team     Team            @relation(fields: [teamId], references: [id])
  playerId String
  player   User            @relation(fields: [playerId], references: [id])
  role     TeamMemberRole  @default(MEMBER)
  joinedAt DateTime        @default(now())

  @@unique([teamId, playerId])
  @@map("team_memberships")
}

model TeamJoinRequest {
  id        String            @id @default(uuid())
  teamId    String
  team      Team              @relation(fields: [teamId], references: [id])
  playerId  String
  player    User              @relation(fields: [playerId], references: [id])
  direction RequestDirection  // 'requested' = player -> team, 'offered' = captain -> player
  status    RequestStatus     @default(PENDING)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@map("team_join_requests")
}

// ── Clubs (Epic 7) ─────────────────────────────────────────────────────

model Club {
  id          String       @id @default(uuid())
  name        String       @unique           // 3–30 chars, platform-wide unique
  tag         String       @unique           // 3–5 uppercase letters, editable once
  description String?      @db.VarChar(200)
  ownerId     String
  owner       User         @relation("ClubOwner", fields: [ownerId], references: [id])
  privacy     ClubPrivacy  @default(INVITE_ONLY)
  isDeleted   Boolean      @default(false)
  deletedAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  memberships ClubMembership[]
  invites     ClubInvite[]
  chatRoom    ChatRoom?        @relation("ClubChatRoom")

  @@index([privacy])
  @@map("clubs")
}

model ClubMembership {
  id       String         @id @default(uuid())
  clubId   String
  club     Club           @relation(fields: [clubId], references: [id])
  userId   String
  user     User           @relation(fields: [userId], references: [id])
  role     ClubMemberRole @default(MEMBER)
  joinedAt DateTime       @default(now())

  @@unique([clubId, userId])
  @@unique([userId])                       // one club per player at a time
  @@map("club_memberships")
}

model ClubInvite {
  id        String              @id @default(uuid())
  clubId    String
  club      Club                @relation(fields: [clubId], references: [id])
  inviterId String
  inviter   User                @relation("ClubInviteSender", fields: [inviterId], references: [id])
  inviteeId String
  invitee   User                @relation("ClubInviteRecipient", fields: [inviteeId], references: [id])
  direction ClubInviteDirection
  status    ClubInviteStatus    @default(PENDING)
  expiresAt DateTime            // 48h from createdAt; a sweep job marks EXPIRED
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  @@unique([clubId, inviteeId, direction]) // one pending invite per direction per target
  @@index([status, expiresAt])             // expiry sweep query
  @@map("club_invites")
}

// ── Messaging & Chat (Epic 8) ───────────────────────────────────────────

model ChatRoom {
  id        String       @id @default(uuid())
  type      ChatRoomType
  clubId    String?      @unique               // set when type = CLUB; ties 1:1 to Club
  club      Club?        @relation("ClubChatRoom", fields: [clubId], references: [id])
  name      String?                            // display name, used for CLUB rooms
  createdAt DateTime     @default(now())

  messages ChatMessage[]
  members  ChatRoomMember[]

  @@map("chat_rooms")
}

model ChatRoomMember {
  id          String               @id @default(uuid())
  roomId      String
  room        ChatRoom             @relation(fields: [roomId], references: [id])
  userId      String
  user        User                 @relation(fields: [userId], references: [id])
  permission  ChatSenderPermission @default(FULL)
  joinedAt    DateTime             @default(now())
  lastReadAt  DateTime?

  @@unique([roomId, userId])
  @@map("chat_room_members")
}

model ChatMessage {
  id                String    @id @default(uuid())
  roomId            String
  room              ChatRoom  @relation(fields: [roomId], references: [id])
  senderId          String
  sender            User      @relation("ChatMessageSender", fields: [senderId], references: [id])
  onBehalfOfClubId  String?   // set when Club Admin sends DM "as club"; display-only
  content           String    @db.VarChar(500)
  isDeleted         Boolean   @default(false)
  deletedAt         DateTime?
  deletedById       String?   // admin or room owner who removed the message
  createdAt         DateTime  @default(now())

  @@index([roomId, createdAt])   // primary read path: latest N messages per room
  @@map("chat_messages")
}

// ── Admin & notifications ───────────────────────────────────────────────

model AdminAlert {
  id                String            @id @default(uuid())
  type              AdminAlertType
  status            AdminAlertStatus  @default(OPEN)
  subjectUserId     String
  subjectUser       User              @relation("AlertSubject", fields: [subjectUserId], references: [id])
  relatedContractId String?
  relatedContract   BookingContract?  @relation(fields: [relatedContractId], references: [id])
  details           String
  resolvedAt        DateTime?
  resolvedByAdminId String?
  resolvedByAdmin   User?             @relation("AlertResolver", fields: [resolvedByAdminId], references: [id])
  isDeleted         Boolean           @default(false)
  deletedAt         DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([status])
  @@map("admin_alerts")
}

model Notification {
  id                String            @id @default(uuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  type              NotificationType
  message           String
  relatedContractId String?
  relatedContract   BookingContract?  @relation(fields: [relatedContractId], references: [id])
  read              Boolean           @default(false)
  isDeleted         Boolean           @default(false)
  deletedAt         DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([userId, read])
  @@map("notifications")
}

// ── Auth support tables (custom JWT flow — no third-party auth library) ──

model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@map("password_reset_tokens")
}

// ═══════════════════════════════════════════════════════════════════════
//  EXTENSION MODELS  —  Phase 2 / 3
//  Everything above satisfies SCIC-13 in full. Everything below exists to
//  make the system operationally correct under retries, restarts, and
//  concurrent load. Prisma does not care about declaration order, so these
//  are grouped here rather than interleaved above.
// ═══════════════════════════════════════════════════════════════════════

enum OutboxStatus {
  PENDING
  PUBLISHED
  FAILED
}

enum WebhookEventType {
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  REFUND_COMPLETED
  SLOT_RELEASED
}

enum WebhookDeliveryStatus {
  PENDING
  DELIVERED
  FAILED
  EXHAUSTED
}

enum OAuthProvider {
  GOOGLE
}

// ── Refresh token rotation with reuse detection (§4 / SCIC-13 §4.1) ─────
//
// Refresh tokens are stored HASHED, never plaintext — a database leak must
// not hand over live sessions. `familyId` groups every token descended from
// one login: presenting an already-rotated token proves theft, so the whole
// family is revoked at once rather than just the replayed token.

model RefreshToken {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String    @unique          // SHA-256 of the token
  familyId   String                     // rotation lineage from one login
  expiresAt  DateTime
  rotatedAt  DateTime?                  // non-null once used; replay => theft
  revokedAt  DateTime?
  userAgent  String?
  ipAddress  String?
  createdAt  DateTime  @default(now())

  @@index([userId])
  @@index([familyId])
  @@index([expiresAt])                  // supports the cleanup sweep
  @@map("refresh_tokens")
}

// ── OAuth identity linking (§4 Epic 1) ──────────────────────────────────
//
// A separate table rather than columns on User, because one account may
// eventually link several providers. The compound unique is what makes
// "sign in with Google using an email that already exists" LINK to the
// existing user instead of creating a duplicate.

model OAuthAccount {
  id                String        @id @default(uuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          OAuthProvider
  providerAccountId String
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("oauth_accounts")
}

// ── Transactional outbox (§6.3) ─────────────────────────────────────────
//
// Written in the SAME transaction as the state change it describes, so a
// crash can never leave "booking confirmed" true while its event was never
// published. A relay job polls PENDING rows and publishes to Redis Streams.
// Delivery is at-least-once; consumers are idempotent to compensate.

model OutboxEvent {
  id            String       @id @default(uuid())
  eventType     String                        // e.g. "booking.confirmed"
  aggregateType String                        // e.g. "BookingContract"
  aggregateId   String
  payload       Json
  status        OutboxStatus @default(PENDING)
  attempts      Int          @default(0)
  lastError     String?
  publishedAt   DateTime?
  createdAt     DateTime     @default(now())

  @@index([status, createdAt])                // the relay's polling query
  @@index([aggregateType, aggregateId])
  @@map("outbox_events")
}

// ── Inbound idempotency (§6.3) ──────────────────────────────────────────
//
// SSLCommerz delivers IPN at least once. The unique constraint on `key` is
// inserted INSIDE the state-change transaction, so a duplicate rolls the
// whole thing back rather than double-confirming a booking. The stored
// response is replayed so the retry still sees 200 and stops retrying.

model IdempotencyKey {
  id             String   @id @default(uuid())
  key            String   @unique          // e.g. "sslcz:{tran_id}:{status}"
  scope          String                    // "payment_ipn" | "refund" | ...
  responseStatus Int
  responseBody   Json
  createdAt      DateTime @default(now())
  expiresAt      DateTime                  // pruned by a scheduled job

  @@index([expiresAt])
  @@map("idempotency_keys")
}

// ── Outbound webhooks (§4 Epic 6) ───────────────────────────────────────

model WebhookSubscription {
  id             String             @id @default(uuid())
  ownerId        String
  owner          User               @relation(fields: [ownerId], references: [id])
  url            String
  secret         String                              // HMAC-SHA256 signing key
  events         WebhookEventType[]
  isActive       Boolean            @default(true)
  failureStreak  Int                @default(0)      // auto-disables at threshold
  lastSuccessAt  DateTime?
  isDeleted      Boolean            @default(false)
  deletedAt      DateTime?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  deliveries WebhookDelivery[]

  @@index([ownerId])
  @@map("webhook_subscriptions")
}

model WebhookDelivery {
  id             String                @id @default(uuid())
  subscriptionId String
  subscription   WebhookSubscription   @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  eventType      WebhookEventType
  payload        Json
  status         WebhookDeliveryStatus @default(PENDING)
  attempts       Int                   @default(0)
  responseStatus Int?
  responseBody   String?                                // truncated excerpt
  durationMs     Int?
  nextRetryAt    DateTime?
  deliveredAt    DateTime?
  createdAt      DateTime              @default(now())

  @@index([subscriptionId, createdAt])
  @@index([status, nextRetryAt])                        // retry scheduler query
  @@map("webhook_deliveries")
}
```

### 10.1 Schema Notes

- **One club per player** — enforced by `@@unique([userId])` on `ClubMembership`. Prisma's unique constraint fires before the application layer can create a second membership. Attempting to join a second club returns a `409`.
- **Chat room bootstrap** — when a Club is created, the service layer creates a `ChatRoom` row (type `CLUB`, `clubId` set) and a `ChatRoomMember` row for the owner in the same transaction. The global room is a single seeded row (type `GLOBAL`, `clubId` null), created once in the seed script, never re-created.
- **DM room identity** — a Direct Message room (type `DIRECT`) is created on the first message between two users. Before creation, the service checks for an existing `DIRECT` room where both user IDs appear in `ChatRoomMember`. If found, it reuses it; if not, it creates one with both members. This prevents duplicate DM threads.
- **Global room 200-message hard-delete** — enforced in `ChatService.postGlobal()`: after inserting the new message, a second statement `DELETE FROM chat_messages WHERE room_id = $globalRoomId AND id NOT IN (SELECT id FROM chat_messages WHERE room_id = $globalRoomId ORDER BY created_at DESC LIMIT 200)` runs in the same transaction. Prisma raw query used because the Prisma DSL cannot express this conditional delete in one round-trip. Same logic applies to club rooms (`ChatService.postClub()`).
- **Club invite uniqueness** — `@@unique([clubId, inviteeId, direction])` prevents a club from sending a second pending invite to the same player, or a player from submitting a second join request to the same club.
- **Stripe fields** — `stripePaymentIntentId` is `String?` and only populated for `paymentGateway = STRIPE`. SSLCommerz contracts leave it null. Both fields co-exist on `BookingContract` rather than using a polymorphic table, because the contract model is already the single source of truth for a booking's financial state and a join would add a round-trip on every read.
- **Currency** — all `amount` and price fields are integer BDT. No floats near money, and no minor unit, because SSLCommerz's local rails settle in whole Taka. `currency` is retained on `BookingContract` for forward-compatibility but is not user-selectable.
- **Timezone** — every timestamp is `timestamptz` stored in UTC. All `"HH:MM"` fields are interpreted in Asia/Dhaka (UTC+6) at render and cutoff-calculation time. The 2-hour late-pull-out and 10-minute hold-window checks compare against server UTC `now()` through that fixed offset, never client local time — a device with a wrong clock must not be able to dodge a cancellation penalty.
- **The partial unique index is not in this file.** `CREATE UNIQUE INDEX ... ON booking_contracts (slot_id) WHERE status IN ('HELD','CONFIRMED')` ships as a hand-written migration, because Prisma's DSL cannot express partial indexes. It is the single most important constraint in the database (§6.2).
- **Soft delete is enforced by a Prisma client extension**, not by remembering `where: { isDeleted: false }` at every call site. `PrismaService` installs a `$extends` query override that injects the filter on soft-deletable models and rewrites `delete` into `update`. Admin restore flows opt out explicitly, which makes every bypass greppable.
- **Review target validation** — exactly one of `targetVenueId` / `targetPlayerId` is set, matching `targetType`. Postgres `CHECK` constraints are not expressible in the Prisma DSL, so this is validated in `ReviewsService` before insert _and_ backed by a raw-SQL check constraint in migration, for the same defence-in-depth reason as the partial index.

### 10.2 Shared Contracts — `packages/contracts`

This package replaces the old hand-maintained `lib/api-types.ts`. That file had to be updated by hand every time the Prisma schema changed, which means it was one distracted afternoon away from lying.

**Zod schemas are now the single definition.** TypeScript types are inferred from them rather than declared alongside them, so the type and the validator cannot disagree:

```typescript
// packages/contracts/src/schemas/booking.ts
import { z } from "zod";

export const createBookingInput = z.object({
  slotId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

// The type is DERIVED. There is no second declaration to drift.
export type CreateBookingInput = z.infer<typeof createBookingInput>;

export const bookingStatus = z.enum([
  "HELD",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const bookingResponse = z.object({
  id: z.string().uuid(),
  slotId: z.string().uuid(),
  status: bookingStatus,
  amount: z.number().int(), // integer BDT — never a float
  currency: z.literal("BDT"),
  paymentStatus: z.enum([
    "UNPAID",
    "PENDING",
    "PAID",
    "REFUND_PENDING",
    "REFUNDED",
  ]),
  refundStatus: z.enum(["NONE", "REQUESTED", "SUCCEEDED", "FAILED"]),
  kickoffTimestamp: z.string().datetime(), // ISO-8601 UTC
  createdAt: z.string().datetime(),
});

export type BookingResponse = z.infer<typeof bookingResponse>;
```

One schema object, three enforcement points:

| Consumer         | Usage                                                |
| ---------------- | ---------------------------------------------------- |
| `apps/api` REST  | `ZodValidationPipe` on the controller parameter      |
| `apps/api` tRPC  | `.input(createBookingInput)` on the procedure        |
| `apps/web` forms | `zodResolver(createBookingInput)` in React Hook Form |

The browser gets instant field-level validation and the server independently re-validates — client validation is UX, never a security boundary — but the _rules_ are written once.

**Domain event payloads** live in `packages/contracts/src/events/` and are the contract between NestJS and the Go realtime gateway. Go cannot import a Zod schema, so these are the one place where a second representation is unavoidable: the Zod schemas generate JSON Schema at build time, and Go structs are generated from that. The generation step runs in CI, so a payload change that is not mirrored fails the build rather than surfacing as a silently-dropped field at runtime.

---

## 11. API Reference

### 11.1 Two Surfaces, One Service Layer

| Surface                | Path      | Consumers                                                        |
| ---------------------- | --------- | ---------------------------------------------------------------- |
| **REST** `[REQUIRED]`  | `/api/*`  | Graders, Server Component reads, SSLCommerz IPN, future partners |
| **tRPC** `[EXTENSION]` | `/trpc/*` | The Next.js app's own authenticated screens                      |
| **gRPC** `[EXTENSION]` | internal  | `apps/realtime` → `apps/api`                                     |

All three are **transports**. Each parses input, calls a service method, and returns. Business logic exists exactly once, in `*.service.ts`. This is why there is no duplication to keep in sync — there is nowhere for logic to be duplicated _to_.

### 11.2 Response Envelope `[REQUIRED]`

```json
{ "success": true, "message": "Booking confirmed successfully", "data": {} }
```

Produced globally by `ResponseEnvelopeInterceptor` on success and `AllExceptionsFilter` on error. No controller ever constructs it by hand. Failures set `success: false`, `data: null`, and add an `errors` array for field-level validation detail.

Status codes: `400` validation · `401` unauthenticated · `403` forbidden / wrong role / frozen account · `404` not found · `409` conflict (slot taken, duplicate email) · `422` business-rule violation · `429` rate-limited · `500` unexpected.

### 11.3 Guard Conventions

- **`JwtAuthGuard`** — verifies signature and expiry, then loads current `accountStatus` from Postgres. `401` invalid/expired, `403` frozen/banned.
- **`RolesGuard`** — reads `@Roles(...)` on the handler, `403` on mismatch.
- **`EmailVerifiedGuard`** — booking, hosting, and application endpoints only.
- **Ownership** is checked in the service, not a guard, because the entity is already loaded there and a guard would have to fetch it twice.
- Public routes are marked `@Public()`.

### 11.4 Auth — `/api/auth`

| Method | Path                           | Auth           | Description                                           |
| ------ | ------------------------------ | -------------- | ----------------------------------------------------- |
| POST   | `/register`                    | Public         | Create user (bcrypt cost 12), send verification email |
| POST   | `/login`                       | Public         | Verify credentials, issue token pair                  |
| POST   | `/refresh`                     | Refresh cookie | Rotate; reuse detection revokes the family            |
| POST   | `/logout`                      | requireAuth    | Revoke refresh token, clear cookie                    |
| POST   | `/verify-email`                | Public         | Consume verification token                            |
| POST   | `/forgot-password`             | Public         | Issue reset token (rate-limited 5/15min)              |
| POST   | `/reset-password`              | Public         | Consume token, re-hash, revoke all refresh tokens     |
| GET    | `/google` · `/google/callback` | Public         | OAuth with account linking `[EXTENSION]`              |

### 11.5 Players — `/api/players`

| Method | Path                          | Auth                     | Description                                                   |
| ------ | ----------------------------- | ------------------------ | ------------------------------------------------------------- |
| GET    | `/`                           | Public                   | List / search — status, position, difficulty tier, paginated  |
| GET    | `/:id`                        | Public                   | Profile with attributes and endorsement counts                |
| POST   | `/`                           | requireAuth (self, once) | Create `PlayerProfile` + 6 `PlayerAttribute` rows             |
| PATCH  | `/:id`                        | requireAuth (self)       | Mutable fields only; frozen attribute values rejected         |
| POST   | `/:id/endorse/:attributeCode` | requireAuth              | Create endorsement; recalculates value at 10 unique endorsers |
| GET    | `/:id/analytics`              | Public                   | Radar + match history aggregates                              |
| DELETE | `/:id`                        | self or admin            | Soft delete                                                   |

### 11.6 Venues — `/api/venues`

| Method | Path             | Auth              | Description                                        |
| ------ | ---------------- | ----------------- | -------------------------------------------------- |
| GET    | `/`              | Public            | `/explore` — search, filter, sort, cursor-paginate |
| GET    | `/:id`           | Public            | Details                                            |
| GET    | `/:id/analytics` | Public            | Peak-hours bar + rating distribution               |
| POST   | `/`              | role TURF_MANAGER | Create venue                                       |
| PATCH  | `/:id`           | owner or admin    | Update                                             |
| DELETE | `/:id`           | owner or admin    | Soft delete                                        |

### 11.7 Slots — `/api/venues/:venueId/slots`

| Method | Path             | Auth           | Description                                       |
| ------ | ---------------- | -------------- | ------------------------------------------------- |
| GET    | `/`              | Public         | Availability grid — filter by date and `timeType` |
| GET    | `/api/slots/:id` | Public         | Single slot                                       |
| POST   | `/generate`      | owner          | **Automated Serial Grid Drop** — bulk create      |
| PATCH  | `/api/slots/:id` | owner or admin | Inline edit price / promo / block                 |
| DELETE | `/api/slots/:id` | owner or admin | Soft delete                                       |

### 11.8 Bookings — `/api/bookings`

| Method | Path            | Auth                      | Description                                        |
| ------ | --------------- | ------------------------- | -------------------------------------------------- |
| GET    | `/`             | requireAuth               | Caller's bookings, scoped by role                  |
| GET    | `/:id`          | party or admin            | Single contract                                    |
| POST   | `/`             | player + verified         | **Atomic slot claim** → `HELD` contract (§6.2)     |
| POST   | `/:id/checkout` | player                    | Initiate SSLCommerz, return `GatewayPageURL`       |
| POST   | `/ipn`          | Public (server-to-server) | **Idempotent** — validate `val_id`, confirm (§6.3) |
| PATCH  | `/:id/cancel`   | party or manager          | Refund-gated state machine (§6.4)                  |
| DELETE | `/:id`          | admin                     | Soft delete — record cleanup only                  |

`POST /api/bookings/ipn` is the highest-risk endpoint in the system: unauthenticated by necessity, mutates payment state, and is delivered at least once. It validates independently against SSLCommerz rather than trusting the payload, is keyed for idempotency, and always returns `200` on a duplicate so the gateway stops retrying.

### 11.9 Teams, Reviews, Notifications, Admin

**`/api/teams`** — full CRUD, plus `POST /:id/requests` (create join request or captain offer) and `PATCH /:id/requests/:requestId` (accept/decline → creates `TeamMembership` on accept). `GET /` powers the Difficulty Sorting Ladder.

**`/api/reviews`** — full CRUD. `GET /?targetVenueId=` or `?targetPlayerId=` feeds the rating aggregator. Service validates exactly one target is set.

**`/api/notifications`** — `GET /` (caller's feed), `PATCH /:id/read`, `PATCH /read-all`.

**`/api/admin`** — `GET/PATCH /alerts` (Dispute Center), `PATCH /users/:id/status` (freeze/limit/ban), `GET /metrics` (platform aggregates), `GET /queues` (Bull Board mount) `[EXTENSION]`.

**Public forms** — `POST /api/contact`, `POST /api/newsletter`. Called from Server Actions, IP-rate-limited at 5/hour.

**Uploads** — `POST /api/uploads/signature` returns a Cloudinary signed-upload payload. The browser uploads directly to Cloudinary; no binary passes through Node and the API secret never leaves the server.

**Webhooks** `[EXTENSION]` — `/api/webhooks/subscriptions` full CRUD, `POST /:id/test` fires a test delivery, `GET /:id/deliveries` returns the attempt log.

### 11.11 Clubs — `/api/clubs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Browse clubs — search by name/tag, filter by privacy (Open only for public), paginated |
| GET | `/:id` | Public | Club profile: name, tag, description, member roster, avg. rating |
| POST | `/` | Player | Create club — 409 if caller already has a `ClubMembership` |
| PATCH | `/:id` | Owner | Update name, tag (once), description, privacy |
| DELETE | `/:id` | Owner | Disband — soft-deletes `Club`, hard-deletes all `ClubMembership` and `ClubInvite` rows |
| GET | `/:id/members` | Member | Roster with roles and join dates |
| PATCH | `/:id/members/:userId/role` | Owner | Promote/demote between ADMIN and MEMBER; cannot demote self |
| DELETE | `/:id/members/:userId` | Owner or Admin (co-admin) | Kick member — hard-deletes `ClubMembership` and removes from club chat room |
| GET | `/:id/invites` | Owner or Club Admin | List pending outbound invites and inbound join requests |
| POST | `/:id/invites` | Owner or Club Admin | Send invite — body: `{ inviteeId }` — or create join request if caller is a non-member and club is Open |
| PATCH | `/:id/invites/:inviteId` | Invitee (for INVITED) or Owner/Admin (for REQUESTED) | Accept or decline |
| GET | `/search/players` | Owner or Club Admin | Search players by display name or exact ID for invite targeting — excludes existing members and players already in a club |

**Guard notes:**
- `POST /api/clubs` checks `ClubMembership` uniqueness before inserting; returns `409 You are already a member of a club` if the caller has a row.
- Invite send checks that the target player has no existing `ClubMembership` and no pending invite from this club in the same direction; returns `409` otherwise.

### 11.12 Stripe Webhooks — `/api/stripe/webhook`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/stripe/webhook` | Public (Stripe server→server) | Receives `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` — signature-verified, idempotent |

`POST /api/stripe/webhook` is structured identically to `POST /api/bookings/ipn`: public by necessity, mutates payment state, at-least-once delivery. It validates the Stripe-Signature header before reading the body, inserts into `idempotency_keys`, and always returns `200` on a duplicate.

### 11.13 Chat — `/api/chat`

**Global room:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/global` | requireAuth | Latest 200 messages, newest-last. No pagination (rolling buffer) |
| POST | `/global` | Player or Admin | Post message — 403 for Turf Manager |
| DELETE | `/global/:messageId` | Admin | Soft-delete: sets `isDeleted` true, clears `content`, stores tombstone |

**Club rooms:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/clubs/:clubId` | Club member | Latest 200 messages for this club room |
| POST | `/clubs/:clubId` | Club member | Post message — body: `{ content, onBehalfOfClubId? }` |
| DELETE | `/clubs/:clubId/:messageId` | Club Owner, Club Admin, or Global Admin | Soft-delete with tombstone |

**Direct messages:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dm` | requireAuth | List DM threads for caller — ordered by most recent message, includes unread count per thread |
| GET | `/dm/:userId` | requireAuth | Full message history with a specific user — paginated 20/load, cursor-based |
| POST | `/dm/:userId` | requireAuth (permission matrix §8.3) | Send DM — creates room on first message; 403 if permission matrix forbids this direction |
| PATCH | `/dm/:userId/read` | requireAuth | Mark all messages in this thread as read; clears the unread badge for this thread |

**Rate limiting:** global room posts at 1/2 s per user; DM sends at 10/min per sender — both Redis-keyed via `@nestjs/throttler`.

### 11.10 tRPC Router Shape `[EXTENSION]`

```typescript
// apps/api/src/trpc/app.router.ts
export const appRouter = router({
  auth: authRouter, // me, updateProfile
  players: playersRouter, // list, byId, update, endorse, analytics
  venues: venuesRouter, // list, byId, create, update, remove, analytics
  slots: slotsRouter, // listByVenue, generate, updateInline
  bookings: bookingsRouter, // list, byId, claim, checkout, cancel
  teams: teamsRouter, // list, byId, create, request, respond
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter; // ◄── the only thing apps/web imports
```

```typescript
// apps/web — fully typed, no codegen, no generated client to keep in sync
const { data, isLoading } = trpc.venues.byId.useQuery({ id });
const claim = trpc.bookings.claim.useMutation({
  onSuccess: () => utils.slots.listByVenue.invalidate({ venueId }),
});
```

Three tRPC procedure types mirror the guards: `publicProcedure`, `protectedProcedure` (auth + accountStatus check), and `roleProcedure(...)`.

---

## 12. Realtime Architecture `[EXTENSION]`

### 12.1 Event Flow

```text
 NestJS                                          Go / Fiber            Browser
   │                                                  │                   │
   ├─ tx { UPDATE booking; UPDATE slot;               │                   │
   │       INSERT outbox_events }                     │                   │
   │           │ commits atomically                   │                   │
   │           ▼                                      │                   │
   ├─ outbox-relay (BullMQ, ~1s)                      │                   │
   │           │                                      │                   │
   │           └─► XADD turfifa:events ──────────────►│  consumer group   │
   │                                                  │  (at-least-once,  │
   │                                                  │   replay on       │
   │                                                  │   restart)        │
   │                                                  ├─ route to room    │
   │                                                  │  venue:{id}       │
   │                                                  └──── WS push ─────►│
   │                                                                      │
   │◄──── gRPC: ResolveSocketPermissions ─────────────┤   (on connect)    │
   │◄──── gRPC: GetRosterSnapshot ────────────────────┤   (on room join)  │
```

### 12.2 Design Decisions

- **Rooms, not broadcast.** Clients subscribe to `venue:{id}`, `team:{id}`, or `user:{id}`. A slot changing at one venue must not wake every connected client.
- **Auth verified locally.** The gateway holds the JWT public key and verifies the access token itself on connect. No network hop per connection.
- **The gateway owns no state worth losing.** Restarting drops connections; clients reconnect with exponential backoff and refetch through React Query. Because the Redis Streams consumer group tracks its position, events published during a restart are replayed rather than lost.
- **Push carries the fact, not the data.** A message says "slot X changed"; the client invalidates the relevant React Query key and refetches. Pushing full entity payloads would create a second cache with a second update path — and the bugs that follow are exactly the kind that only appear in production.
- **Presence is ephemeral** — Redis sets with TTL, keyed by room. Losing it on restart is acceptable and it self-heals as clients heartbeat.

### 12.3 Why This Boundary

Go was chosen here rather than for an arbitrary CRUD module because the fit is specific: thousands of mostly-idle connections is a goroutine-per-connection problem, and the goroutine scheduler is what Go exists for. Just as importantly, the service **owns no business rules**, so it can be reasoned about, deployed, restarted, and scaled entirely independently of the control plane. The coupling is one-directional and asynchronous. There is no distributed transaction anywhere in this design, and that is deliberate — a two-service saga across a payment flow would be far more impressive to draw than to operate.

---

## 13. Observability & Testing `[EXTENSION]`

### 13.1 Tracing

OpenTelemetry auto-instrumentation in NestJS, the `otel` SDK in Go. Context propagates through HTTP headers, BullMQ job metadata, and Redis Stream message fields, so a single booking renders as one connected trace:

```text
POST /trpc/bookings.claim            ──────────────────────────  142ms
├─ JwtAuthGuard                       ──                            4ms
│  └─ prisma.user.findUnique          ─                             3ms
├─ BookingService.claimSlot           ────────────────────         96ms
│  ├─ prisma.$transaction             ───────────────────          91ms
│  │  ├─ slot.updateMany (claim)      ────────                     31ms
│  │  ├─ bookingContract.create       ──────                       28ms
│  │  └─ outboxEvent.create           ────                         19ms
├─ ResponseEnvelopeInterceptor        ─                             1ms
└─ [async] outbox-relay               ─────                       +840ms
   └─ redis.xadd                      ──                             6ms
      └─ [realtime-go] fanout         ────                          12ms
         └─ ws.push venue:a3f…        ─                              2ms
```

That trace crossing a language boundary is the artifact worth screenshotting.

### 13.2 Metrics & Logs

- **Prometheus** — RED metrics (rate, errors, duration) on the booking path; `slot_claim_conflicts_total` counts lost races, which is the direct measure of contention; queue depth and job failure rate per queue; WebSocket connection and room counts.
- **Pino** structured JSON logs with a correlation ID injected by middleware and propagated across services. Every log line for one user action is greppable by a single ID.
- **Grafana** dashboards for the booking funnel, queue health, and realtime connections; alerts on queue depth, refund failure rate, and outbox lag.

### 13.3 Testing Strategy

| Level           | Tool                  | Target                                                                                                 |
| --------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Unit**        | Jest                  | Booking state machine, refund gate, slot generation math, time-type classification, difficulty tiering |
| **Integration** | Jest + Testcontainers | Real Postgres + Redis. Auth flows, RBAC, soft delete, transactions                                     |
| **Concurrency** | Jest + Testcontainers | **50 parallel booking requests at one slot → assert exactly one succeeds and 49 receive 409**          |
| **Contract**    | Zod                   | Every fixture parsed by the shared schema, catching drift                                              |
| **E2E**         | Playwright            | Register → verify → explore → book → pay (sandbox) → cancel → refund                                   |

The concurrency test is the single most valuable test in the suite. It is the executable proof that §6.2 works, it fails loudly if someone "simplifies" the atomic claim into a read-then-write, and it is a genuinely interesting thing to be asked about.

---

## 14. Deployment & Submission

| Artifact         | Target                                           |
| ---------------- | ------------------------------------------------ |
| `apps/web`       | Vercel — deploys on merge to `main`              |
| `apps/api`       | Railway / Render                                 |
| `apps/worker`    | Railway / Render, separate process `[EXTENSION]` |
| `apps/realtime`  | Railway / Render, separate process `[EXTENSION]` |
| PostgreSQL       | Supabase                                         |
| Redis            | Upstash / Railway                                |
| Traces & metrics | Grafana Cloud                                    |

**Migrations use `prisma migrate deploy` in CI, never `migrate dev`.** `migrate dev` requires creating a shadow database, which hosted Supabase may not permit. Author migrations against local Postgres, commit them, let the deploy apply them.

_IPv6 caveat:_ Supabase direct connections are IPv6-only unless the IPv4 add-on is enabled. If the API host has IPv4-only egress, point `DIRECT_URL` at the session-mode pooler. Confirm exact connection strings from the Supabase dashboard rather than assembling them from memory — the formats have changed between releases.

**Submission checklist `[REQUIRED]`:**

- [ ] Live frontend URL
- [ ] Live backend API URL with `/healthz` returning 200
- [ ] Public Swagger UI at `/docs`
- [ ] GitHub monorepo link (frontend and backend both inside)
- [ ] Postman collection + environment, committed
- [ ] Demo credentials — player, manager, admin — verified against the deployed backend
- [ ] Seed data with zero placeholder content: real Dhaka addresses, realistic prices and descriptions
- [ ] README with setup, env template, and architecture diagram

---

## 15. Build Order

Full phase definitions and the skill-acquisition map are in **SCIC-13 §11**. Summary:

| Phase                 | Contents                                                                                                                                                                                                                                      | Status                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **0 — Foundation**    | Monorepo, `packages/db` + `packages/contracts`, NestJS bootstrap, envelope + filter + pipe, Postgres + Redis, seed                                                                                                                            | Prerequisite          |
| **1 — Core**          | 10 modules with CRUD + soft delete, JWT auth + guards, REST + tRPC, React Query wiring, SSLCommerz + Stripe dual-gateway, atomic claim + partial index, Clubs (social layer), Chat polling (Global + Club + DMs), Swagger + Postman, deployed | **◄ SUBMISSION LINE** |
| **2 — Skill payload** | Redis caching, BullMQ + Bull Board (incl. club invite expiry job), outbox + idempotency, outbound webhooks, Google OAuth, RTK tactical planner                                                                                                | Upside                |
| **3 — Senior signal** | Go realtime gateway, Redis Streams, gRPC, WebSocket chat (replaces polling), OpenTelemetry → Grafana, Testcontainers + concurrency test, Playwright                                                                                          | Upside                |

**The discipline: do not start Phase 2 until Phase 1 is deployed and submitted.** A finished Phase 1 with a working URL is worth more than a half-built Phase 3 in every conversation that matters — an interview, a grade, or a recruiter screen.

**Phase 1 discipline for the new features:**

- **Clubs** require no deferred infrastructure. Club creation, invite flow, and member management are plain Postgres + NestJS CRUD. Invite expiry in Phase 1 uses `@nestjs/schedule` `@Interval(3600000)` (hourly sweep) to mark `ClubInvite` rows `EXPIRED` where `status = PENDING AND expiresAt < NOW()`. No BullMQ needed until Phase 2.
- **Chat** in Phase 1 is polling-only. `refetchInterval: 5000` via React Query on the active tab. The 200-message rolling buffer, the DM room creation logic, and the permission matrix are all fully functional at launch — only the push delivery mechanism is deferred to Phase 3, where the existing `apps/realtime` Go gateway gains `room:global`, `room:club:{clubId}`, and `user:{id}` subscription topics.
- **Stripe** requires two environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and the MaxMind GeoLite2 `.mmdb` file (committed as a binary asset under `apps/api/assets/`; the free GeoLite2-Country edition is sufficient for BD vs. non-BD routing). No additional paid services beyond a free Stripe test account are needed to complete Phase 1.
