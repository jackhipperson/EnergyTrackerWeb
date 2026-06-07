import type { MeterReading, MonthlyPeriod, Tariff, FuelType } from '@/types'

// UK Ofgem formula: m³ → kWh
// volume correction (1.02264) × calorific value (38.9 MJ/m³) ÷ 3.6 (MJ→kWh)
export const GAS_M3_TO_KWH = (1.02264 * 38.9) / 3.6

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
}

function daysInCalendarMonth(month: string): number {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m, 0).getDate()
}

function findTariff(tariffs: Tariff[], date: string): Tariff | undefined {
  return tariffs.find(t => {
    const after = t.valid_from <= date
    const before = t.valid_to == null || t.valid_to >= date
    return after && before
  })
}

// Split a reading period proportionally across the calendar months it spans.
// Uses UTC dates throughout to avoid DST boundary issues.
function splitAcrossMonths(
  startDate: string,
  endDate: string,
  kwhPerDay: number,
  costPerDay: number,
): Array<{ month: string; kwh: number; costGbp: number; days: number }> {
  const result: Array<{ month: string; kwh: number; costGbp: number; days: number }> = []
  let cur = new Date(startDate)
  const end = new Date(endDate)

  while (cur < end) {
    const month = cur.toISOString().slice(0, 7)
    const nextMonth = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
    const segEnd = nextMonth < end ? nextMonth : end
    const segDays = (segEnd.getTime() - cur.getTime()) / 86_400_000
    result.push({ month, kwh: kwhPerDay * segDays, costGbp: costPerDay * segDays, days: segDays })
    cur = nextMonth
  }
  return result
}

export function buildMonthlyBreakdown(
  readings: MeterReading[],
  tariffs: Tariff[],
  fuelType: FuelType,
): MonthlyPeriod[] {
  const fuelReadings = readings
    .filter(r => r.fuel_type === fuelType)
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))

  const fuelTariffs = tariffs.filter(t => t.fuel_type === fuelType)

  const monthly = new Map<string, { kwh: number; costGbp: number; days: number }>()

  for (let i = 1; i < fuelReadings.length; i++) {
    const prev = fuelReadings[i - 1]
    const curr = fuelReadings[i]

    const usageRaw = curr.reading_kwh - prev.reading_kwh
    const days = daysBetween(prev.reading_date, curr.reading_date)
    if (usageRaw <= 0 || days <= 0) continue

    const usageKwh = fuelType === 'gas' ? usageRaw * GAS_M3_TO_KWH : usageRaw
    const midDate = new Date(
      (new Date(prev.reading_date).getTime() + new Date(curr.reading_date).getTime()) / 2
    ).toISOString().slice(0, 10)

    const tariff = findTariff(fuelTariffs, midDate)
    if (!tariff) continue

    const costGbp = (usageKwh * tariff.unit_rate + days * tariff.standing_charge) / 100
    const kwhPerDay  = usageKwh / days
    const costPerDay = costGbp / days

    for (const seg of splitAcrossMonths(prev.reading_date, curr.reading_date, kwhPerDay, costPerDay)) {
      const existing = monthly.get(seg.month)
      if (existing) {
        existing.kwh     += seg.kwh
        existing.costGbp += seg.costGbp
        existing.days    += seg.days
      } else {
        monthly.set(seg.month, { kwh: seg.kwh, costGbp: seg.costGbp, days: seg.days })
      }
    }
  }

  // If the latest reading falls within the last data month (not on a month boundary),
  // that month is incomplete — extrapolate to the full month using the daily rate.
  const lastReadingDate = fuelReadings[fuelReadings.length - 1]?.reading_date ?? ''
  const sortedMonths    = Array.from(monthly.keys()).sort()
  const lastDataMonth   = sortedMonths[sortedMonths.length - 1] ?? ''
  const lastMonthIsPartial = lastDataMonth !== '' && lastReadingDate.slice(0, 7) === lastDataMonth

  return sortedMonths.map(month => {
    const d = monthly.get(month)!
    if (lastMonthIsPartial && month === lastDataMonth) {
      const fullDays = daysInCalendarMonth(month)
      const scale = fullDays / d.days
      return { month, kwh: d.kwh * scale, costGbp: d.costGbp * scale, estimated: true }
    }
    return { month, kwh: d.kwh, costGbp: d.costGbp }
  })
}
