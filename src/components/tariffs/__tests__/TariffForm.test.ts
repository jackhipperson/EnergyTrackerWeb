import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  supplier: z.string().optional(),
  unit_rate: z.number().positive('Must be greater than 0'),
  standing_charge: z.number().min(0, 'Cannot be negative'),
  valid_from: z.string().min(1, 'Required'),
})

// Mirrors the native RHF validate functions in TariffForm.tsx
function validateUnitRate(v: number) {
  return (!isNaN(v) && v > 0) || 'Must be greater than 0'
}
function validateStandingCharge(v: number) {
  return (!isNaN(v) && v >= 0) || 'Cannot be negative'
}

describe('tariff form schema', () => {
  it('accepts valid input', () => {
    const result = schema.safeParse({
      supplier: 'Octopus',
      unit_rate: 24.5,
      standing_charge: 53.21,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts missing supplier', () => {
    const result = schema.safeParse({
      unit_rate: 24.5,
      standing_charge: 53.21,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative unit rate', () => {
    expect(schema.safeParse({ unit_rate: -1, standing_charge: 53.21, valid_from: '2024-01-01' }).success).toBe(false)
  })

  it('rejects zero unit rate', () => {
    expect(schema.safeParse({ unit_rate: 0, standing_charge: 53.21, valid_from: '2024-01-01' }).success).toBe(false)
  })

  it('rejects negative standing charge', () => {
    expect(schema.safeParse({ unit_rate: 24.5, standing_charge: -1, valid_from: '2024-01-01' }).success).toBe(false)
  })

  it('accepts zero standing charge', () => {
    expect(schema.safeParse({ unit_rate: 24.5, standing_charge: 0, valid_from: '2024-01-01' }).success).toBe(true)
  })

  it('rejects missing valid_from', () => {
    expect(schema.safeParse({ unit_rate: 24.5, standing_charge: 53.21, valid_from: '' }).success).toBe(false)
  })
})

describe('tariff form field validators (NaN guard)', () => {
  it('rejects NaN unit rate — catches empty number input', () => {
    expect(validateUnitRate(NaN)).not.toBe(true)
  })

  it('rejects NaN standing charge — catches empty number input', () => {
    expect(validateStandingCharge(NaN)).not.toBe(true)
  })

  it('accepts valid unit rate', () => {
    expect(validateUnitRate(24.5)).toBe(true)
  })

  it('accepts zero standing charge', () => {
    expect(validateStandingCharge(0)).toBe(true)
  })

  it('rejects negative unit rate', () => {
    expect(validateUnitRate(-1)).not.toBe(true)
  })

  it('rejects negative standing charge', () => {
    expect(validateStandingCharge(-0.01)).not.toBe(true)
  })
})
