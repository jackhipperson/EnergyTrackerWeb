'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CombinedMonth } from '@/types'

interface Props {
  data: CombinedMonth[]
}

export function CostChart({ data }: Props) {
  const last12 = data.slice(-12)

  if (last12.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No cost data yet — add tariffs and readings to see your costs.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={last12} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `£${v}`} tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(v) => typeof v === 'number' ? `£${v.toFixed(2)}` : v} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="elecCostGbp" name="Electricity" stackId="cost" fill="#fbbf24" radius={[0, 0, 0, 0]} />
        <Bar dataKey="gasCostGbp"  name="Gas"         stackId="cost" fill="#60a5fa" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
