import { describe, it, expect } from 'vitest'

// Mirrors the native RHF validate functions in ReadingForm.tsx
function validateReadingKwh(v: number) {
  return (!isNaN(v) && v > 0) || 'Must be greater than 0'
}
function validateReadingDate(v: string) {
  return (v && v.length > 0) || 'Required'
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
