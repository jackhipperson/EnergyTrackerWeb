import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
      <Skeleton className="h-8 w-40" />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
          <Skeleton className="h-3 w-20 bg-amber-100" />
          <Skeleton className="h-7 w-28 bg-amber-100" />
          <Skeleton className="h-3 w-24 bg-amber-100" />
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
          <Skeleton className="h-3 w-20 bg-blue-100" />
          <Skeleton className="h-7 w-28 bg-blue-100" />
          <Skeleton className="h-3 w-24 bg-blue-100" />
        </div>
      </div>

      {/* Cost chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-[260px] w-full" />
      </div>

      {/* Usage chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[260px] w-full" />
      </div>

      {/* Month breakdown table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
