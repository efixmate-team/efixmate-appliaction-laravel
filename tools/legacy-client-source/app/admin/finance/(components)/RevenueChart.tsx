import type { RevenueSeriesPoint } from "@/src/features/finance/types";

export function RevenueChart({ series }: { series: RevenueSeriesPoint[] }) {
  if (!series.length) {
    return <p className="text-sm text-[#94a3b8]">No revenue data for this period.</p>;
  }

  const max = Math.max(...series.map((s) => Number(s.revenue) || 0), 1);

  return (
    <div className="flex h-48 items-end gap-1 border-b border-[#e2e8f0] pb-2">
      {series.map((s) => {
        const h = Math.round((Number(s.revenue) / max) * 100);
        return (
          <div key={String(s.period)} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-8 rounded-t bg-[#ecfdf5] transition-all"
              style={{ height: `${Math.max(h, 4)}%` }}
              title={`₹${s.revenue}`}
            />
            <span className="truncate text-[10px] text-[#94a3b8]">
              {new Date(s.period).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
