import { createClient } from '@/lib/supabase/server'
import { buildMonthlyBreakdown } from '@/lib/calculations'
import type { CombinedMonth, MonthlyPeriod } from '@/types'
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
    }))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: readings }, { data: tariffs }] = await Promise.all([
    supabase.from('meter_readings').select('*'),
    supabase.from('tariffs').select('*'),
  ])

  const elecMonths = buildMonthlyBreakdown(readings ?? [], tariffs ?? [], 'electricity')
  const gasMonths  = buildMonthlyBreakdown(readings ?? [], tariffs ?? [], 'gas')
  const combined   = mergeMonths(elecMonths, gasMonths)

  const totalElecCost = elecMonths.reduce((s, m) => s + m.costGbp, 0)
  const totalGasCost  = gasMonths.reduce((s, m) => s + m.costGbp, 0)
  const totalElecKwh  = elecMonths.reduce((s, m) => s + m.kwh, 0)
  const totalGasKwh   = gasMonths.reduce((s, m) => s + m.kwh, 0)

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Electricity</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">£{totalElecCost.toFixed(2)}</p>
          <p className="text-xs text-amber-500 mt-0.5">{totalElecKwh.toFixed(0)} kWh total</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Gas</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">£{totalGasCost.toFixed(2)}</p>
          <p className="text-xs text-blue-500 mt-0.5">{totalGasKwh.toFixed(0)} kWh total</p>
        </div>
      </div>

      {/* Cost chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly cost</h2>
        <CostChart data={combined} />
      </div>

      {/* Usage chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly usage (kWh)</h2>
        <UsageChart data={combined} />
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Month breakdown</h2>
        <MonthBreakdown data={combined} />
      </div>
    </div>
  )
}
