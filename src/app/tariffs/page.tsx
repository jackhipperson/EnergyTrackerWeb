import { createClient } from '@/lib/supabase/server'
import { TariffPanel } from '@/components/tariffs/TariffPanel'

export default async function TariffsPage() {
  const supabase = await createClient()
  const { data: tariffs } = await supabase
    .from('tariffs')
    .select('*')
    .order('valid_from', { ascending: false })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tariffs</h1>
      <TariffPanel tariffs={tariffs ?? []} />
    </div>
  )
}
