export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-8 w-24 rounded-full" />
      </div>

      {/* Main content skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="skeleton h-52 rounded-2xl" />
            <div className="skeleton h-52 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
