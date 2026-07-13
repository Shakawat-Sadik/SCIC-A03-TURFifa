# Product Requirement Document (PRD)

**Project Name:** Turfifa

**Author:** Shakawat Sadik (Full-Stack Developer)

**Status:** Approved / Production Specs

---

## 1. Technology Stack & Architecture Reference

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI.
* **Package Manager & Tooling:** pnpm; Shadcn/UI and the OKLCH token theme are scaffolded via a shared preset (setup command and full token contract in §7).
* **Data Visualization:** Recharts (radar, bar, line/area, and pie chart families), themed from the `--chart-*` tokens.
* **Backend Runtime:** Next.js Route Handlers (API Routes) in strict TypeScript mode. No separate Express service.
* **Database & Validation:** MongoDB with Mongoose / Typegoose for schema-level validation and native TypeScript document models end to end.
* **Media Storage:** Cloudinary for all venue images and avatar uploads (signed uploads; no binary blobs in Mongo).
* **Authentication & Session:** BetterAuth with server-side, database-backed sessions (not stateless JWT — see the Admin Operations Dashboard in §5 for the moderation rationale).
  * *Deviation note:* The course brief lists "MongoDB with JWT" as the reference backend/auth option. This project satisfies the same underlying requirement (MongoDB-backed authentication) via BetterAuth's database-backed sessions instead of hand-rolled JWTs — a stricter superset that adds instant session revocation on ban/freeze, which stateless JWT cannot provide without an extra revocation-list layer. Documented here so the choice reads as intentional, not a missed requirement.
* **Payments:** SSLCommerz as the payment aggregator (cards, bKash, Nagad, Rocket, Upay, internet banking), with server-validated IPN and refund API.
* **Access Control:** Role-Based Access Control (RBAC) across three classes — Player (Buyer), Turf Manager (Seller), and System Admin.
* **Hosting & Deployment:** Vercel for frontend and backend hosting, with MongoDB Atlas for database hosting.
* **Version Control & CI/CD:** GitHub for source control, with automated Vercel deployments on `main` branch merges.
* **Package & Dependency Management:** All dependencies are pinned to specific versions in `pnpm-lock.yaml` to ensure reproducible builds.

---

## 2. Project Overview & Objectives

The **Tactical Analytics & Turf Booking Platform (Turfifa)** is a production-ready, full-stack web application built with TypeScript, React/Next.js, and MongoDB. It serves amateur football, futsal, and 6v6 turf enthusiasts with a dual purpose: bridging the gap between local sports venues and players looking to book slots, while integrating robust RPG-style match analytics, contract-based matchmaking, and automated venue-management utilities.

### Primary Objectives

* **Role-Based Execution:** Implement strict Role-Based Access Control (RBAC) across three dedicated user classes: Players (Buyers), Turf Managers (Sellers), and System Administrators.
* **Streamline Discovery & Booking:** Enable users to search, filter, and book local turf fields by surface type, location, price, availability, and automated time-of-day classification.
* **Fair Matchmaking:** Safeguard player/scouter reliability with short-notice contract-drop penalties and direct Admin dispatch alerts.
* **Dynamic Inventory Yield:** Empower turf managers to mass-generate time slots automatically, edit rows live via inline editable inputs, classify sessions by time type, and apply promotional strikethrough pricing.
* **Data-Driven Dashboards:** Integrate interactive Recharts visualizations to monitor booking habits, seasonal spending, revenue curves, and match performance metrics.
* **Type Safety Throughout:** Maintain complete semantic type safety with TypeScript from frontend to backend database interaction.

---

## 3. Target Audience & Core Personas

* **The Buyer (Player / Scouter):** Looks for turf slots to book, sets their operational status, hosts games ("Scouters"), joins open teams, and rates other players based on concrete performance metrics.
* **The Seller (Turf Manager):** Manages field profiles, automates pricing schedules, and monitors business growth using multi-variable analytics graphs.
* **The System Admin:** Oversees platform metrics, resolves short-notice structural drop-outs, and handles structural profile flags or account blocks.

---

## 4. Epic & Feature Specifications

### Epic 1: Identity, Registration & Custom Onboarding

