'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { FuelType } from '@/types'

const schema = z.object({
  supplier: z.string().optional(),
  unit_rate: z.number().positive('Must be greater than 0'),
  standing_charge: z.number().min(0, 'Cannot be negative'),
  valid_from: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  fuelType: FuelType
  onSaved: () => void
}

export function TariffForm({ fuelType, onSaved }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Close previous active tariff
    const { data: active } = await supabase
      .from('tariffs')
      .select('id')
      .eq('user_id', user.id)
      .eq('fuel_type', fuelType)
      .is('valid_to', null)
      .single()

    if (active) {
      const validTo = new Date(values.valid_from)
      validTo.setDate(validTo.getDate() - 1)
      await supabase
        .from('tariffs')
        .update({ valid_to: validTo.toISOString().slice(0, 10) })
        .eq('id', active.id)
    }

    await supabase.from('tariffs').insert({
      user_id: user.id,
      fuel_type: fuelType,
      supplier: values.supplier || null,
      unit_rate: values.unit_rate,
      standing_charge: values.standing_charge,
      valid_from: values.valid_from,
    })

    reset()
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <input
          {...register('supplier')}
          placeholder="e.g. Octopus Energy"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit rate (p/kWh)</label>
          <input
            {...register('unit_rate', { valueAsNumber: true })}
            type="number"
            step="0.0001"
            placeholder="e.g. 24.50"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.unit_rate && <p className="text-xs text-red-500 mt-1">{errors.unit_rate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Standing charge (p/day)</label>
          <input
            {...register('standing_charge', { valueAsNumber: true })}
            type="number"
            step="0.0001"
            placeholder="e.g. 53.21"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.standing_charge && <p className="text-xs text-red-500 mt-1">{errors.standing_charge.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Valid from</label>
        <input
          {...register('valid_from')}
          type="date"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {errors.valid_from && <p className="text-xs text-red-500 mt-1">{errors.valid_from.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Add tariff'}
      </button>
    </form>
  )
}
