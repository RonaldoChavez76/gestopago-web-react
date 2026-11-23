export function CatalogSkeletonGrid() {
  const placeholders = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500">
        Consultando catálogo oficial de GestoPago...
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {placeholders.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-borde bg-white p-5 space-y-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="h-5 bg-slate-200 rounded w-20" />
              <div className="h-8 bg-slate-200 rounded-xl w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
