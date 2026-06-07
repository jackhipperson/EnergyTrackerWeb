'use client'

import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full navigation so the server layout re-runs getUser() with cleared cookies.
    window.location.href = '/login'
  }

  return (
    <button
      onClick={signOut}
      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
    >
      Sign out
    </button>
  )
}
