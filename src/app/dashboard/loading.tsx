const bar = "animate-pulse rounded bg-layer-2";
const card = "rounded-xl border border-line bg-surface p-5";

export default function DashboardLoading() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Loading…</span>

      <div>
        <div className={`${bar} h-6 w-40`} />
        <div className={`${bar} mt-2 h-3.5 w-72 max-w-full`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={card}>
            <div className={`${bar} h-3 w-24`} />
            <div className={`${bar} mt-4 h-6 w-32`} />
            <div className={`${bar} mt-2 h-3 w-20`} />
          </div>
        ))}
      </div>

      <div className={`${card} h-80`}>
        <div className={`${bar} h-4 w-36`} />
      </div>
    </div>
  );
}
