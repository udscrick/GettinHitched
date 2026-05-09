# GettinHitched — Developer Context (CLAUDE.md)

> Read this file before touching any code. It is the single source of truth for what has been built, how it is structured, and what still needs doing.

---

## ⚠️ TOP PRIORITY: Mobile-Web Feature Parity

**Every feature built for the web app MUST have a corresponding implementation in the mobile app, and vice versa. This is the single highest priority rule in this codebase.**

- Any new page, action, or data model added to the web app must be mirrored in the mobile app at the same time.
- Any change to a server action, API route, or Prisma model must be reflected in both the web UI and mobile UI.
- Mobile screens consume the same Next.js API routes (`/api/*`) as the web app — never duplicate business logic.
- Do not consider any feature "done" until it works on both platforms.
- When in doubt about scope, ask: "Does this change need a mobile counterpart?" The answer is almost always yes.

---

## Project Overview

**GettinHitched** is a full-stack wedding planning platform with a Next.js web app and an Expo React Native mobile app, living in a pnpm monorepo managed by Turborepo.

- Couples create a "wedding" after sign-up (onboarding wizard).
- Every planning object (guests, budget, vendors, tasks, etc.) belongs to a `Wedding`.
- Multiple collaborators (partner, planner, family) can join via invite link with role-based access.
- A public-facing page (`/w/[slug]`) lets guests RSVP without an account.

**Active dev branch:** `claude/wedding-planning-app-yVFpR`
**GitHub repo:** `udscrick/GettinHitched`

---

## Monorepo Layout

```
GettinHitched/
├── apps/
│   ├── web/          ← Next.js 14 web app (primary product)
│   └── mobile/       ← Expo 51 / React Native mobile app (companion)
├── packages/
│   └── types/        ← Shared TypeScript types (workspace:*)
├── package.json      ← Root; scripts proxy to turbo
├── pnpm-workspace.yaml
└── turbo.json        ← Turborepo pipeline config
```

**Package manager:** pnpm 9 (use `pnpm` for all installs — not npm/yarn)
**Node requirement:** ≥ 18.0.0

---

## Tech Stack

### Web App (`apps/web`)

| Concern | Library / Version |
|---|---|
| Framework | Next.js 14.2.5 (App Router) |
| Auth | NextAuth v5 beta (`next-auth@^5.0.0-beta.20`) |
| Database ORM | Prisma 5.17 + SQLite (dev) |
| Styling | Tailwind CSS 3.4 + tailwind-animate |
| UI primitives | Radix UI (full suite) + custom shadcn-style components |
| Forms | react-hook-form + @hookform/resolvers + Zod |
| Charts | Recharts 2 |
| Drag & drop | @dnd-kit/core + sortable |
| Toasts | Sonner |
| Icons | lucide-react |
| Date util | date-fns 3 |
| CSV | papaparse |
| Unique IDs | nanoid |
| JWT util | jose |

### Mobile App (`apps/mobile`)

| Concern | Library / Version |
|---|---|
| Framework | Expo 51 + Expo Router 3.5 |
| React Native | 0.74.0 |
| Styling | NativeWind 4 (Tailwind for RN) |
| State/storage | @react-native-async-storage/async-storage |
| Secure storage | expo-secure-store |
| Notifications | expo-notifications |
| Image picker | expo-image-picker |

### Shared Package (`packages/types`)

Exports TypeScript union types and interfaces used by both web and mobile:
`MemberRole`, `RSVPStatus`, `GuestSide`, `VendorType`, `VendorStatus`, `PaymentStatus`, `TaskPriority`, `PartyRole`, `WeddingBasic`, `GuestBasic`.

---

## Environment Variables

File: `apps/web/.env` (see `apps/web/.env.example` for template)

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""          # optional — Google OAuth
AUTH_GOOGLE_SECRET=""      # optional — Google OAuth
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Google OAuth is optional; credentials (email + bcrypt) always work.

---

## Database

