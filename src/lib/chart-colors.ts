/**
 * Canonical chart fill colours for electricity and gas.
 * Source of truth — import these into every Recharts component rather than
 * hardcoding hex values. Matches the design system tokens:
 *   electricity → amber-400 (#fbbf24)
 *   gas         → blue-400  (#60a5fa)
 */
export const CHART_COLORS = {
  electricity: '#fbbf24', // amber-400 — --color-elec
  gas:         '#60a5fa', // blue-400  — --color-gas
} as const
