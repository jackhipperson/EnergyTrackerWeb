'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Tariff } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TariffForm } from './TariffForm'
import { TariffHistory } from './TariffHistory'

interface Props {
  tariffs: Tariff[]
}

export function TariffPanel({ tariffs }: Props) {
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null)
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Tariff | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const showForm = adding || editingTariff !== null
  const formTitle = editingTariff ? 'Edit tariff' : 'Add tariff'

  function handleSaved() {
    setAdding(false)
    setEditingTariff(null)
    startTransition(() => router.refresh())
  }

  function handleEdit(tariff: Tariff) {
    setAdding(false)
    setEditingTariff(tariff)
  }

  function handleDelete(tariff: Tariff) {
    setPendingDelete(tariff)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const supabase = createClient()
    await supabase.from('tariffs').delete().eq('id', pendingDelete.id)
    setPendingDelete(null)
    startTransition(() => router.refresh())
  }

  function handleCancel() {
    setAdding(false)
    setEditingTariff(null)
  }

  return (
    <>
    <ConfirmDialog
      isOpen={!!pendingDelete}
      title="Delete tariff"
      message={`Delete this ${pendingDelete?.fuel_type ?? ''} tariff? Historical cost calculations that used this tariff will no longer be accurate.`}
      onConfirm={confirmDelete}
      onCancel={() => setPendingDelete(null)}
    />
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Tariff history</h2>
        <button
          onClick={() => showForm ? handleCancel() : setAdding(true)}
          className="text-sm text-green-600 font-medium hover:text-green-700"
        >
          {showForm ? 'Cancel' : '+ Add tariff'}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-600 mb-3">{formTitle}</p>
          <TariffForm
            tariff={editingTariff ?? undefined}
            onSaved={handleSaved}
          />
        </div>
      )}

      <div className="border-t border-gray-100 pt-2">
        <TariffHistory tariffs={tariffs} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
    </>
  )
}
