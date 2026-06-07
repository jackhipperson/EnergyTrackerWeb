import type { Tariff } from '@/types'

interface Props {
  tariffs: Tariff[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPence(p: number) {
  return `${p.toFixed(2)}p`
}

export function TariffHistory({ tariffs }: Props) {
  if (tariffs.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No tariffs added yet.</p>
  }

  const sorted = [...tariffs].sort((a, b) => b.valid_from.localeCompare(a.valid_from))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium">Supplier</th>
            <th className="pb-2 font-medium">Unit rate</th>
            <th className="pb-2 font-medium">Standing</th>
            <th className="pb-2 font-medium">From</th>
            <th className="pb-2 font-medium">To</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map(t => (
            <tr key={t.id} className="py-2">
              <td className="py-2 text-gray-700">{t.supplier ?? '—'}</td>
              <td className="py-2 text-gray-700">{formatPence(t.unit_rate)}</td>
              <td className="py-2 text-gray-700">{formatPence(t.standing_charge)}</td>
              <td className="py-2 text-gray-700">{formatDate(t.valid_from)}</td>
              <td className="py-2 text-gray-700">{t.valid_to ? formatDate(t.valid_to) : '—'}</td>
              <td className="py-2">
                {t.valid_to === null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
