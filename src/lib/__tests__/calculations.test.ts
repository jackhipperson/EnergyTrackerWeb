import { describe, it, expect } from 'vitest'
import { buildMonthlyBreakdown } from '../calculations'
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
    // 100 kWh used over 31 days in January
    // unit_rate = 30p/kWh, standing_charge = 60p/day
    // cost = (100 * 30 + 31 * 60) / 100 = (3000 + 1860) / 100 = £48.60
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 30, standing_charge: 60, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2024-02')
    expect(result[0].kwh).toBeCloseTo(100)
    expect(result[0].costGbp).toBeCloseTo(48.6)
  })

  it('groups multiple readings into the same month', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 0 }),
      makeReading({ reading_date: '2024-01-16', reading_kwh: 50 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }),
    ]
    const tariffs = [makeTariff({ unit_rate: 20, standing_charge: 0, valid_from: '2024-01-01' })]

    const result = buildMonthlyBreakdown(readings, tariffs, 'electricity')

    // Both pairs end in Jan or Feb — first pair ends 2024-01-16 (Jan), second ends 2024-02-01 (Feb)
    expect(result.some(r => r.month === '2024-01')).toBe(true)
    expect(result.some(r => r.month === '2024-02')).toBe(true)
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
      makeReading({ reading_date: '2024-02-01', reading_kwh: 100 }), // same value — 0 kWh
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
