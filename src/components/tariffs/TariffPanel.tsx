'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Tariff, FuelType } from '@/types'
import { TariffForm } from './TariffForm'
import { TariffHistory } from './TariffHistory'

const labels: Record<FuelType, { title: string; colour: string }> = {
  electricity: { title: 'Electricity', colour: 'text-yellow-600' },
  gas:         { title: 'Gas',         colour: 'text-blue-600'   },
}

interface Props {
  fuelType: FuelType
  tariffs: Tariff[]
}

export function TariffPanel({ fuelType, tariffs }: Props) {
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { title, colour } = labels[fuelType]

  function handleSaved() {
    setAdding(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${colour}`}>{title}</h2>
        <button
          onClick={() => setAdding(v => !v)}
          className="text-sm text-green-600 font-medium hover:text-green-700"
        >
          {adding ? 'Cancel' : '+ Add tariff'}
        </button>
      </div>

      {adding && (
        <div className="border-t border-gray-100 pt-4">
          <TariffForm fuelType={fuelType} onSaved={handleSaved} />
        </div>
      )}

      <div className="border-t border-gray-100 pt-2">
        <TariffHistory tariffs={tariffs} />
      </div>
    </div>
  )
}
