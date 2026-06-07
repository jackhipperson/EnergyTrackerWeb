import { describe, it, expect } from 'vitest'
import type { MeterReading } from '@/types'

// Mirrors the native RHF validate functions in ReadingForm.tsx
function validateReadingKwh(v: number) {
  return (!isNaN(v) && v > 0) || 'Must be greater than 0'
}
function validateReadingDate(v: string) {
  return (v && v.length > 0) || 'Required'
}

// Mirrors the bounds check in ReadingForm.onSubmit
function boundsCheck(
  readings: Pick<MeterReading, 'id' | 'reading_date' | 'reading_kwh'>[],
  date: string,
  kwh: number,
  editingId?: string,
): string | null {
  const others = readings
    .filter(r => !editingId || r.id !== editingId)
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  const prev = [...others].filter(r => r.reading_date < date).pop()
  const next = others.find(r => r.reading_date > date)
  if (prev && kwh < prev.reading_kwh) return `must be ≥ ${prev.reading_kwh}`
  if (next && kwh > next.reading_kwh) return `must be ≤ ${next.reading_kwh}`
  return null
}

describe('reading form field validators', () => {
  it('rejects NaN kWh — catches empty number input', () => {
    expect(validateReadingKwh(NaN)).not.toBe(true)
  })

  it('rejects zero kWh', () => {
    expect(validateReadingKwh(0)).not.toBe(true)
  })

  it('rejects negative kWh', () => {
    expect(validateReadingKwh(-1)).not.toBe(true)
  })

  it('accepts valid kWh', () => {
    expect(validateReadingKwh(12345.67)).toBe(true)
  })

  it('rejects empty date', () => {
    expect(validateReadingDate('')).not.toBe(true)
  })

  it('accepts valid date', () => {
    expect(validateReadingDate('2024-01-01')).toBe(true)
  })
})

describe('reading bounds check', () => {
  const readings = [
    { id: 'a', reading_date: '2024-01-01', reading_kwh: 100 },
    { id: 'b', reading_date: '2024-03-01', reading_kwh: 300 },
  ]

  it('passes when no adjacent readings exist', () => {
    expect(boundsCheck([], '2024-02-01', 200)).toBeNull()
  })

  it('passes when value sits between prev and next', () => {
    expect(boundsCheck(readings, '2024-02-01', 200)).toBeNull()
  })

  it('fails when value is lower than previous reading', () => {
    expect(boundsCheck(readings, '2024-02-01', 50)).toMatch(/≥ 100/)
  })

  it('fails when value is higher than next reading', () => {
    expect(boundsCheck(readings, '2024-02-01', 400)).toMatch(/≤ 300/)
  })

  it('passes when value equals the previous reading', () => {
    expect(boundsCheck(readings, '2024-02-01', 100)).toBeNull()
  })

  it('passes when value equals the next reading', () => {
    expect(boundsCheck(readings, '2024-02-01', 300)).toBeNull()
  })

  it('excludes the reading being edited from bounds check', () => {
    // Editing the reading on 2024-01-01 (value 100) — should not constrain itself
    expect(boundsCheck(readings, '2024-01-01', 50, 'a')).toBeNull()
  })

  it('passes for a new reading after all existing readings', () => {
    expect(boundsCheck(readings, '2024-04-01', 500)).toBeNull()
  })

  it('fails for a new reading after all existing readings that goes below the last', () => {
    expect(boundsCheck(readings, '2024-04-01', 50)).toMatch(/≥ 300/)
  })
})
