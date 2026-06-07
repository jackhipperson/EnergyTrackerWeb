import type { MeterReading, Tariff } from '@/types'

interface Props {
  readings: MeterReading[]
  tariffs: Tariff[]
  onEdit: (reading: MeterReading) => void
  onDelete: (reading: MeterReading) => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
}

function findTariff(tariffs: Tariff[], date: string): Tariff | undefined {
  return tariffs.find(t => t.valid_from <= date && (t.valid_to == null || t.valid_to >= date))
}

export function computeDeltas(readings: MeterReading[]): (MeterReading & { deltaKwh: number | null })[] {
  const sorted = [...readings].sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  return sorted.map((r, i) => ({
    ...r,
    deltaKwh: i === 0 ? null : r.reading_kwh - sorted[i - 1].reading_kwh,
  }))
}

type EnrichedReading = MeterReading & {
  deltaKwh: number | null
  days: number | null
  avgKwhPerDay: number | null
  costGbp: number | null
  avgCostPerDay: number | null
}

function enrichWithCosts(readings: MeterReading[], tariffs: Tariff[]): EnrichedReading[] {
  const sorted = [...readings].sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  return sorted.map((r, i) => {
    if (i === 0) return { ...r, deltaKwh: null, days: null, avgKwhPerDay: null, costGbp: null, avgCostPerDay: null }

    const prev = sorted[i - 1]
    const deltaKwh = r.reading_kwh - prev.reading_kwh
    const days = daysBetween(prev.reading_date, r.reading_date)

    if (deltaKwh <= 0 || days <= 0) {
      return { ...r, deltaKwh, days, avgKwhPerDay: null, costGbp: null, avgCostPerDay: null }
    }

    const midDate = new Date(
      (new Date(prev.reading_date).getTime() + new Date(r.reading_date).getTime()) / 2
    ).toISOString().slice(0, 10)

    const tariff = findTariff(tariffs, midDate)
    if (!tariff) {
      return { ...r, deltaKwh, days, avgKwhPerDay: deltaKwh / days, costGbp: null, avgCostPerDay: null }
    }

    const costGbp = (deltaKwh * tariff.unit_rate + days * tariff.standing_charge) / 100
    return {
      ...r,
      deltaKwh,
      days,
      avgKwhPerDay: deltaKwh / days,
      costGbp,
      avgCostPerDay: costGbp / days,
    }
  })
}

export function ReadingsList({ readings, tariffs, onEdit, onDelete }: Props) {
  if (readings.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No readings added yet.</p>
  }

  const rows = enrichWithCosts(readings, tariffs).reverse() // newest first

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Reading (kWh)</th>
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Used since last (kWh)</th>
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">kWh/day</th>
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">£/day</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r => (
            <tr key={r.id}>
              <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{formatDate(r.reading_date)}</td>
              <td className="py-2 pr-4 text-gray-700 tabular-nums whitespace-nowrap">
                {r.reading_kwh.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                {r.deltaKwh === null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <span className={r.deltaKwh < 0 ? 'text-red-500' : 'text-gray-700'}>
                    {r.deltaKwh.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 tabular-nums whitespace-nowrap text-gray-600">
                {r.avgKwhPerDay == null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  r.avgKwhPerDay.toFixed(2)
                )}
              </td>
              <td className="py-2 pr-4 tabular-nums whitespace-nowrap text-gray-600">
                {r.avgCostPerDay == null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  `£${r.avgCostPerDay.toFixed(2)}`
                )}
              </td>
              <td className="py-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(r)}
                    className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