* **Role-Based Registration Form:** Built natively using `shadcn/ui` Form fields, custom Checkboxes, and Radio Groups backed by explicit type validation.
  * *Local Payment Gateway Vectors:* Grouped multi-select options for `bKash`, `Nagad`, `Upay`, and `Others`. Checking `Others` dynamically reveals a sleek textual string field input wrapper. Note: actual payment routing is handled inside SSLCommerz's hosted checkout, so this field is stored as a **preferred method** (used for display/UX hints), not as a payment router.
  * *Player Base-Position Array:* Select exactly 1 to 3 positions out of standard football tags (e.g., ST, CAM, CB, GK). The primary pick stands as the preferred position tag.

* **Demo Access Utility:** Single-click "Demo Player Login", "Demo Manager Login", and "Demo Admin Login" buttons that auto-fill verified credentials to allow rapid evaluation of every role class.

* **Auth State Context:** A unified React Context providing authentication and role state universally — used to toggle navbar links and protect operational API routes.

* **Locked Parameter Performance Rating System:**
  * Players define static baseline parameters upon registration across 6 essential attributes: Attack (ATT), Passing (PAS), Strength/Stamina (STA), Speed (SPE), Technical ability / Dribbling (TEC), and Defense (DEF).
  * *The Gatekeeper Range Rule:* Selectable bounds are strictly capped between **40 and 95**. Values can scale up to **100** only when an attribute accumulates **10** separate, unique user verification endorsements from matches.
  * *Modification Prevention:* Once committed, the fields freeze. Users attempting to submit a field late get an explicit warning prompt directing them to file an Admin adjustment dispute request form.

### Epic 2: Contractual Matchmaking & The Scouting Engine

* **Tri-State Status Lifecycle:** Players dynamically switch status profiles between Idle ⚪, Organizing 🔵, or Interested to Play 🟢. Status flips automatically to Idle when active windows expire.
* **The Difficulty Sorting Ladder:** Users can search for Organizing players (🔵) filtered cleanly against a calculated Overall Rating difficulty tier classification index:
  * *Legend:* 90 – 95
  * *Elite:* 85 – 89
  * *Pro:* 80 – 84
  * *Semi-Pro:* 75 – 79
  * *Home Buddies:* 70 – 74
  * *Playing for Fun:* below 70

* **Contract Cooldowns & Short-Notice Penalty Descents:**
  * Once a player and an organizing scouter agree to a slot, they enter a locked contract.
  * If a party cancels, a **6-hour global application cooldown lock** enforces onto the canceling user account instantly.
  * *Late Pull-Out Trigger:* If a drop occurs within **2 hours** of kickoff, an immediate automated ticket is dispatched to the `admin_alerts` stream database collection, flagging the user for fast administrative manual review.

### Epic 3: High-Yield Slot Engine & Booking Workflows

* **Venue Profile Creation:** Restricted form allowing an authenticated Turf Manager to append a field profile. Captures title, short and full descriptions, location, surface type, supported formats, amenities, and remote image asset references. This profile seeds the slot engine below. Strict rule: no `Lorem Ipsum` — all entries use realistic addresses, prices, and descriptions.

* **Automated Serial Grid Drop:** Turf managers configure field profiles by specifying opening time, closing time, and slot duration parameters. Clicking confirm automatically calculates chunks using a sequential timing algorithm:

$$\text{Total Slots} = \frac{\text{Closing Time} - \text{Opening Time}}{\text{Slot Duration}}$$

* **Automated Time-Type Classification:** As slots are serially sliced, the system automatically tags each slot with a `timeType` metadata attribute derived strictly from the slot's starting time:
  * *Morning:* Start time up until 11:59 AM.
  * *Afternoon:* 12:00 PM up until 4:59 PM.
  * *Evening:* 5:00 PM up until 7:59 PM.
  * *Night:* 8:00 PM onward.

* **Inline Editable Matrix Cells:** Generated slots map inside inline editable text input boxes accessible strictly to the respective Turf Manager and System Admins to easily overwrite individual pricing or block times.
* **Promotional Strikethrough Display Engine:** Supports markdown price manipulation. If a promo price field is populated, the default UI renders the base pricing wrapped in a muted strikethrough `<span className="line-through text-muted-foreground">` block alongside the active `text-primary` discount value (token-driven, so it holds in dark mode).
* **Booking Integrity:** A slot can be sold exactly once, and payment/refund rules gate every state change. The concurrency, hold-window, and payment mechanics are specified in §6 (Payments, Refunds & Booking Integrity).