**Engine:** SQLite via Prisma (file: `apps/web/prisma/dev.db`)
**Schema:** `apps/web/prisma/schema.prisma`

### Models at a glance

```
Auth/User layer
  User · Account · Session · VerificationToken

Wedding core
  Wedding (root aggregate) · WeddingMember (join — roles: OWNER/ADMIN/EDITOR/VIEWER)

Guests
  Guest · GuestGroup · Table

Budget
  ExpenseCategory · Expense

Vendors & Venues
  Vendor · VendorCommunication · Venue

Planning
  Task · TaskAssignment

Photos
  Album · Photo

Invitations
  InvitationBatch · Invitation

Registry & Gifts
  RegistryItem · GiftReceived

Wedding Party
  WeddingPartyMember

Event details
  CeremonyDetail · ReceptionDetail

Celebrations
  HoneymoonPlan · HoneymoonDestination · PackingItem · EngagementDetail

Legal
  LegalChecklist

Communications
  Note · Announcement

Wedding Website
  WebsiteSection
```

**Important conventions:**
- Monetary amounts are stored as `String` (not `Float`) to avoid floating-point drift — always `parseFloat()` before math.
- JSON arrays (e.g. `readings`, `eventTimeline`, `nameChangeItems`) are serialised as `String` in SQLite. Parse/stringify in the action layer.
- All models cascade-delete from `Wedding` on delete.

---

## Development Commands

Run from the **repo root** using pnpm/turbo:

```bash
pnpm dev              # runs both web + mobile (turbo)
pnpm build            # production build (turbo)
pnpm type-check       # tsc --noEmit across all packages
pnpm lint             # eslint across all packages
pnpm db:push          # prisma db push (applies schema to SQLite)
pnpm db:generate      # prisma generate (regenerates client)
pnpm db:seed          # tsx prisma/seed.ts
pnpm db:studio        # Prisma Studio GUI on :5555
```

Run the web app alone:

```bash
cd apps/web
pnpm dev              # Next.js on :3000
pnpm type-check       # ts check only this app
```

Run the mobile app:

```bash
cd apps/mobile
pnpm start            # Expo dev server
pnpm android / pnpm ios
```

---

## Web App Architecture

### Route Groups

```
apps/web/src/app/
├── (auth)/                   ← unauthenticated pages (no sidebar)
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (dashboard)/              ← authenticated pages (shared layout + sidebar)
│   ├── layout.tsx            ← WeddingContext provider, Sidebar, Topbar
│   ├── dashboard/page.tsx
│   ├── budget/
│   ├── guests/
│   │   └── seating/
│   ├── vendors/
│   ├── venues/
│   ├── tasks/
│   ├── gallery/
│   ├── invitations/
│   ├── registry/
│   ├── wedding-party/
│   ├── ceremony/
│   ├── reception/
│   ├── honeymoon/
│   ├── engagement/
│   ├── notes/
│   ├── legal/
│   ├── website/
│   ├── reports/
│   └── settings/
├── api/                      ← REST API routes
│   ├── albums/route.ts
│   ├── ceremony/route.ts
│   ├── engagement/route.ts
│   ├── invitations/[batchId]/{route,guests,send}/route.ts
│   ├── invitations/route.ts
│   ├── legal/route.ts
│   ├── notes/route.ts
│   ├── notes/[id]/route.ts
│   ├── notes/[id]/pin/route.ts
│   ├── public/[slug]/rsvp/route.ts
│   ├── reception/route.ts
│   ├── register/route.ts
│   ├── settings/{route,invite,members/[id]}/route.ts
│   ├── upload/route.ts
│   ├── venues/route.ts
│   └── website/{route,sections/[id]}/route.ts
├── onboarding/page.tsx       ← 4-step wizard; creates Wedding + WeddingMember
├── w/[slug]/                 ← Public wedding site + RSVP (no auth required)
│   ├── page.tsx
│   └── PublicRSVPForm.tsx
└── layout.tsx                ← Root layout (fonts, Toaster, SessionProvider)
```

### Authentication Flow

