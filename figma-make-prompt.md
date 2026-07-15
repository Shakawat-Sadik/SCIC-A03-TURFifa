# Figma Make Prompt — Turfifa

> Paste everything below the line into Figma Make as a single prompt. It is derived directly from `Turfifa-PRD.md` — if the PRD changes, regenerate this file rather than hand-editing it out of sync.

---

Design a complete, production-ready web application called **Turfifa** — a turf/futsal booking and tactical-analytics marketplace for amateur football, futsal, and 6v6 players in Bangladesh. Generate a full design file: page layouts, a component library, and states (default, hover, loading, empty, error) for every screen listed below. Desktop-first, fully responsive to tablet and mobile.

## 1. Brand & Visual System

- **Feel:** Modern sports-tech, energetic but clean — synthetic-turf green as the hero identity color, not a generic SaaS blue.
- **Color tokens (light mode):**
  - Background `oklch(1 0 0)` (white), Foreground `oklch(0.148 0.004 228.8)` (near-black slate)
  - Primary (turf green) `oklch(0.841 0.238 128.85)` — approx hex `#8FE64A`
  - Primary-foreground (dark green text on primary) `oklch(0.405 0.101 131.063)` — approx `#2F5A1D`
  - Secondary `oklch(0.967 0.001 286.375)` — approx `#F4F4F6` (light neutral)
  - Muted / muted-foreground: pale surface `#F5F6F6` with muted text `#7C8A94`
  - Destructive (errors, cancellations, bans) `oklch(0.577 0.245 27.325)` — approx `#E5484D`
  - Border/input `oklch(0.925 0.005 214.3)` — approx `#E7EAEC`
  - Chart ramp (5-step green gradient, light→dark): approx `#C8F27A, #9FE64F, #6FC72E, #4A9420, #326613`
- **Dark mode:** same hue family, inverted surfaces — background `oklch(0.148 0.004 228.8)` (near-black), card `oklch(0.218 0.008 223.9)`, primary brightens slightly to `oklch(0.768 0.233 130.85)` (approx `#7FDA3E`). Design every screen in both light and dark.
- **Max 3 primary colors + neutral**, enforced strictly: green (primary), a neutral slate/gray family, and red (destructive) only. No extra accent hues.
- **Corner radius:** small, consistent, ~0.45rem base across cards, buttons, inputs — never mix radius sizes within one component family.
- **Typography:** clean modern sans-serif (e.g., Inter or similar geometric grotesk). Strong, confident headline weight for hero sections; comfortable body size for dense dashboard tables.
- **Cards:** every card in the system (turf listing, review, dashboard stat, testimonial) shares identical corner radius, border, and shadow treatment — no one-off card styles.

## 2. Global Navigation

- **Navbar:** sticky/fixed, full-width. Logged-out: minimum 3 links (Home, Explore, About/Contact). Logged-in: minimum 5 links including role-specific dashboard entry and a `[Match 🔔]` badge that appears only when the user has an active confirmed contract — clicking it opens a live match hub (venue address, countdown clock to kickoff, confirmed teammate list with the current user highlighted in primary green).
- **Footer:** present on every page — site map links, contact block (email/phone/city), real-style social icons (Facebook/Instagram/X) opening in new tab, and Privacy/Terms links. No `#` placeholder links.

## 3. Pages to Design

### Public
1. **Home (`/`)** — Hero (60–70vh, headline + booking CTA + interactive 6v6 tactical mini-pitch preview), then 7 sections in order: Live Usage Metrics (counters: active bookings, registered teams, vetted venues), Featured Turfs grid/carousel, "How It Works" (Search → Select Formation → Reserve Slot), Tactical Module preview, Verified User Testimonials, Newsletter + FAQ accordion. Clear visual flow between sections (no abrupt cuts).
2. **Explore (`/explore`)** — search bar; filters for Surface Type, Price Range, Rating, and Time-of-Day (Morning/Afternoon/Evening/Night) — at least 2 usable simultaneously; sort by price/rating/latest; responsive grid: 4 cards/row desktop, 2 tablet, 1 mobile; skeleton-loader state matching the exact card grid dimensions; pagination controls.
3. **Turf Details (`/explore/:id`)** — image gallery/carousel, Overview section, Key Specifications box (dimensions, player count, lighting, pricing), a review-rating chart + individual reviews list, related/similar turfs row.
4. **About (`/about`)** — mission, how the marketplace works, team/story. Real copy, no lorem ipsum.
5. **Contact (`/contact`)** — contact form (name, email, message) plus static support email/phone/city and social links.
6. **Login / Register** — clean split-panel or centered card layout; role-aware registration (Player vs Turf Manager) with payment-gateway-preference checkboxes (bKash/Nagad/Upay/Others) and, for players, a position-picker (1–3 of ST/CAM/CB/GK/etc.); one-click Demo Player / Demo Manager / Demo Admin login buttons; inline validation states.
7. **404 Not Found** and **generic error state** — on-brand illustration, CTA back to Home/Explore.
8. **Privacy Policy / Terms** — lightweight static legal page template.