---

## 5. Route-by-Route Blueprint & Dashboards

### Landing Page Router Paths

* **Public (Logged Out):** `/` (Home), `/explore` (Explore Turfs), `/about` (About Us), `/contact` (Contact & Support).
* **Private (Logged In Adds):** `/dashboard` (My Dashboard), `/dashboard/bookings` (Bookings Console), `/manager/turfs/add` (Add a Turf — managers), `/manager/turfs/manage` (Manage Inventories — managers), `/profile` (Profile / Tactics).

### Public Layer

* **`/` (Home Landing Page):** Hosts the 7 mandatory sections defined below.
* **`/about` (About Us):** Platform mission, how the marketplace works, and the team/story behind Turfifa. Zero placeholder copy.
* **`/contact` (Contact & Support):** Contact form (name, email, message) plus static contact details (support email, phone, city) and social links — mirrors and can share content with the footer's contact block. Satisfies the assignment's "at least 2 additional pages" requirement alongside `/about`.
* **`/explore` (Core Finder Engine):**
  * *Search Bar:* Reactive query tracking that scans turf titles, descriptions, and locations.
  * *Advanced Filtering (minimum two simultaneous fields):* Surface Type (Indoor, Artificial Turf, Natural Grass), Price Range (sliding scale or brackets), Rating/Availability, and the automated `timeType` slots (Morning, Afternoon, Evening, Night).
  * *Sorting & Pagination:* Sort by price (low → high), rating (high → low), or latest added, with clean cursor-based or offset pagination controls.
  * *Responsive Grid:* 4-wide column cards on desktop, 2 on tablet, 1 on mobile.
  * *Skeleton Loader:* A perfectly dimensioned grid of shimmer-cards mirroring the active listing layout to eliminate layout shift during data loading.
* **`/explore/:id` (Details Page):**
  * *Media Reel:* High-definition carousel/gallery showcasing pristine photos of the selected venue.
  * *Overview Segment:* Long-form description defining venue rules, amenities (showers, locker rooms, bibs provided), and physical location mapping.
  * *Key Specifications Box:* Structured grid declaring field dimensions, optimal player count (6v6, 5v5), lighting quality ratings, and exact pricing structures.
  * *Analytical Review Aggregator:* Recharts representation mapping rating counts alongside individual historical user reviews.

### 7 Mandatory Landing Page Sections

1. **Hero Display:** Compact, highly stylized grid (60–70vh maximum) showing a strong headline, booking CTA, and an interactive 6v6 tactical miniature layout preview / animation.
2. **Live Usage Metrics:** Real-time data counters reflecting active bookings, registered amateur teams, and vetted pitch venues.
3. **Featured Turfs Carousel/Grid:** Highlighting top-rated pitches with quick-view indicators.
4. **Operational Instructions ("How It Works"):** Step-by-step track outlining: Search → Select Formation → Reserve Slot.
5. **Tactical Module Preview:** Highlighting the built-in 6v6 pitch planner available to registered team captains.
6. **Verified User Testimonials:** Statements from local league captains emphasizing ease of scheduling.
7. **Newsletter Subscription & FAQ Block:** Clean input capture alongside a responsive Shadcn Accordion displaying typical platform rules.

### Global Footer

Present on every route (public and private). Must ship with fully working links — no `#` placeholders:

* **Site Map Links:** Home, Explore, About, Contact, plus role-relevant dashboard links when logged in.
* **Contact Block:** Support email, phone number, and city/address — same source of truth as `/contact`.
* **Social Links:** Real or realistic outbound links (e.g., Facebook, Instagram, X) opening in a new tab.
* **Legal:** Links to Privacy Policy / Terms (can be lightweight static content, but must not 404).

### Protected Player Dashboard Structure (3 Sub-Routes)