1. User hits `/sign-up` → creates `User` + hashed password via `/api/register`.
2. Signs in via `/sign-in` (credentials or Google OAuth).
3. NextAuth v5 issues a JWT session; `session.user.id` is the `User.id`.
4. Middleware (`src/middleware.ts`) protects all non-public routes. Public routes: `/w/*` and `/api/public/*`.
5. First authenticated visit with no `WeddingMember` record → redirect to `/onboarding`.
6. Onboarding creates `Wedding` + `WeddingMember` (role: OWNER), then redirects to `/dashboard`.

### Server Actions vs. API Routes

- **Server Actions** (`src/actions/*.ts`): mutations triggered from client components (form submits, button clicks). Each action calls `auth()` and `db.weddingMember.findFirst()` to scope to the right wedding before any DB write.
- **API Routes** (`src/app/api/*/route.ts`): used for REST-style reads, file uploads, and the public RSVP endpoint. Some modules (notes, ceremony, reception, venues, invitations, website) have both.

### Dashboard Layout

`(dashboard)/layout.tsx` wraps every authenticated page with:
- `<WeddingContext>` — fetches the current user's `WeddingMember` + `Wedding` and provides it via context.
- `<Sidebar>` — desktop left nav (collapsible).
- `<MobileSidebar>` — sheet-based drawer for mobile.
- `<Topbar>` — breadcrumbs, user menu.

### Navigation Structure (`src/lib/constants/nav.ts`)

```
Overview    → Dashboard
Planning    → Timeline & Checklist | Budget & Expenses | Guests & RSVPs | Seating Chart
Vendors     → Vendors | Venues
The Wedding → Ceremony | Reception | Wedding Party
Celebrations→ Engagement | Honeymoon
Creative    → Gallery & Inspiration | Invitations | Gift Registry
Digital     → Wedding Website | Notes & Communications
Admin       → Legal & Documents | Reports | Settings
```

### UI Components (`src/components/`)

Custom components following shadcn/ui conventions (Radix primitive + CVA + cn):
`avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `separator`, `textarea`.

All use the `cn()` utility (`src/lib/utils.ts` — clsx + tailwind-merge).

### Tailwind Design Tokens

The brand palette is defined in `tailwind.config.ts`:
- `champagne` — light warm background
- `champagne-gold` — primary accent (`#C9A96E`)
- `ivory` — page background
- `blush` — soft pink
- `sage` — muted green
- `navy` — deep navy
- `warm-gray` — neutral text

Typography: serif headings (Georgia/Playfair-style via `font-serif`), sans-serif body.

---

## Module-by-Module Summary

### Dashboard (`/dashboard`)
Server component. Shows: countdown to wedding, key stats (guest count, budget %, tasks done, days left), quick-action cards. Reads directly from `db`.

### Budget & Expenses (`/budget`)
Client component (`BudgetClient.tsx`). CRUD for `ExpenseCategory` + `Expense`. Recharts pie chart for category breakdown. Progress bars for paid vs. total. Server actions in `src/actions/budget.ts`.

### Guests & RSVPs (`/guests`)
`GuestsClient.tsx` — searchable, filterable guest table. RSVP tracking (PENDING / CONFIRMED / DECLINED). Import via CSV (papaparse). Guest groups. Notes, dietary, address, meal choice.
Actions: `src/actions/guests.ts`.

### Seating Chart (`/guests/seating`)
`SeatingClient.tsx` — drag-and-drop table assignment (@dnd-kit). Create/rename/delete tables. Unassigned guests panel. Visual seat capacity tracking.

### Vendors (`/vendors`)
`VendorsClient.tsx` — vendor cards with status pipeline (RESEARCHING → BOOKED → CONTRACT_SIGNED). Contact details, contract URL, deposit tracking. Communications log per vendor.
Actions: `src/actions/vendors.ts`.

### Venues (`/venues`)
Server + API route (`/api/venues/route.ts`). Venue comparison cards with pros/cons, capacity, catering type, pricing range, visit scheduling, rating.

