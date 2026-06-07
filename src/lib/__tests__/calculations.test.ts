import { describe, it, expect } from 'vitest'
import { buildMonthlyBreakdown, GAS_M3_TO_KWH } from '../calculations'
import type { MeterReading, Tariff } from '@/types'

function makeReading(overrides: Partial<MeterReading> & { reading_date: string; reading_kwh: number }): MeterReading {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    fuel_type: 'electricity',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTariff(overrides: Partial<Tariff> & { unit_rate: number; standing_charge: number; valid_from: string }): Tariff {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    fuel_type: 'electricity',
    supplier: 'Test Co',
    valid_to: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('buildMonthlyBreakdown', () => {
  it('returns empty array when fewer than 2 readings', () => {
    const readings = [makeReading({ reading_date: '2024-01-01', reading_kwh: 100 })]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2024-01-01' })]
    expect(buildMonthlyBreakdown(readings, tariffs, 'electricity')).toEqual([])
  })

  it('calculates usage and cost correctly for a single period', () => {
    // 100 kWh over 31 days (Jan 1 → Feb 1). Period is fully within January.
    // cost = (100 × 30 + 31 × 60) / 100 = (3000 + 1860) / 100 = £48.60
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2024-01')
    expect(result[0].kwh).toBeCloseTo(100)
    expect(result[0].costGbp).toBeCloseTo(48.6)
    expect(result[0].estimated).toBeFalsy()
  })

  it('pro-rates a period spanning two calendar months', () => {
    // Dec 16 → Feb 1 (47 days total), 47 kWh at 1 kWh/day, no standing charge.
    // Pro-rating: Dec gets 16 days (Dec 16→Jan 1), Jan gets 31 days (Jan 1→Feb 1).
    const readings = [
      makeReading({ reading_date: '2024-12-16', reading_kwh: 0 }),
      makeReading({ reading_date: '2025-02-01', reading_kwh: 47 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 100, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    const dec = result.find(r => r.month === '2024-12')
    const jan = result.find(r => r.month === '2025-01')

    expect(dec).toBeDefined()
    expect(jan).toBeDefined()
    expect(dec!.kwh).toBeCloseTo(16)
    expect(jan!.kwh).toBeCloseTo(31)
    // Total kWh preserved across months
    expect(dec!.kwh + jan!.kwh).toBeCloseTo(47)
    // Last reading is Feb 1 so neither month is partial
    expect(dec!.estimated).toBeFalsy()
    expect(jan!.estimated).toBeFalsy()
  })

  it('marks the last month as estimated when the latest reading is mid-month', () => {
    // Jan 1 → Jan 16 (15 days): 30 kWh at 2 kWh/day.
    // Jan only has 15 days of data, but January has 31 days → scale = 31/15.
    // Extrapolated kWh = 30 × (31/15) = 62.
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-01-16', reading_kwh: 30 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 100, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2024-01')
    expect(result[0].estimated).toBe(true)
    expect(result[0].kwh).toBeCloseTo(30 * (31 / 15))
  })

  it('does not mark a completed month as estimated when reading falls on month boundary', () => {
    // Last reading on Feb 1 — Jan data is complete (Jan 1→Feb 1 = 31 days).
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    expect(result).toHaveLength(1)
    expect(result[0].estimated).toBeFalsy()
  })

  it('groups multiple readings correctly with pro-rating', () => {
    // Jan 1→Jan 16 (15 days, 50 kWh) + Jan 16→Feb 1 (16 days, 50 kWh).
    // Both periods fall entirely within January; no cross-month split needed.
    // Total January = 100 kWh. Last reading Feb 1 → not partial.
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-01-16', reading_kwh: 50 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 20, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    expect(result.some(r => r.month === '2024-01')).toBe(true)
    const total = result.reduce((sum, r) => sum + r.kwh, 0)
    expect(total).toBeCloseTo(100)
  })

  it('returns empty when no matching tariff', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    // Tariff starts after the period
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2025-01-01' })]

    expect(buildMonthlyBreakdown(readings, tariffs, 'electricity')).toEqual([])
  })

  it('only includes readings for the specified fuel type', () => {
    const readings = [
      makeReading({ fuel_type: 'electricity', reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ fuel_type: 'electricity', reading_date: '2024-02-01', reading_kwh: 100 }),
      { ...makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }), fuel_type: 'gas' as const },
      { ...makeReading({ reading_date: '2024-02-01', reading_kwh: 500 }), fuel_type: 'gas' as const },
    ]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')
    expect(result[0].kwh).toBeCloseTo(100)
  })

  it('skips periods with zero or negative usage', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 100 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }), // same — 0 kWh
      makeReading({ reading_date: '2024-03-01', reading_kwh: 150 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')
    expect(result).toHaveLength(1)
    expect(result[0].kwh).toBeCloseTo(50)
  })

  it('respects tariff valid_to date', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [
      makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2023-01-01', valid_to: '2023-12-31' }),
    ]
    // Tariff expired before the period — no match
    expect(buildMonthlyBreakdown(readings, tariffs, 'electricity')).toEqual([])
  })

  it('applies m³ → kWh conversion for gas readings', () => {
    // 10 m³ used over 31 days (Jan 1 → Feb 1). standing_charge = 0 so days don't affect cost.
    // Converted kWh = 10 × GAS_M3_TO_KWH.  Cost = converted_kWh × 10 / 100.
    const readings = [
      makeReading({ fuel_type: 'gas', reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ fuel_type: 'gas', reading_date: '2024-02-01', reading_kwh: 10 }),
    ]
    const tariffs = [makeTariff({ fuel_type: 'gas', unit_rate: 10, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'gas')
    expect(result).toHaveLength(1)
    expect(result[0].kwh).toBeCloseTo(10 * GAS_M3_TO_KWH)
    expect(result[0].costGbp).toBeCloseTo((10 * GAS_M3_TO_KWH * 10) / 100)
    expect(result[0].estimated).toBeFalsy()
  })

  it('sorts results by month ascending', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 50 }),
      makeReading({ reading_date: '2024-03-01', reading_kwh: 120 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 20, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')
    expect(result[0].month <= result[result.length - 1].month).toBe(true)
  })
})