1. **My Bookings:** Historical timeline stack tracing the user's latest 20 confirmed reservations.
2. **Offers & Requests Matrix:**
   * *Join Sub-Filter:* Tracks user requests sent to Scouters (*Requested*) and incoming team invites received (*Offer*).
   * *Scout Sub-Filter:* Displays offers extended to target players (*Offered*) and queues of applicants seeking entry into their hosted matches (*Interested*).
3. **Gameweeks Ledger:** Preserves up to 10 historical match logs rendered using muted, low-opacity text styling wrappers. Organizing captains can edit results (scoreboards, list goals/assists, name star players) and allow selected squad members to endorse performance metrics.

### Protected Turf Manager Dashboard

* **Business Analytics Grid:** Houses a rolling **Yearly High-Low Line/Area Chart** plotting peak revenue potential paths alongside off-peak promotional price floors to analyze business growth curves over a 12-month calendar scale.
* **Incoming Requests Queue:** Interface sorting incoming user forms with dedicated modals summarizing player location details, comments, and payment status checks.
* **Booking Confirmed Table:** A live tracking operational map allowing direct modification or cancellation up until 1 hour before slot match kickoffs. **Cancellation is refund-gated:** a manager cannot cancel a *paid* booking until a successful SSLCommerz refund clears (see §6). Until then the slot stays locked and cannot be resold.

### Protected Admin Operations Dashboard

* **Global Auditing Feed:** Oversees global profiles with immediate commands to freeze, limit, or remove toxic users or fraudulent venues. Because sessions are server-side (BetterAuth), a freeze/ban **revokes the offender's active session on their very next request** — no waiting for a token to expire.
* **Dispute Center Desk:** Real-time monitoring panel housing short-notice cancellation alerts and base-parameter modification adjustment request streams.

---

## 6. Payments, Refunds & Booking Integrity

### Payment Flow (SSLCommerz)

1. **Initiate:** On booking checkout, the server creates a `pending` transaction and calls the SSLCommerz **initiate** endpoint, receiving a `GatewayPageURL`. The player is redirected to the SSLCommerz hosted page (cards, bKash, Nagad, Rocket, Upay, internet banking).
2. **Validate server-side:** The redirect success/fail/cancel URLs are **never trusted on their own.** Confirmation happens only when SSLCommerz's **IPN** hits the server and the transaction is re-validated via the validation API (`val_id`). Only a validated `VALID`/`VALIDATED` status flips the booking to `paid` and confirms the contract.
3. **Persist:** The gateway `tran_id` and `bank_tran_id` are stored on the `BookingContract` for later refund calls.

### Anti–Double-Sell (Slot Integrity)

A slot must never be sold twice. Three layers enforce this — a boolean flag alone is insufficient:

* **Atomic claim:** Booking creation is a single atomic `findOneAndUpdate({ slotId, bookingOccupied: false }, { $set: { bookingOccupied: true } })`. The loser of a race receives `null` and is rejected — there is no read-then-write gap.
* **Database guarantee:** A unique partial index on the contracts collection over `slotId` (where `status ∈ {held, confirmed}`) makes a second active booking on one slot impossible even under a logic bug.
* **Payment hold window:** On checkout, the slot moves to a temporary `held` state (default 10 min) tied to the pending transaction. If IPN validation doesn't arrive in the window, the hold auto-expires and the slot returns to available — preventing both double-sell and slots stranded by abandoned checkouts.

### Refund Policy (proposed defaults — tunable)

Mirrors the existing 2-hour late-pull-out threshold so cancellation rules stay consistent across the platform:

* **Player cancels ≥ 2h before kickoff:** Full refund, minus the non-refundable SSLCommerz processing fee.
* **Player cancels < 2h before kickoff (late pull-out):** No refund / forfeit, plus the existing 6-hour cooldown lock and an `admin_alerts` flag. This is what gives the penalty teeth.
* **Turf Manager cancels (any time):** Always a full refund to the player (manager is at fault), and the refund must clear before the cancellation completes.
* **Platform / venue fault (e.g., closure, maintenance):** Full refund including the processing fee, absorbed by the platform.

### Refund-Gated Cancellation (State Machine)

A manager cannot free or resell a paid slot until the player is made whole:

