import type { Tariff } from '@/types'

interface Props {
  tariffs: Tariff[]
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fuelBadge: Record<string, { label: string; className: string }> = {
  electricity: { label: 'Electricity', className: 'bg-yellow-100 text-yellow-700' },
  gas:         { label: 'Gas',         className: 'bg-blue-100 text-blue-700'     },
}

export function TariffHistory({ tariffs, onEdit, onDelete }: Props) {
  if (tariffs.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No tariffs added yet.</p>
  }

  const sorted = [...tariffs].sort((a, b) => b.valid_from.localeCompare(a.valid_from))

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Fuel</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Supplier</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Unit rate</th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Standing</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">From</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-2">To</th>
            <th className="pb-2"></th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const badge = fuelBadge[t.fuel_type]
            return (
              <tr
                key={t.id}
                className={`${i !== sorted.length - 1 ? 'border-b border-gray-100' : ''} ${t.valid_to === null ? 'bg-green-50/50' : ''}`}
              >
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-800 font-medium whitespace-nowrap">
                  {t.supplier ?? <span className="text-gray-400 font-normal">—</span>}
                </td>
                <td className="py-3 pr-4 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {t.unit_rate.toFixed(2)}p
                </td>
                <td className="py-3 pr-4 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {t.standing_charge.toFixed(2)}p
                </td>
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDate(t.valid_from)}</td>
                <td className="py-3 pr-2 text-gray-600 whitespace-nowrap">
                  {t.valid_to ? formatDate(t.valid_to) : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-2">
                  {t.valid_to === null && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => onEdit(t)}
                      className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
