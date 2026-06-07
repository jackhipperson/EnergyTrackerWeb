'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { MeterReading, FuelType, Tariff } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReadingForm } from './ReadingForm'
import { ReadingsList } from './ReadingsList'

const tabs: { label: string; value: FuelType; colour: string }[] = [
  { label: 'Electricity', value: 'electricity', colour: 'text-yellow-600' },
  { label: 'Gas',         value: 'gas',         colour: 'text-blue-600'   },
]

interface Props {
  readings: MeterReading[]
  tariffs: Tariff[]
}

export function ReadingsPanel({ readings, tariffs }: Props) {
  const [active, setActive] = useState<FuelType>('electricity')
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MeterReading | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const filtered = readings.filter(r => r.fuel_type === active)
  const { colour } = tabs.find(t => t.value === active)!

  function handleTabChange(tab: FuelType) {
    setActive(tab)
    setEditingReading(null)
  }

  function handleSaved() {
    setEditingReading(null)
    startTransition(() => router.refresh())
  }

  function handleEdit(reading: MeterReading) {
    setEditingReading(reading)
  }

  function handleCancelEdit() {
    setEditingReading(null)
  }

  function handleDelete(reading: MeterReading) {
    setPendingDelete(reading)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const supabase = createClient()
    await supabase.from('meter_readings').delete().eq('id', pendingDelete.id)
    if (editingReading?.id === pendingDelete.id) setEditingReading(null)
    setPendingDelete(null)
    startTransition(() => router.refresh())
  }

  const formTitle = editingReading
    ? `Edit ${tabs.find(t => t.value === active)!.label} reading`
    : `Add ${tabs.find(t => t.value === active)!.label} reading`

  return (
    <>
    <ConfirmDialog
      isOpen={!!pendingDelete}
      title="Delete reading"
      message="This reading will be permanently deleted. This cannot be undone."
      onConfirm={confirmDelete}
      onCancel={() => setPendingDelete(null)}
    />
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active === tab.value
                ? `border-green-500 ${tab.colour}`
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form — key forces remount (and therefore reset) on tab change or edit change */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className={`text-base font-semibold mb-4 ${colour}`}>{formTitle}</h2>
        <ReadingForm
          key={`${active}-${editingReading?.id ?? 'new'}`}
          fuelType={active}
          reading={editingReading ?? undefined}
          onSaved={handleSaved}
          onCancel={handleCancelEdit}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-3">History</h2>
        <ReadingsList
          readings={filtered}
          tariffs={tariffs.filter(t => t.fuel_type === active)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
    </>
  )
}