* Manager requests cancel on a `confirmed` + `paid` booking → booking enters `refund_pending`; the SSLCommerz refund API is called with the stored `bank_tran_id`.
* **Refund succeeds** → booking → `cancelled`, slot released (`bookingOccupied → false`), player notified.
* **Refund fails** → cancellation is **blocked**; booking stays `refund_pending`, slot stays locked, and the case is pushed to the Admin **Dispute Center Desk**.
* **Guard:** The cancel Route Handler rejects any manager cancel where `paymentStatus === 'paid' && refundStatus !== 'succeeded'`.

---

## 7. Visual Hierarchy & System Design Rules

### Project & Design-System Setup

* **Package Manager:** pnpm.
* **Shadcn/UI Initialization:** the project and theme are scaffolded via the shared preset:

```bash
pnpm dlx shadcn@latest init --preset b4ZBIWFrk0 --base radix --template next --pointer
pnpm dlx shadcn@latest add --all --overwrite
```

* This installs the Next.js template on the `radix-nova` style (`baseColor: mist`, built on the consolidated `radix-ui` + `@base-ui/react` packages rather than individual `@radix-ui/react-*` packages) and writes the token theme below into `app/globals.css` via a `@theme inline` block that imports `shadcn/tailwind.css`. **Tokens are the single source of truth** — components reference semantic tokens (`bg-primary`, `text-muted-foreground`, `border`, etc.), never hardcoded hex. *(Superseded an earlier draft preset ID, `b4FCPsuZYu` — the token values below are unchanged between the two, only the init command and generated UI primitive layer differ.)*

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

* `--primary` (turf green): CTAs, active/confirmed states, and the live discount price.
* `--background` / `--card` / `--border`: structural surfaces — replaces the retired slate-dark backgrounds.
* `--muted-foreground`: the struck-through *original* price — replaces the previously hardcoded `text-slate-400` so it holds up in dark mode.
* `--destructive`: cancellations, short-notice penalties, and block/freeze/ban actions.
* `--chart-1 … --chart-5` (green ramp): Recharts series palette (see §8).
* `--sidebar-*`: the dashboard shell for the player / manager / admin navigation.

### Layout Uniformity

