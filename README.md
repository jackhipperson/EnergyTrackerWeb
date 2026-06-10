# EnergyTracker

A Progressive Web App for tracking household electricity and gas costs over time.

## Features
- Google sign-in — each user sees only their own data
- **Tariffs** — record electricity and gas tariffs (unit rate + standing charge); full history kept so past costs are always accurate
- **Meter readings** — log monthly cumulative readings; app calculates kWh used between entries
- **Dashboard** — monthly cost chart (stacked electricity + gas), kWh usage chart, and detailed month-by-month breakdown table
- Installable on mobile as a PWA (Add to Home Screen)

## Tech Stack
Next.js 16 · TypeScript · Tailwind CSS v4 · Recharts · Supabase (Postgres + Auth) · Vercel

## Design System
The UI follows a documented design system — see [`docs/design-system.md`](docs/design-system.md).
- Tailwind v4 theme tokens defined in `src/app/globals.css` (`@theme` block): colors, typography, spacing, radius, shadows
- Semantic fuel colors: electricity = amber, gas = blue — light `*-400` fills for charts, darker `*-700` for text (WCAG AA)
- Chart colors live in `src/lib/chart-colors.ts` (single source of truth, guarded by unit tests)

## Setup

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials (from Google Cloud Console)

### 2. Clone and install
```bash
git clone <repo-url>
cd EnergyTracker
npm install
```

### 3. Supabase
1. Create a new project at supabase.com
2. Open the SQL Editor and run `supabase/migrations/001_initial.sql`
3. Go to **Authentication → Providers → Google** and enter your Google Client ID and Secret
4. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs

### 4. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Testing
```bash
npm run test:run   # single pass
npm run test       # watch mode
```

## Deployment
1. Push to GitHub and connect to [Vercel](https://vercel.com)
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env settings
3. After first deploy, add your Vercel URL to Supabase allowed redirect URLs and Google OAuth console

## Database Schema
See `supabase/migrations/001_initial.sql` for the full schema.

| Table | Purpose |
|---|---|
| `tariffs` | Tariff history per user per fuel type (unit rate pence/kWh, standing charge pence/day) |
| `meter_readings` | Cumulative meter readings per user per fuel type |

Row Level Security ensures users can only read and write their own rows.
