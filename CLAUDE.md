# EnergyTracker — CLAUDE.md

## Project Overview
A Progressive Web App (PWA) for tracking household electricity and gas costs. Users enter monthly meter readings and maintain a tariff history; the app calculates usage and cost over time. Each user sees only their own data. Hosted on Vercel, backed by Supabase.

## Stack
| Concern | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) with Row Level Security |
| Hosting | Vercel |
| Testing | Vitest + React Testing Library |
| PWA | Web App Manifest + next.config service worker |

## Environment Variables
Create `.env.local` (never commit this file):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Common Commands
```bash
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run test         # run Vitest in watch mode
npm run test:run     # run Vitest once (used by CI and hooks)
npm run lint         # ESLint
```

## Project Structure
```
src/
├── app/
│   ├── layout.tsx              # root layout: fonts, nav, PWA meta tags
│   ├── page.tsx                # root redirect → /dashboard or /login
│   ├── login/page.tsx          # Google sign-in button
│   ├── auth/callback/route.ts  # Supabase OAuth exchange handler
│   ├── dashboard/page.tsx      # dashboard: charts + monthly table
│   ├── tariffs/page.tsx        # tariff CRUD with history
│   └── readings/page.tsx       # meter reading log
├── components/
│   ├── ui/                     # shadcn primitives (Button, Card, Table, etc.)
│   ├── nav/MobileNav.tsx       # fixed bottom nav bar (Dashboard | Tariffs | Readings)
│   ├── dashboard/
│   │   ├── CostChart.tsx       # Recharts BarChart: last 12 months stacked cost (elec + gas)
│   │   ├── UsageChart.tsx      # Recharts BarChart: last 12 months kWh grouped (elec + gas)
│   │   └── MonthBreakdown.tsx  # table: Month | Elec kWh | Elec £ | Gas kWh | Gas £ | Total £
│   ├── tariffs/
│   │   ├── TariffForm.tsx      # add tariff form; auto-closes previous active tariff
│   │   └── TariffHistory.tsx   # table of tariffs; "Active" badge on current row
│   └── readings/
│       ├── ReadingForm.tsx     # add cumulative meter reading
│       └── ReadingsList.tsx    # readings list with delta kWh between entries
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # browser Supabase client (singleton)
│   │   └── server.ts           # server Supabase client (uses cookies)
│   └── calculations.ts         # buildMonthlyBreakdown() — core cost/usage engine
├── types/index.ts              # Tariff, MeterReading, MonthlyPeriod types
├── middleware.ts               # redirect unauthenticated users to /login
└── test/setup.ts               # Vitest + Testing Library setup
```

## Database Schema
```sql
CREATE TABLE tariffs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_type       text CHECK (fuel_type IN ('electricity', 'gas')) NOT NULL,
  supplier        text,
  unit_rate       numeric(10,4) NOT NULL,   -- pence per kWh
  standing_charge numeric(10,4) NOT NULL,   -- pence per day
  valid_from      date NOT NULL,
  valid_to        date,                     -- NULL = currently active
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE meter_readings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_type    text CHECK (fuel_type IN ('electricity', 'gas')) NOT NULL,
  reading_date date NOT NULL,
  reading_kwh  numeric(10,2) NOT NULL,      -- cumulative meter value
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, fuel_type, reading_date)
);

-- Row Level Security (users see only their own rows)
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_tariffs"   ON tariffs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_readings"  ON meter_readings  FOR ALL USING (auth.uid() = user_id);
```
Migration file: `supabase/migrations/001_initial.sql`

## Core Calculation Logic
`src/lib/calculations.ts` — `buildMonthlyBreakdown(readings, tariffs, fuelType)`

- Sort readings ascending by date
- For each consecutive pair: `usageKwh = endReading - startReading`
- Find which tariff was active across that period (matched by `valid_from` / `valid_to`)
- Cost in pence = `(usageKwh × unitRate) + (days × standingCharge)`
- Group results by calendar month
- Returns `MonthlyPeriod[]` — each with `month`, `kwh`, `costGbp`

**This module has no side-effects and must be unit-tested thoroughly** — it is the single source of truth for all cost figures.

## Authentication Flow
1. User visits `/login` → clicks "Sign in with Google"
2. Supabase `signInWithOAuth` redirects to Google
3. Google redirects to `/auth/callback`
4. `/auth/callback/route.ts` exchanges code for session via `supabase.auth.exchangeCodeForSession()`
5. Middleware in `src/middleware.ts` checks session on every request; unauthenticated → `/login`

## Tariff Rules
- Only one tariff per fuel type can be "active" (valid_to = NULL) at a time
- Adding a new tariff for a fuel type automatically sets `valid_to = newTariff.valid_from - 1 day` on the previous active tariff
- Historical tariffs are never deleted — they are needed to calculate past costs accurately

## Testing
```bash
npm run test:run    # single pass (also used by the PostToolUse hook)
npm run test        # watch mode for development
```

Tests live alongside source in `__tests__/` subdirectories or `.test.ts` files.

Priority for unit testing:
1. `src/lib/calculations.ts` — test with known input/output pairs
2. Tariff form validation (Zod schemas)
3. Delta kWh display logic in `ReadingsList`

## Subagents (Automated Hooks)

### PostToolUse — Auto Test Runner
Defined in `.claude/settings.json`. After every file Claude edits, runs:
```
npm run test:run 2>&1 | tail -30
```
Output appears in the Claude conversation. If tests fail, Claude will see the failure and fix before moving on.

### Stop — README Updater
After Claude finishes each turn, runs:
```
node .claude/scripts/update-readme.js
```
This script uses the Anthropic SDK to inspect recent git changes and update the relevant sections of `README.md` (features list, setup instructions, schema). See `.claude/scripts/update-readme.js` for implementation details.

To disable a hook temporarily, comment it out in `.claude/settings.json`.

## Supabase Setup (one-time)
1. Create a project at supabase.com
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Enable Google OAuth: Authentication → Providers → Google → enter Client ID + Secret
4. Add your Vercel URL + `http://localhost:3000` to the allowed redirect URLs

## Deployment (Vercel)
1. Push to GitHub, connect repo in Vercel
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. After first deploy, copy the Vercel URL into Supabase allowed redirect URLs and Google OAuth console
4. PWA: the web app manifest at `public/manifest.json` enables "Add to Home Screen" on mobile

## Build Stages
| Stage | What's Built | Done When |
|---|---|---|
| 1 | Scaffold + auth + CLAUDE.md | Sign in with Google works |
| 2 | Tariffs page | Add/view tariff history for both fuels |
| 3 | Readings page | Log readings, see kWh delta |
| 4 | Dashboard | Charts + table show correct figures |
| 5 | PWA + Vercel deploy | Installs on phone, live URL works |
