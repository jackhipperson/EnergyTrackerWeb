import { describe, it, expect } from 'vitest'
import { CHART_COLORS } from '../chart-colors'

/**
 * Guards that CHART_COLORS stays in sync with the design system tokens
 * documented in .claude/design-system.md and docs/design-system.md.
 *
 * --color-elec  → amber-400 (#fbbf24)
 * --color-gas   → blue-400  (#60a5fa)
 *
 * If you update these values you must also update both design-system docs
 * and the @theme token block in src/app/globals.css.
 */
describe('CHART_COLORS', () => {
  it('exposes an electricity key', () => {
    expect(CHART_COLORS).toHaveProperty('electricity')
  })

  it('exposes a gas key', () => {
    expect(CHART_COLORS).toHaveProperty('gas')
  })

  it('electricity color matches design token --color-elec (amber-400)', () => {
    expect(CHART_COLORS.electricity).toBe('#fbbf24')
  })

  it('gas color matches design token --color-gas (blue-400)', () => {
    expect(CHART_COLORS.gas).toBe('#60a5fa')
  })

  it('contains exactly the two expected fuel keys', () => {
    expect(Object.keys(CHART_COLORS)).toEqual(['electricity', 'gas'])
  })
})