### Timeline & Tasks (`/tasks`)
`TasksClient.tsx` — Kanban-style task board grouped by status / priority. Due dates, assignees, categories. Overdue highlighting.
Actions: `src/actions/tasks.ts`.

### Gallery (`/gallery`)
`GalleryClient.tsx` — Album management. Photo upload via `/api/upload/route.ts` (saves to `public/uploads/`). Albums by category (engagement, inspiration, venue, etc.).

### Invitations (`/invitations`)
`InvitationsClient.tsx` — Invitation batches (Save the Date, Wedding Invite, etc.). Add guests to batch, mark sent, track open/RSVP status. Methods: EMAIL, PAPER, BOTH.
Actions: `src/actions/invitations.ts` + API routes.

### Gift Registry (`/registry`)
`RegistryClient.tsx` — Registry items with purchase tracking. External links, store names, priority. Gifts received log with thank-you tracking.
Actions: `registry/actions.ts` (local to route).

### Wedding Party (`/wedding-party`)
`WeddingPartyClient.tsx` — Roles (MOH, Best Man, bridesmaids, groomsmen, etc.). Outfit sizing (dress/suit/shoe), outfit status (ordered, picked up). Side (Partner 1 / Partner 2).
Actions: `wedding-party/actions.ts`.

### Ceremony (`/ceremony`)
Officiant info, start/end time, location, vows (per partner), processional/recessional order, readings, unity ceremony, music, program items.
Actions: `ceremony/actions.ts` + `/api/ceremony/route.ts`.

### Reception (`/reception`)
Timeline/run-of-show (JSON), menu, bar details, playlist, first dance song, parent dances, speeches, decor notes. Cocktail hour timing.
Actions: `reception/actions.ts` + `/api/reception/route.ts`.

### Honeymoon (`/honeymoon`)
`HoneymoonClient.tsx` — Multi-destination itinerary. Per-destination: accommodation, confirmation numbers, flight info, estimated cost, booking status. Packing list (by person: Partner 1 / Partner 2 / Both).
Actions: `src/actions/honeymoon.ts`.

### Engagement (`/engagement`)
Proposal story, ring description, who proposed. Engagement party planning (date, venue, notes). Announcement items.
Actions: `src/actions/engagement.ts` + `/api/engagement/route.ts`.

### Notes (`/notes`)
`src/app/(dashboard)/notes/page.tsx` — Pinnable notes, categories, per-vendor notes. CRUD via API (`/api/notes/`, `/api/notes/[id]/`, `/api/notes/[id]/pin/`).
Actions: `src/actions/notes.ts`.

### Legal & Documents (`/legal`)
Marriage license checklist (state, dates, waiting period, expiry), name change items (JSON list), prenup status, beneficiary updates.
Actions: `src/actions/legal.ts` + `/api/legal/route.ts`.

### Wedding Website (`/website`)
Enable/disable, theme selector (blush, sage, navy, ivory), custom title/message. `WebsiteSection` records for dynamic content blocks. Preview link to `/w/[slug]`.
Actions: `src/actions/website.ts` + `/api/website/` routes.

### Public Site (`/w/[slug]`)
No auth required. Renders wedding info + RSVP form (`PublicRSVPForm.tsx`). RSVP submitted via `/api/public/[slug]/rsvp/route.ts` — updates `Guest.rsvpStatus`.

### Reports (`/reports`)
Pure server component. Aggregates: guest RSVP breakdown (by status + side), budget by category (bar chart), budget summary (total / estimated / paid), task completion progress. No client JS.

### Settings (`/settings`)
Profile update, wedding date/names/location, invite collaborators (generates `inviteToken`), member management (change role, remove).
Actions: `src/actions/settings.ts` + `/api/settings/` routes.

---

## Mobile App (`apps/mobile`)

Expo Router tab navigation — 5 tabs:

