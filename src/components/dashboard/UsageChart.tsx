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
import { CHART_COLORS } from '@/lib/chart-colors'

interface Props {
  data: CombinedMonth[]
}

export function UsageChart({ data }: Props) {
  const last12 = data.slice(-12)

  if (last12.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No usage data yet — add meter readings to see your consumption.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={last12} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}`} tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)} kWh` : v} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="elecKwh" name="Electricity (kWh)" fill={CHART_COLORS.electricity} radius={[3, 3, 0, 0]} />
        <Bar dataKey="gasKwh"  name="Gas (kWh)"         fill={CHART_COLORS.gas}         radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
