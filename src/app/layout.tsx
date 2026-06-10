import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/nav/SignOutButton'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'EnergyTracker',
  description: 'Track your household electricity and gas costs',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EnergyTracker',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full font-sans antialiased bg-gray-50">
        {user && (
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate">{user.email}</span>
            <SignOutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
