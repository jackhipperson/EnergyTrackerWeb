import { createClient } from '@/lib/supabase/server'
import { TariffPanel } from '@/components/tariffs/TariffPanel'

export default async function TariffsPage() {
  const supabase = await createClient()
  const { data: tariffs } = await supabase
    .from('tariffs')
    .select('*')
    .order('valid_from', { ascending: false })

  const electricity = (tariffs ?? []).filter(t => t.fuel_type === 'electricity')
  const gas = (tariffs ?? []).filter(t => t.fuel_type === 'gas')

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Tariffs</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TariffPanel fuelType="electricity" tariffs={electricity} />
        <TariffPanel fuelType="gas" tariffs={gas} />
      </div>
    </div>
  )
}
