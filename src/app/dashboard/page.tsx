import { createClient } from '@/lib/supabase/server'
import { buildMonthlyBreakdown } from '@/lib/calculations'
import type { CombinedMonth, MeterReading, MonthlyPeriod } from '@/types'
import { CostChart } from '@/components/dashboard/CostChart'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { MonthBreakdown } from '@/components/dashboard/MonthBreakdown'

function mergeMonths(elec: MonthlyPeriod[], gas: MonthlyPeriod[]): CombinedMonth[] {
  const allMonths = new Set([...elec.map(m => m.month), ...gas.map(m => m.month)])
  const elecMap = new Map(elec.map(m => [m.month, m]))
  const gasMap  = new Map(gas.map(m => [m.month, m]))

  return Array.from(allMonths)
    .sort()
    .map(month => ({
      month,
      label: new Date(month + '-15').toLocaleString('en-GB', { month: 'short', year: '2-digit' }),
      elecKwh:     elecMap.get(month)?.kwh     ?? 0,
      elecCostGbp: elecMap.get(month)?.costGbp ?? 0,
      gasKwh:      gasMap.get(month)?.kwh      ?? 0,
      gasCostGbp:  gasMap.get(month)?.costGbp  ?? 0,
      estimated:   (elecMap.get(month)?.estimated ?? false) || (gasMap.get(month)?.estimated ?? false),
    }))
}

function windowTo12Months(data: CombinedMonth[], endMonth: string): CombinedMonth[] {
  const start = new Date(endMonth + '-01')
  start.setMonth(start.getMonth() - 11)
  const startStr = start.toISOString().slice(0, 7)
  return data.filter(m => m.month >= startStr && m.month <= endMonth)
}

// How many calendar months between the earliest and latest reading (0 = 0 or 1 readings)
function spanMonths(fuelReadings: MeterReading[]): number {
  if (fuelReadings.length < 2) return 0
  const sorted = [...fuelReadings].sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  const [fy, fm] = sorted[0].reading_date.slice(0, 7).split('-').map(Number)
  const [ly, lm] = sorted[sorted.length - 1].reading_date.slice(0, 7).split('-').map(Number)
  return (ly - fy) * 12 + (lm - fm)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: readings }, { data: tariffs }] = await Promise.all([
    supabase.from('meter_readings').select('*'),
    supabase.from('tariffs').select('*'),
  ])

  const allReadings = readings ?? []
  const allTariffs  = tariffs  ?? []

  const elecMonths = buildMonthlyBreakdown(allReadings, allTariffs, 'electricity')
  const gasMonths  = buildMonthlyBreakdown(allReadings, allTariffs, 'gas')
  const combined   = mergeMonths(elecMonths, gasMonths)

  // Window: last 12 months of data (periods are assigned to their start month,
  // so the last data month is one behind the last reading date)
  const windowEnd = combined.length > 0 ? combined[combined.length - 1].month : null
  const windowed  = windowEnd ? windowTo12Months(combined, windowEnd) : combined

  // Per-fuel span for estimation
  const elecReadings = allReadings.filter(r => r.fuel_type === 'electricity')
  const gasReadings  = allReadings.filter(r => r.fuel_type === 'gas')
  const elecSpan = spanMonths(elecReadings)
  const gasSpan  = spanMonths(gasReadings)

  // kWh totals in the windowed period
  const elecKwh12 = windowed.reduce((s, m) => s + m.elecKwh, 0)
  const gasKwh12  = windowed.reduce((s, m) => s + m.gasKwh,  0)

  // If data spans less than 12 months, extrapolate to annual estimate
  const elecEstimated  = elecSpan > 0 && elecSpan < 12
  const gasEstimated   = gasSpan  > 0 && gasSpan  < 12
  const elecDisplayKwh = elecEstimated ? elecKwh12 * (12 / elecSpan) : elecKwh12
  const gasDisplayKwh  = gasEstimated  ? gasKwh12  * (12 / gasSpan)  : gasKwh12

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary tiles — 12-month kWh usage */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Electricity</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {elecEstimated ? '~' : ''}{elecDisplayKwh.toFixed(0)}
            <span className="text-base font-normal ml-1">kWh</span>
          </p>
          <p className="text-xs text-amber-500 mt-0.5">12-month usage</p>
          {elecEstimated && (
            <p className="text-xs text-amber-400 mt-1 italic">
              Estimated — only {elecSpan} month{elecSpan !== 1 ? 's' : ''} of data
            </p>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Gas</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {gasEstimated ? '~' : ''}{gasDisplayKwh.toFixed(0)}
            <span className="text-base font-normal ml-1">kWh</span>
          </p>
          <p className="text-xs text-blue-500 mt-0.5">12-month usage</p>
          {gasEstimated && (
            <p className="text-xs text-blue-400 mt-1 italic">
              Estimated — only {gasSpan} month{gasSpan !== 1 ? 's' : ''} of data
            </p>
          )}
        </div>
      </div>

      {/* Cost chart — last 12 months from latest reading */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly cost</h2>
        <CostChart data={windowed} />
      </div>

      {/* Usage chart — last 12 months from latest reading */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly usage (kWh)</h2>
        <UsageChart data={windowed} />
      </div>

      {/* Month breakdown — last 12 months from latest reading */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Month breakdown</h2>
        <MonthBreakdown data={windowed} />
      </div>
    </div>
  )
}
