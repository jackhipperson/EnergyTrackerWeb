import type { MeterReading, MonthlyPeriod, Tariff, FuelType } from '@/types'

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
}

function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // "YYYY-MM"
}

function findTariff(tariffs: Tariff[], date: string): Tariff | undefined {
  return tariffs.find(t => {
    const after = t.valid_from <= date
    const before = t.valid_to == null || t.valid_to >= date
    return after && before
  })
}

export function buildMonthlyBreakdown(
  readings: MeterReading[],
  tariffs: Tariff[],
  fuelType: FuelType
): MonthlyPeriod[] {
  const fuelReadings = readings
    .filter(r => r.fuel_type === fuelType)
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))

  const fuelTariffs = tariffs.filter(t => t.fuel_type === fuelType)

  const monthly = new Map<string, MonthlyPeriod>()

  for (let i = 1; i < fuelReadings.length; i++) {
    const prev = fuelReadings[i - 1]
    const curr = fuelReadings[i]

    const usageKwh = curr.reading_kwh - prev.reading_kwh
    if (usageKwh <= 0) continue

    const days = daysBetween(prev.reading_date, curr.reading_date)
    const midDate = new Date(
      (new Date(prev.reading_date).getTime() + new Date(curr.reading_date).getTime()) / 2
    )
      .toISOString()
      .slice(0, 10)

    const tariff = findTariff(fuelTariffs, midDate)
    if (!tariff) continue

    const costGbp =
      (usageKwh * tariff.unit_rate + days * tariff.standing_charge) / 100

    const month = toMonthKey(curr.reading_date)
    const existing = monthly.get(month)
    if (existing) {
      existing.kwh += usageKwh
      existing.costGbp += costGbp
    } else {
      monthly.set(month, { month, kwh: usageKwh, costGbp })
    }
  }

  return Array.from(monthly.values()).sort((a, b) => a.month.localeCompare(b.month))
}
