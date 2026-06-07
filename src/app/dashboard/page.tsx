import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 text-sm">Welcome, {user?.email}</p>
      <p className="mt-6 text-gray-400">Charts and breakdown coming in Stage 4.</p>
    </div>
  )
}