### Protected — Player
9. **Player Dashboard shell** with 3 sub-routes:
   - **My Bookings** — timeline/table of latest 20 confirmed reservations.
   - **Offers & Requests Matrix** — two-pane view: Join sub-filter (Requested vs Offer) and Scout sub-filter (Offered vs Interested).
   - **Gameweeks Ledger** — up to 10 muted/low-opacity historical match log rows; captain-only inline edit for scoreline, goals/assists, star player; endorsement action for squad members.
10. **Profile / Tactics (`/profile`)** — header layout: avatar + name + height/weight/stats on the left, a **radar chart** (6 attributes: ATT/PAS/STA/SPE/TEC/DEF) on the right, primary position banner + overall rating badge, secondary position tags in muted small text.

### Protected — Turf Manager
11. **Add a Turf (`/manager/turfs/add`)** — form: title, short description, full description, location, surface type, supported formats, amenities, image URL(s), opening/closing time + slot duration (feeds automatic slot generation preview).
12. **Manage Inventories (`/manager/turfs/manage`)** — grid/table of the manager's turfs with View/Delete actions; drill into a turf to see its auto-generated slot grid as **inline-editable cells** (price override, block toggle) with strikethrough promo-price styling when a discount is set.
13. **Manager Dashboard** — Business Analytics Grid with a 12-month high-low revenue line/area chart; Incoming Requests Queue (modal with player details, comments, payment status); Booking Confirmed Table with modify/cancel actions (cancel disabled/locked with an explanatory tooltip when refund is pending).

### Protected — Admin
14. **Admin Dashboard** — Global Auditing Feed (user/venue list with freeze/limit/remove actions and status badges), Dispute Center Desk (two queues: short-notice cancellation alerts, attribute-dispute requests), each alert row showing type, subject user, and a resolve action.

## 4. Components to Build as a Reusable Library

- Turf/listing card (image, title, short description, price/rating/location meta, "View Details" button) — one fixed size/radius/layout used everywhere.
- Stat tile / KPI counter (used in Live Usage Metrics and both dashboards).
- Radar chart component (player attributes) and bar/line/area chart components, all pulling from the 5-step green chart ramp.
- Price display with strikethrough original + highlighted promo price.
- Status badges: booking status (held/pending/confirmed/cancelled/completed), account status (active/limited/frozen/banned), match status dot (Idle ⚪ / Organizing 🔵 / Interested 🟢).
- Skeleton loader variants matching each list/grid layout.
- Empty-state pattern (icon + one line of real copy + CTA) — reused across every list surface that can be empty.
- Toast/notification component for in-app alerts (booking confirmed, cancelled, refund update, match invite, endorsement request).
- Difficulty-tier badge (Legend/Elite/Pro/Semi-Pro/Home Buddies/Playing for Fun) color-ramped by overall rating.

## 5. Content Rules

- No Lorem Ipsum anywhere. Use realistic Bangladeshi context: real-sounding venue names, Dhaka/Chattogram-style addresses, BDT pricing (e.g., ৳800/hr, ৳1,200/hr), realistic player names and stats.
- Currency is always BDT.
- Every list, table, and dashboard needs both a populated state and an empty state.

## 6. Deliverable

A Figma file with: a top-level color/typography/spacing style guide page, a components page (the library above with variants), and one frame per screen listed in Section 3 at desktop (1440px), tablet (768px), and mobile (375px) widths — light and dark variants for at least the Home, Explore, and one Dashboard screen.
