import { Skeleton } from '@/components/ui/Skeleton'

export default function ReadingsLoading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-32" />

      {/* Electricity / Gas tab bar */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="min-h-[44px] rounded-xl" />
        <Skeleton className="min-h-[44px] rounded-xl" />
      </div>

      {/* Add reading button */}
      <Skeleton className="min-h-[44px] w-full rounded-xl" />

      {/* Readings table */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}
