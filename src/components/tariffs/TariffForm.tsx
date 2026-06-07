'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FuelType, Tariff } from '@/types'

type FuelSelection = FuelType | 'dual'

type FormValues = {
  fuel_type: FuelSelection
  supplier: string
  elec_unit_rate: number
  elec_standing_charge: number
  gas_unit_rate: number
  gas_standing_charge: number
  valid_from: string
}

interface Props {
  onSaved: () => void
  tariff?: Tariff
}

const fuelOptions: { value: FuelSelection; label: string; colour: string }[] = [
  { value: 'dual',        label: 'Dual',        colour: 'text-green-600'  },
  { value: 'electricity', label: 'Electricity', colour: 'text-yellow-600' },
  { value: 'gas',         label: 'Gas',         colour: 'text-blue-600'   },
]

const numberRules = (min = 0) => ({
  valueAsNumber: true,
  validate: (v: number) => (!isNaN(v) && v > min) || (min === 0 ? 'Cannot be negative' : 'Must be greater than 0'),
})

function RateSection({
  label,
  colour,
  unitField,
  standingField,
  register,
  errors,
}: {
  label: string
  colour: string
  unitField: keyof FormValues
  standingField: keyof FormValues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
}) {
  return (
    <div className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-wide ${colour}`}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit rate (p/kWh)</label>
          <input
            {...register(unitField, numberRules(0))}
            type="number"
            step="0.0001"
            placeholder="e.g. 24.50"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors[unitField] && <p className="text-xs text-red-500 mt-1">{errors[unitField].message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Standing charge (p/day)</label>
          <input
            {...register(standingField, { valueAsNumber: true, validate: (v: number) => (!isNaN(v) && v >= 0) || 'Cannot be negative' })}
            type="number"
            step="0.0001"
            placeholder="e.g. 53.21"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors[standingField] && <p className="text-xs text-red-500 mt-1">{errors[standingField].message}</p>}
        </div>
      </div>
    </div>
  )
}

export function TariffForm({ onSaved, tariff }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!tariff

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: tariff
      ? {
          fuel_type: tariff.fuel_type,
          supplier: tariff.supplier ?? '',
          elec_unit_rate: tariff.fuel_type === 'electricity' ? tariff.unit_rate : undefined,
          elec_standing_charge: tariff.fuel_type === 'electricity' ? tariff.standing_charge : undefined,
          gas_unit_rate: tariff.fuel_type === 'gas' ? tariff.unit_rate : undefined,
          gas_standing_charge: tariff.fuel_type === 'gas' ? tariff.standing_charge : undefined,
          valid_from: tariff.valid_from,
        }
      : { fuel_type: 'dual' },
  })

  const fuelType = watch('fuel_type')
  const showElec = fuelType === 'electricity' || fuelType === 'dual'
  const showGas  = fuelType === 'gas'         || fuelType === 'dual'

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setServerError('Not signed in. Please refresh and try again.')
      return
    }

    const inserts: { ft: FuelType; unit_rate: number; standing_charge: number }[] =
      values.fuel_type === 'dual'
        ? [
            { ft: 'electricity', unit_rate: values.elec_unit_rate, standing_charge: values.elec_standing_charge },
            { ft: 'gas',         unit_rate: values.gas_unit_rate,  standing_charge: values.gas_standing_charge  },
          ]
        : values.fuel_type === 'electricity'
        ? [{ ft: 'electricity', unit_rate: values.elec_unit_rate, standing_charge: values.elec_standing_charge }]
        : [{ ft: 'gas',         unit_rate: values.gas_unit_rate,  standing_charge: values.gas_standing_charge  }]

    if (isEditing) {
      const row = inserts[0]
      const { error } = await supabase
        .from('tariffs')
        .update({
          fuel_type: row.ft,
          supplier: values.supplier || null,
          unit_rate: row.unit_rate,
          standing_charge: row.standing_charge,
          valid_from: values.valid_from,
        })
        .eq('id', tariff.id)

      if (error) { setServerError('Failed to update tariff. Please try again.'); return }
    } else {
      for (const { ft, unit_rate, standing_charge } of inserts) {
        const { data: active } = await supabase
          .from('tariffs').select('id')
          .eq('user_id', user.id).eq('fuel_type', ft).is('valid_to', null)
          .single()

        if (active) {
          const validTo = new Date(values.valid_from)
          validTo.setDate(validTo.getDate() - 1)
          await supabase.from('tariffs').update({ valid_to: validTo.toISOString().slice(0, 10) }).eq('id', active.id)
        }

        const { error } = await supabase.from('tariffs').insert({
          user_id: user.id,
          fuel_type: ft,
          supplier: values.supplier || null,
          unit_rate,
          standing_charge,
          valid_from: values.valid_from,
        })

        if (error) { setServerError('Failed to save tariff. Please try again.'); return }
      }
    }

    reset({ fuel_type: 'dual' })
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Fuel type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fuel type</label>
        <div className="flex gap-4">
          {(isEditing ? fuelOptions.filter(o => o.value !== 'dual') : fuelOptions).map(({ value, label, colour }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input {...register('fuel_type')} type="radio" value={value} className="accent-green-600" />
              <span className={`text-sm font-medium ${colour}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <input
          {...register('supplier')}
          placeholder="e.g. Octopus Energy"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Rate sections */}
      {showElec && (
        <RateSection
          label="Electricity rates"
          colour="text-yellow-600"
          unitField="elec_unit_rate"
          standingField="elec_standing_charge"
          register={register}
          errors={errors}
        />
      )}
      {showGas && (
        <RateSection
          label="Gas rates"
          colour="text-blue-600"
          unitField="gas_unit_rate"
          standingField="gas_standing_charge"
          register={register}
          errors={errors}
        />
      )}

      {/* Valid from */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Valid from</label>
        <input
          {...register('valid_from', { required: 'Required' })}
          type="date"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {errors.valid_from && <p className="text-xs text-red-500 mt-1">{errors.valid_from.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Saving…' : isEditing ? 'Update tariff' : 'Add tariff'}
      </button>
    </form>
  )
}
