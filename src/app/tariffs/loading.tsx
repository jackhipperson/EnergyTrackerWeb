import { Skeleton } from '@/components/ui/Skeleton'

export default function TariffsLoading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-32" />

      {/* Add tariff button */}
      <Skeleton className="min-h-[44px] w-full rounded-xl" />

      {/* Tariff history table */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}
