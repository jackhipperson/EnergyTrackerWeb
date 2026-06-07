'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FuelType, MeterReading } from '@/types'

type FormValues = {
  reading_date: string
  reading_kwh: number
}

interface Props {
  fuelType: FuelType
  readings: MeterReading[]   // fuel-filtered; used for bounds validation
  onSaved: () => void
  reading?: MeterReading
  onCancel?: () => void
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function ReadingForm({ fuelType, readings, onSaved, reading, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!reading

  const { register, handleSubmit, reset, resetField, formState: { errors, isSubmitting, isValid } } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: reading
      ? { reading_date: reading.reading_date, reading_kwh: reading.reading_kwh }
      : { reading_date: todayStr() },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    if (!isEditing) resetField('reading_kwh')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setServerError('Not signed in. Please refresh and try again.')
      return
    }

    // Ensure at least one tariff covers on or before this reading date
    const { data: coveringTariffs } = await supabase
      .from('tariffs')
      .select('id')
      .eq('fuel_type', fuelType)
      .lte('valid_from', values.reading_date)
      .limit(1)

    if (!coveringTariffs || coveringTariffs.length === 0) {
      setServerError(
        `No ${fuelType} tariff covers this date. Add a tariff on the Tariffs page first.`
      )
      return
    }

    // Bounds check: reading must sit between adjacent readings by date
    const others = readings
      .filter(r => !isEditing || r.id !== reading!.id)
      .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    const prev = [...others].filter(r => r.reading_date < values.reading_date).pop()
    const next = others.find(r => r.reading_date > values.reading_date)
    if (prev && values.reading_kwh < prev.reading_kwh) {
      setServerError(
        `Reading must be ≥ ${prev.reading_kwh} kWh — the reading on ${prev.reading_date} was ${prev.reading_kwh}.`
      )
      return
    }
    if (next && values.reading_kwh > next.reading_kwh) {
      setServerError(
        `Reading must be ≤ ${next.reading_kwh} kWh — the reading on ${next.reading_date} was ${next.reading_kwh}.`
      )
      return
    }

    if (isEditing) {
      const { error } = await supabase
        .from('meter_readings')
        .update({ reading_date: values.reading_date, reading_kwh: values.reading_kwh })
        .eq('id', reading.id)

      if (error) {
        if (error.code === '23505') {
          setServerError('A reading for this date already exists.')
        } else {
          setServerError('Failed to update reading. Please try again.')
        }
        return
      }
    } else {
      const { error } = await supabase.from('meter_readings').insert({
        user_id: user.id,
        fuel_type: fuelType,
        reading_date: values.reading_date,
        reading_kwh: values.reading_kwh,
      })

      if (error) {
        if (error.code === '23505') {
          setServerError('A reading for this date already exists.')
        } else {
          setServerError('Failed to save reading. Please try again.')
        }
        return
      }

      reset({ reading_date: todayStr() })
    }

    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            {...register('reading_date', { required: 'Required' })}
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.reading_date && <p className="text-xs text-red-500 mt-1">{errors.reading_date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meter reading ({fuelType === 'gas' ? 'm³' : 'kWh'})
          </label>
          <input
            {...register('reading_kwh', {
              valueAsNumber: true,
              validate: v => (!isNaN(v) && v > 0) || 'Must be greater than 0',
            })}
            type="number"
            step={fuelType === 'gas' ? '0.001' : '0.01'}
            placeholder={fuelType === 'gas' ? 'e.g. 1234.567' : 'e.g. 12345.67'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.reading_kwh && <p className="text-xs text-red-500 mt-1">{errors.reading_kwh.message}</p>}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || (!isEditing && !isValid)}
          className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : isEditing ? 'Update reading' : 'Add reading'}
        </button>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
