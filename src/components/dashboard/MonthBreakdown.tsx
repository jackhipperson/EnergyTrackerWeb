import type { CombinedMonth } from '@/types'

interface Props {
  data: CombinedMonth[]
}

function fmt(n: number) {
  return n > 0 ? n.toFixed(1) : '—'
}

function fmtGbp(n: number) {
  return n > 0 ? `£${n.toFixed(2)}` : '—'
}

function formatMonth(month: string) {
  return new Date(month + '-15').toLocaleString('en-GB', { month: 'short', year: 'numeric' })
}

export function MonthBreakdown({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No data yet.</p>
  }

  const rows = [...data].reverse()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left py-2 pr-3 font-medium">Month</th>
            <th className="text-right py-2 px-2 font-medium">Elec (kWh)</th>
            <th className="text-right py-2 px-2 font-medium">Elec (£)</th>
            <th className="text-right py-2 px-2 font-medium">Gas (kWh)</th>
            <th className="text-right py-2 px-2 font-medium">Gas (£)</th>
            <th className="text-right py-2 pl-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-2 pr-3 font-medium text-gray-800">{formatMonth(row.month)}</td>
              <td className="text-right py-2 px-2 text-gray-600">{fmt(row.elecKwh)}</td>
              <td className="text-right py-2 px-2 text-yellow-700">{fmtGbp(row.elecCostGbp)}</td>
              <td className="text-right py-2 px-2 text-gray-600">{fmt(row.gasKwh)}</td>
              <td className="text-right py-2 px-2 text-blue-700">{fmtGbp(row.gasCostGbp)}</td>
              <td className="text-right py-2 pl-2 font-semibold text-gray-900">
                {fmtGbp(row.elecCostGbp + row.gasCostGbp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
