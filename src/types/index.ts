export type FuelType = 'electricity' | 'gas'

export interface Tariff {
  id: string
  user_id: string
  fuel_type: FuelType
  supplier: string | null
  unit_rate: number       // pence per kWh
  standing_charge: number // pence per day
  valid_from: string      // ISO date
  valid_to: string | null // ISO date or null = active
  created_at: string
}

export interface MeterReading {
  id: string
  user_id: string
  fuel_type: FuelType
  reading_date: string  // ISO date
  reading_kwh: number   // cumulative
  notes: string | null
  created_at: string
}

export interface MonthlyPeriod {
  month: string   // e.g. "2024-11"
  kwh: number
  costGbp: number
  estimated?: boolean  // true when extrapolated from a partial calendar month
}

export interface CombinedMonth {
  month: string       // "YYYY-MM"
  label: string       // "Nov 24"
  elecKwh: number
  elecCostGbp: number
  gasKwh: number
  gasCostGbp: number
  estimated?: boolean  // true when either fuel is extrapolated from a partial month
}
