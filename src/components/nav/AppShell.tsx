import { MobileNav } from './MobileNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full pb-20">
      <main className="flex-1 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
