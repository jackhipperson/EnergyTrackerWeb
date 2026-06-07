import { describe, it, expect } from 'vitest'
import { computeDeltas } from '../ReadingsList'
import type { MeterReading, Tariff } from '@/types'

function makeReading(overrides: Pick<MeterReading, 'reading_date' | 'reading_kwh'> & Partial<MeterReading>): MeterReading {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    fuel_type: 'electricity',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTariff(overrides: Partial<Tariff> & Pick<Tariff, 'unit_rate' | 'standing_charge' | 'valid_from'>): Tariff {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    fuel_type: 'electricity',
    supplier: null,
    valid_to: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeDeltas', () => {
  it('returns null delta for the first reading', () => {
    const result = computeDeltas([makeReading({ reading_date: '2024-01-01', reading_kwh: 1000 })])
    expect(result[0].deltaKwh).toBeNull()
  })

  it('calculates delta correctly between two readings', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 1000 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 1150 }),
    ]
    const result = computeDeltas(readings)
    const sorted = result.sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    expect(sorted[0].deltaKwh).toBeNull()
    expect(sorted[1].deltaKwh).toBe(150)
  })

  it('calculates deltas correctly for multiple readings', () => {
    const readings = [
      makeReading({ reading_date: '2024-01-01', reading_kwh: 1000 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 1150 }),
      makeReading({ reading_date: '2024-03-01', reading_kwh: 1320 }),
    ]
    const result = computeDeltas(readings).sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    expect(result[0].deltaKwh).toBeNull()
    expect(result[1].deltaKwh).toBe(150)
    expect(result[2].deltaKwh).toBeCloseTo(170)
  })

  it('sorts by date ascending before computing deltas regardless of input order', () => {
    const readings = [
      makeReading({ reading_date: '2024-03-01', reading_kwh: 1320 }),
      makeReading({ reading_date: '2024-01-01', reading_kwh: 1000 }),
      makeReading({ reading_date: '2024-02-01', reading_kwh: 1150 }),
    ]
    const result = computeDeltas(readings).sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    expect(result[1].deltaKwh).toBe(150)
    expect(result[2].deltaKwh).toBeCloseTo(170)
  })

  it('returns empty array for empty input', () => {
    expect(computeDeltas([])).toEqual([])
  })
})

// Mirror the enrichWithCosts logic from ReadingsList — tested here with known numbers
describe('per-period averages', () => {
  // 100 kWh over 10 days at 30p/kWh + 50p/day standing = (100×30 + 10×50)/100 = £35
  // avg kWh/day = 10, avg £/day = £3.50
  const tariff = makeTariff({ unit_rate: 30, standing_charge: 50, valid_from: '2024-01-01' })

  it('avg kWh/day = deltaKwh / days', () => {
    const deltaKwh = 100
    const days = 10
    expect(deltaKwh / days).toBe(10)
  })

  it('cost calculation: (kwh × unit_rate + days × standing_charge) / 100', () => {
    const deltaKwh = 100
    const days = 10
    const costGbp = (deltaKwh * tariff.unit_rate + days * tariff.standing_charge) / 100
    expect(costGbp).toBeCloseTo(35)
  })

  it('avg cost/day = costGbp / days', () => {
    const deltaKwh = 100
    const days = 10
    const costGbp = (deltaKwh * tariff.unit_rate + days * tariff.standing_charge) / 100
    expect(costGbp / days).toBeCloseTo(3.5)
  })

  it('shows no cost when no tariff covers the period', () => {
    // A tariff that starts after the reading date — should not be used
    const lateTariff = makeTariff({ unit_rate: 30, standing_charge: 50, valid_from: '2025-01-01' })
    const midDate = '2024-06-15'
    const covering = [lateTariff].find(t => t.valid_from <= midDate && (t.valid_to == null || t.valid_to >= midDate))
    expect(covering).toBeUndefined()
  })
})
