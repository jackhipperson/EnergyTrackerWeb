import { createClient } from '@/lib/supabase/server'
import { ReadingsPanel } from '@/components/readings/ReadingsPanel'

export default async function ReadingsPage() {
  const supabase = await createClient()
  const [{ data: readings }, { data: tariffs }] = await Promise.all([
    supabase.from('meter_readings').select('*').order('reading_date', { ascending: false }),
    supabase.from('tariffs').select('*'),
  ])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Readings</h1>
      <ReadingsPanel readings={readings ?? []} tariffs={tariffs ?? []} />
    </div>
  )
}
