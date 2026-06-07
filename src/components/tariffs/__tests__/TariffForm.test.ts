import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mirror the schema from TariffForm — tested in isolation so we don't need jsdom
const schema = z.object({
  supplier: z.string().optional(),
  unit_rate: z.number().positive('Must be greater than 0'),
  standing_charge: z.number().min(0, 'Cannot be negative'),
  valid_from: z.string().min(1, 'Required'),
})

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
    const result = schema.safeParse({
      unit_rate: -1,
      standing_charge: 53.21,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero unit rate', () => {
    const result = schema.safeParse({
      unit_rate: 0,
      standing_charge: 53.21,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative standing charge', () => {
    const result = schema.safeParse({
      unit_rate: 24.5,
      standing_charge: -1,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero standing charge', () => {
    const result = schema.safeParse({
      unit_rate: 24.5,
      standing_charge: 0,
      valid_from: '2024-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing valid_from', () => {
    const result = schema.safeParse({
      unit_rate: 24.5,
      standing_charge: 53.21,
      valid_from: '',
    })
    expect(result.success).toBe(false)
  })
})