| Tab | File | Description |
|---|---|---|
| Dashboard | `app/(tabs)/index.tsx` | Countdown + quick stats |
| Guests | `app/(tabs)/guests.tsx` | Guest list + RSVP status |
| Budget | `app/(tabs)/budget.tsx` | Budget overview |
| Tasks | `app/(tabs)/tasks.tsx` | Task checklist |
| More | `app/(tabs)/more.tsx` | Links to other modules |

Brand colors in tabs: active `#C9A96E` (champagne gold), inactive `#8B7355`, background `#FDF8F5`.

**Current state:** Scaffolded with placeholder UI. Not yet connected to the web API. The mobile app hits the same backend via REST calls (planned — not implemented yet).

---

## Shared Types (`packages/types`)

Import in either app with: `import type { VendorType } from "@gettinhitched/types"`

Key enums: `MemberRole` · `RSVPStatus` · `GuestSide` · `VendorType` · `VendorStatus` · `PaymentStatus` · `TaskPriority` · `PartyRole`

---

## Known Issues & Remaining Work

### Current TypeScript warnings
- `apps/web/src/app/(dashboard)/reports/page.tsx` — `Badge` component is used with `variant="warning"` which may not exist in the current badge definition. Needs a `warning` variant added to `src/components/ui/badge.tsx`, or replace with inline styling.
- `apps/web/src/app/(dashboard)/layout.tsx` — minor type issue; investigate after badge fix.

### Not yet implemented / planned work
- **Mobile ↔ Web API integration**: Mobile app currently has static placeholder data. Needs REST client (likely with `expo-secure-store` for JWT storage) wired to the Next.js API routes.
- **Email sending**: Invitation send flow (`/api/invitations/[batchId]/send/route.ts`) has the structure but no email provider integrated (Resend / Nodemailer recommended).
- **Real-time collaboration**: Multiple members editing simultaneously will overwrite each other. Consider optimistic locking or Pusher/Ably for live updates.
- **File storage**: Photos currently saved to `public/uploads/` on disk — not suitable for production. Should migrate to S3/R2/Cloudinary.
- **Google OAuth**: Wired in `auth.ts` but requires valid `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` env vars.
- **Push notifications**: `expo-notifications` installed in mobile but not configured.
- **Reporting charts**: Reports page uses only CSS progress bars; Recharts is installed but not yet used on reports (it is used in Budget).
- **Drag-and-drop seating visual canvas**: Current seating page assigns guests to tables but does not render a spatial floor-plan canvas. @dnd-kit is installed.
- **Dark mode**: `next-themes` is installed but no dark theme is wired up yet.
- **Tests**: No test suite exists. Vitest or Jest + React Testing Library recommended.
- **CI/CD**: No GitHub Actions workflows yet.
- **Production database**: SQLite is dev-only. Migration to PostgreSQL (Neon/Supabase) needed before any production deployment. Change `datasource.provider` in `schema.prisma` and re-run `prisma migrate`.

---

## Key File Reference

| Purpose | Path |
|---|---|
| Prisma schema | `apps/web/prisma/schema.prisma` |
| DB client singleton | `apps/web/src/lib/db.ts` |
| Auth config | `apps/web/src/lib/auth.ts` |
| Middleware (route guards) | `apps/web/src/middleware.ts` |
| Wedding context | `apps/web/src/contexts/WeddingContext.tsx` |
| Sidebar nav constants | `apps/web/src/lib/constants/nav.ts` |
| Tailwind config + tokens | `apps/web/tailwind.config.ts` |
| Shared types | `packages/types/src/index.ts` |
| Zod schemas | `apps/web/src/lib/validations/` |
| Server actions | `apps/web/src/actions/` |
| API routes | `apps/web/src/app/api/` |
| UI components | `apps/web/src/components/ui/` |
| Layout components | `apps/web/src/components/layout/` |

---

## Git Workflow

- Always develop on `claude/wedding-planning-app-yVFpR`.
- Push with: `git push -u origin claude/wedding-planning-app-yVFpR`
- Do not push directly to `main` without an explicit PR.
- Commits are linked to the Claude Code session in the commit body.