* **Card Constraints:** Absolute size consistency across all explore cards; corner radius driven by the token `--radius` — set to `0.45rem` by the `radix-nova` preset actually installed (supersedes earlier drafts' `0.625rem`/8px notes). The preset also derives `--radius-sm` through `--radius-4xl` as multiples of `--radius` for consistent scaling across component sizes. Smooth hover transformations.
* **Grid Framework:** Standard 4-column layout on wide screens (`lg:grid-cols-4`), adapting to 2 columns on tablets and 1 column on mobile.
* **Zero Placeholders:** Strict rule prohibiting `Lorem Ipsum` filler text. All entities must use realistic addresses, prices, descriptions, and structural summaries.

---

## 8. Data Analytics & Recharts Mapping

All Recharts series draw their colors from the `--chart-1 … --chart-5` tokens defined in §7, so charts stay on-brand and theme-aware in both light and dark mode. Each Recharts family maps to a concrete surface:

* **Player Attribute Radar (Radar Chart):** Rendered in the profile header, tracking the 6 attributes (ATT, PAS, STA, SPE, TEC, DEF).
* **Venue Performance (Bar Chart):** Displays peak booking times across hourly bands throughout the day, helping players find quiet slots and operators optimize pricing.
* **Revenue / Financial Tracking (Area/Line Chart):** The manager's Yearly High-Low chart maps peak revenue potential against off-peak promotional floors over a rolling 12-month period; a player-side variant maps monthly team expenditure.
* **Review Rating Distribution (Bar / Aggregator):** On `/explore/:id`, maps rating counts alongside individual historical user reviews.
* **Tactical / Formation Distribution (Pie/Radar Chart):** Illustrates team tactical stats or formation types chosen during games organized via the platform.

---

## 9. Component-Driven User Interfaces

### Player Profile Architecture Header Layout

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

### Global Match Button Utility

When a contractual agreement updates successfully, a dynamic `[Match 🔔]` status badge renders directly inside the global navigation navbar interface. Clicking this route targets a dedicated real-time hub tracking matching venue addresses, accurate time slot indicators, confirmed teammate lists (highlighting the user's item name in active emerald colors), and an animated live countdown clock pointing directly to game kickoff.

---

## 10. Unified Database Schema Architecture

```typescript
// types/database.types.ts

export type UserRole = 'player' | 'turf_manager' | 'admin';
export type MatchStatusState = 'idle' | 'organizing' | 'interested';
export type SlotTimeType = 'morning' | 'afternoon' | 'evening' | 'night';
export type SurfaceType = 'Indoor' | 'Artificial Turf' | 'Natural Grass';
export type PlayerFormat = '5v5' | '6v6' | '7v7';
export type AccountStatus = 'active' | 'limited' | 'frozen' | 'banned';
export type SlotLifecycle = 'available' | 'held' | 'booked';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refund_pending' | 'refunded';
export type RefundStatus = 'none' | 'requested' | 'succeeded' | 'failed';

// NOTE: Auth is handled by BetterAuth with server-side, DB-backed sessions.
// Session + account records are managed by BetterAuth; `accountStatus` below is the
// moderation flag the Admin toggles — an admin block invalidates live sessions instantly.

export interface AttributeStats {
  value: number;                 // 40–95 baseline; scales up to 100 once endorsedByUsers >= 10
  endorsedByUsers: string[];     // unique verifier user IDs
}

export interface PlayerSchemaModel {
  id: string;
  fullName: string;
  phoneOptional?: string;
  gateways: string[];
  customGatewayText?: string;
  avatarUrl?: string;
  positions: string[];           // minimum 1, maximum 3 values allowed
  attributes: {
    ATT: AttributeStats;
    PAS: AttributeStats;
    STA: AttributeStats;
    SPE: AttributeStats;
    TEC: AttributeStats;
    DEF: AttributeStats;
  };
  overallRating: number;
  currentStatus: MatchStatusState;
  cooldownExpiryTimestamp: string | null;
  accumulatedStars: number;
  accountStatus: AccountStatus;  // Admin moderation flag; block/freeze revokes sessions instantly
}

export interface FieldVenueModel {
  id: string;
  managerId: string;             // FK -> user with role 'turf_manager'
  title: string;
  shortDescription: string;
  fullDescription: string;
  location: string;
  surfaceType: SurfaceType;
  supportedFormats: PlayerFormat[];
  amenities: string[];           // e.g. showers, locker rooms, bibs, floodlights
  imageUrls: string[];
  rating: number;
  openingTime: string;           // "HH:MM" (e.g., "06:00")
  closingTime: string;           // "HH:MM" (e.g., "23:00")
  slotDurationMinutes: number;   // feeds the Automated Serial Grid Drop
  createdAt: string;
}

export interface SlotConfiguration {
  slotId: string;
  fieldId: string;               // FK -> FieldVenueModel
  startTimeWindow: string;       // Format "HH:MM" (e.g., "20:00")
  endTimeWindow: string;         // Format "HH:MM" (e.g., "21:00")
  timeType: SlotTimeType;        // Automated breakdown selector
  baseStandardPrice: number;
  promotionalOfferPrice: number | null; // Trigger for line-through styling
  lifecycle: SlotLifecycle;             // 'available' | 'held' | 'booked' — replaces plain boolean
  holdExpiresAt: string | null;         // set while 'held'; auto-releases the slot on timeout
}

export interface BookingContract {
  contractId: string;
  slotId: string;                // FK -> SlotConfiguration (unique partial index while active)
  scouterId: string;             // organizing player
  playerId: string;              // agreeing player
  status: 'held' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  agreedAt: string;
  kickoffTimestamp: string;
  cancelledBy?: string;          // set when a party pulls out
  flaggedToAdmin: boolean;       // true when dropped within 2h of kickoff

  // Payments (SSLCommerz)
  amount: number;
  paymentStatus: PaymentStatus;
  sslTranId?: string;            // SSLCommerz transaction id
  sslBankTranId?: string;        // stored for refund calls
  refundStatus: RefundStatus;
  refundedAt?: string | null;
}

export interface BookingMetrics {
  month: string;
  totalBookings: number;
  totalSpent: number;
}
```
