# Design System — EnergyTracker

## Aesthetic direction

**Modern Minimal** — A clean, data-forward PWA for a personal finance/utility context.
Neutral chrome (white cards on gray-50 background) lets the two semantic fuel colours
carry full meaning. The green brand provides a trustworthy, eco-conscious signal without
the heaviness of a corporate/enterprise palette.

---

## Colour tokens

All tokens are defined in the `@theme inline` block in `src/app/globals.css` and are
available as CSS custom properties (`var(--color-*)`) and Tailwind utility classes
(`bg-[var(--color-brand)]`, or simply the Tailwind equivalents listed below).

### Brand / primary

| Token | Value | Tailwind equivalent | Usage |
|---|---|---|---|
| `--color-brand` | #16a34a | `green-600` | Nav active state, primary buttons, focus rings |
| `--color-brand-hover` | #15803d | `green-700` | Button hover / pressed |
| `--color-brand-light` | #f0fdf4 | `green-50` | Success message backgrounds |
| `--color-brand-muted` | #bbf7d0 | `green-200` | Active tariff row tint |

### Electricity (amber)

The chart bar fill (`amber-400 / #fbbf24`) is intentionally lighter than the text
equivalents. Bar fills are large decorative regions — WCAG contrast rules apply to
text, not fills. All electricity *text* uses `amber-700` (#b45309) which meets AA
at 5.1:1 on white.

| Token | Value | Tailwind equivalent | Usage |
|---|---|---|---|
| `--color-elec` | #fbbf24 | `amber-400` | Chart bar fill |
| `--color-elec-dark` | #b45309 | `amber-700` | Table text, badge text (5.1:1 on white) |
| `--color-elec-surface` | #fffbeb | `amber-50` | Summary tile / badge background |
| `--color-elec-border` | #fde68a | `amber-200` | Summary tile border |
| `--color-elec-muted` | #92400e | `amber-800` | Darker text on light amber surfaces |

### Gas (blue)

| Token | Value | Tailwind equivalent | Usage |
|---|---|---|---|
| `--color-gas` | #60a5fa | `blue-400` | Chart bar fill |
| `--color-gas-dark` | #1d4ed8 | `blue-700` | Table text, badge text (5.7:1 on white) |
| `--color-gas-surface` | #eff6ff | `blue-50` | Summary tile / badge background |
| `--color-gas-border` | #bfdbfe | `blue-200` | Summary tile border |
| `--color-gas-muted` | #1e3a8a | `blue-900` | Darker text on light blue surfaces |

### Fuel colour rationale

Electricity = amber/yellow — the conventional colour of electricity (lightning, bulbs).
Gas = blue — associated with gas flames and natural gas branding.
The two hues are perceptually distinct at all chart sizes and remain distinguishable
under common colour vision deficiencies (deuteranopia), where the amber reads as
yellow-orange and the blue as blue-grey.

### Neutrals

| Token | Value | Tailwind equivalent | Usage |
|---|---|---|---|
| `--color-background` | #f9fafb | `gray-50` | Page / screen background |
| `--color-surface` | #ffffff | `white` | Card, panel backgrounds |
| `--color-border` | #e5e7eb | `gray-200` | Standard borders, table rules |
| `--color-border-subtle` | #f3f4f6 | `gray-100` | Subtle dividers, card borders |

### Text

| Token | Value | Tailwind equivalent | Contrast on white | Usage |
|---|---|---|---|---|
| `--color-text-primary` | #111827 | `gray-900` | 15.3:1 | Headings, `<h1>`–`<h3>` |
| `--color-text-body` | #374151 | `gray-700` | 10.7:1 | Body text, `<td>` |
| `--color-text-secondary` | #6b7280 | `gray-500` | 4.6:1 (AA) | Secondary labels, muted table cells |
| `--color-text-disabled` | #9ca3af | `gray-400` | 2.6:1 | Placeholders, empty states (non-interactive only) |
| `--color-text-inverse` | #ffffff | `white` | — | Text on brand-coloured buttons |

### Semantic status

| Token | Value | Tailwind equivalent | Usage |
|---|---|---|---|
| `--color-error` | #dc2626 | `red-600` | Validation errors, destructive actions |
| `--color-error-surface` | #fef2f2 | `red-50` | Error message backgrounds |
| `--color-success` | #16a34a | `green-600` | Success messages (alias of brand) |
| `--color-success-surface` | #f0fdf4 | `green-50` | Success message backgrounds |
| `--color-warning` | #d97706 | `amber-600` | Warnings (4.5:1 on white — AA minimum) |

---

## Typography

Font: **Geist Sans** (loaded via `next/font/google`, variable `--font-geist`).
Fallback stack: `ui-sans-serif, system-ui, sans-serif`.

Use Tailwind's default type scale. Project-specific usage conventions:

| Size | Tailwind class | Usage |
|---|---|---|
| 12px | `text-xs` | Captions, table header labels (`uppercase tracking-wide`), badge text |
| 14px | `text-sm` | Body text, form labels, button labels, table cells |
| 16px | `text-base` | Card section headings (`font-semibold`) |
| 18px | `text-lg` | (reserved — not currently in use) |
| 24px | `text-2xl` | Page headings (`<h1>`, `font-bold`) |

Weight conventions:
- `font-medium` (500) — form labels, nav labels, badge text
- `font-semibold` (600) — card section headings, table totals
- `font-bold` (700) — page-level `<h1>`, summary tile figures

Line height: Tailwind default (`leading-normal`, 1.5) for body; `leading-tight` (1.25)
acceptable for large display numbers in summary tiles.

Numbers in tables must use `tabular-nums` to align decimal columns.

---

## Spacing

4px base unit. Use Tailwind's default spacing scale.

| Tailwind | px | Usage |
|---|---|---|
| `gap-1` / `p-1` | 4px | Micro gaps (badge internal padding) |
| `gap-2` / `p-2` | 8px | Tight element spacing |
| `gap-3` / `p-3` | 12px | Form field internal gaps, button groups |
| `p-4` / `gap-4` | 16px | Standard card padding, section padding |
| `space-y-4` | 16px | Form field stacking |
| `space-y-6` | 24px | Page-level section stacking |
| `pb-24` | 96px | Body bottom padding — clears fixed mobile nav (56px nav + buffer) |

---

## Border radius

| Use case | Tailwind class | px |
|---|---|---|
| Inputs, small buttons | `rounded-lg` | 8px |
| Primary buttons, login inputs | `rounded-xl` | 12px |
| Cards, modals, summary tiles | `rounded-2xl` | 16px |
| Badges / pills | `rounded-full` | 9999px |

---

## Elevation / shadows

| Level | Tailwind class | Use case |
|---|---|---|
| Card | `shadow-sm` | Standard data cards on dashboard |
| Modal | `shadow-md` | Raised panels, drawers |
| Dialog | `shadow-xl` | Confirm dialog over backdrop |

Card borders are always `border border-gray-100` (subtle) in addition to `shadow-sm`.
This ensures cards read on `gray-50` background even when shadow is hard to see on low-brightness screens.

---

## Animation

Use Tailwind's built-in `transition-colors` (150ms ease) on all interactive elements.
No custom durations needed at this project scale.

`prefers-reduced-motion: reduce` is respected in `globals.css` — all transitions and
animations are suppressed to 0.01ms for users who opt in to reduced motion.

---

## Component conventions

### Cards

```html
<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
  <h2 class="text-base font-semibold text-gray-800 mb-4">Section title</h2>
  <!-- content -->
</div>
```

### Summary tiles (electricity / gas)

```html
<!-- Electricity -->
<div class="bg-amber-50 border border-amber-100 rounded-2xl p-4">
  <p class="text-xs text-amber-700 font-medium uppercase tracking-wide">Electricity</p>
  <p class="text-2xl font-bold text-amber-700 mt-1">1,234 <span class="text-base font-normal">kWh</span></p>
</div>

<!-- Gas -->
<div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
  <p class="text-xs text-blue-700 font-medium uppercase tracking-wide">Gas</p>
  <p class="text-2xl font-bold text-blue-700 mt-1">5,678 <span class="text-base font-normal">kWh</span></p>
</div>
```

Note: tile labels and figures use `*-700` (not `*-600` or `*-500`) to meet WCAG AA on
the `*-50` surface backgrounds.

### Primary button

```html
<button class="bg-green-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium
               hover:bg-green-700 disabled:opacity-50 transition-colors">
  Action
</button>
```

Minimum touch target: the `py-2.5` (10px top + 10px bottom) + 20px text line-height
gives ~40px height. Add `min-h-[44px]` on any button that may render at small font sizes.

### Fuel type badges

```html
<!-- Electricity -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
             bg-amber-100 text-amber-700">Electricity</span>

<!-- Gas -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
             bg-blue-100 text-blue-700">Gas</span>

<!-- Active tariff -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
             bg-green-100 text-green-700">Active</span>
```

### Form inputs

```html
<label class="block text-sm font-medium text-gray-700 mb-1">Field label</label>
<input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-green-500" />
<p class="text-xs text-red-500 mt-1">Validation error message</p>
```

### Recharts colour constants

Define in a shared constants file (e.g. `src/lib/chart-colors.ts`) and import into
`CostChart` and `UsageChart` — avoids the colours drifting out of sync:

```ts
export const CHART_COLORS = {
  electricity: '#fbbf24', // amber-400
  gas:         '#60a5fa', // blue-400
} as const
```

### Skeleton / loading states

Use the shared primitive `src/components/ui/Skeleton.tsx` for all loading placeholders —
never hand-roll `animate-pulse` divs:

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

<Skeleton className="h-8 w-40" />                 // heading placeholder
<Skeleton className="h-[260px] w-full" />          // chart placeholder
<Skeleton className="min-h-[44px] w-full rounded-xl" />  // button placeholder
```

- Base style: `animate-pulse rounded-lg bg-gray-200`, `aria-hidden="true"`. Pass sizing
  (and radius overrides like `rounded-xl`/`rounded-2xl`) via `className`.
- On tinted fuel surfaces, override the fill to match: `bg-amber-100` on amber-50 tiles,
  `bg-blue-100` on blue-50 tiles.
- Every data-fetching route gets a `loading.tsx` (App Router streams it instantly on
  navigation). It must reuse the page's exact wrapper classes so content swaps in with
  zero layout shift. Examples: `src/app/dashboard/loading.tsx`, `src/app/tariffs/loading.tsx`,
  `src/app/readings/loading.tsx`.
- Under `prefers-reduced-motion` the pulse is suppressed globally — skeletons degrade to
  static gray blocks, which is the intended accessible behaviour.
- In-flight navigation feedback on the bottom nav uses `useLinkStatus()` from `next/link`
  (see `MobileNav.tsx` — pending items get `animate-pulse opacity-60`).

### Mobile nav

- Fixed bottom, `z-50`, `bg-white border-t border-gray-200`
- Nav items: `flex-1`, `min-h-[56px]` (44px touch target + 12px padding), `py-3`
- Active state: `text-green-600`; inactive: `text-gray-500`
- Ensure page content has `pb-24` to clear the nav bar

### Page layout wrapper

```html
<div class="p-4 space-y-6 max-w-3xl mx-auto pb-24">
```

`max-w-3xl` caps at 768px — readable on tablet without feeling too narrow on phone.

---

## Accessibility baseline

- All body text meets WCAG AA (4.5:1). See text token table above.
- Interactive touch targets minimum 44x44px on mobile.
- Focus indicator: `focus:ring-2 focus:ring-green-500` (visible green ring, 2px offset).
  Global `:focus-visible` fallback defined in `globals.css`.
- Fuel chart fills (amber-400, blue-400) are decorative large areas, not text —
  WCAG contrast rules apply to text labels. Legend and table text use darker variants
  meeting AA.
- Form inputs must have explicit `<label>` elements associated by `htmlFor` / `for` —
  never rely on placeholder alone.
- Error messages must appear adjacent to their input and use `text-red-500`/`text-red-600`.
- `prefers-reduced-motion` respected in `globals.css`.
