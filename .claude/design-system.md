# Design System — EnergyTracker

## Aesthetic direction
Modern Minimal — A clean, data-forward mobile-first PWA for personal energy cost tracking.
Neutral chrome lets the two semantic fuel colours (electricity = amber, gas = blue) carry
full meaning. The green brand provides an eco-conscious primary without enterprise heaviness.

## Full documentation
See `docs/design-system.md` for complete token reference, component conventions,
accessibility notes, and usage rationale.

## Colour tokens (summary)

| Token | Value | Usage |
|---|---|---|
| `--color-brand` | #16a34a | Primary buttons, nav active, focus rings |
| `--color-brand-hover` | #15803d | Hover / pressed state |
| `--color-elec` | #fbbf24 | Electricity chart bar fill (amber-400) |
| `--color-elec-dark` | #b45309 | Electricity text / badges (amber-700, 5.1:1 AA) |
| `--color-elec-surface` | #fffbeb | Electricity tile background (amber-50) |
| `--color-gas` | #60a5fa | Gas chart bar fill (blue-400) |
| `--color-gas-dark` | #1d4ed8 | Gas text / badges (blue-700, 5.7:1 AA) |
| `--color-gas-surface` | #eff6ff | Gas tile background (blue-50) |
| `--color-background` | #f9fafb | Page background (gray-50) |
| `--color-surface` | #ffffff | Card / panel background |
| `--color-border` | #e5e7eb | Standard borders (gray-200) |
| `--color-border-subtle` | #f3f4f6 | Subtle dividers (gray-100) |
| `--color-text-primary` | #111827 | Headings (gray-900, 15.3:1) |
| `--color-text-body` | #374151 | Body text (gray-700, 10.7:1) |
| `--color-text-secondary` | #6b7280 | Muted labels (gray-500, 4.6:1 AA) |
| `--color-text-disabled` | #9ca3af | Placeholders, empty states (gray-400) |
| `--color-error` | #dc2626 | Validation errors (red-600, 5.9:1 AA) |
| `--color-success` | #16a34a | Success messages (green-600) |

## Typography
Font: Geist Sans (`--font-geist`), loaded via next/font.
Scale: Tailwind default. Page `<h1>` = `text-2xl font-bold`, card headings = `text-base font-semibold`.

## Spacing
4px base unit. Key: `p-4` page padding, `space-y-6` section stacking, `pb-24` mobile nav clearance.

## Border radius
`rounded-lg` inputs, `rounded-xl` primary buttons, `rounded-2xl` cards/tiles/dialogs, `rounded-full` badges.

## Accessibility baseline
- All text tokens meet WCAG AA (4.5:1 minimum)
- Chart fills are decorative areas — text labels use darker `*-dark` variants
- Touch targets: `min-h-[44px]` on interactive elements
- Focus: `focus:ring-2 focus:ring-green-500` on all inputs and buttons
- `prefers-reduced-motion` respected globally in globals.css

## Chart colour constants
Import from `src/lib/chart-colors.ts`:
```ts
CHART_COLORS.electricity  // '#fbbf24' amber-400
CHART_COLORS.gas          // '#60a5fa' blue-400
```

## Loading states
- Reuse `src/components/ui/Skeleton.tsx` (`animate-pulse rounded-lg bg-gray-200`, aria-hidden) — never hand-roll pulse divs; size via `className`.
- Every data-fetching route has a `loading.tsx` mirroring its page's wrapper classes (no layout shift). See `src/app/*/loading.tsx`.
- Nav pending feedback: `useLinkStatus()` in `MobileNav.tsx` (`animate-pulse opacity-60` while navigating).
