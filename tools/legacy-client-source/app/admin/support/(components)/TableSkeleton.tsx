export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 flex-1 rounded bg-[#f1f5f9]" />
          <div className="h-4 w-24 rounded bg-[#f1f5f9]" />
          <div className="h-4 w-16 rounded bg-[#f1f5f9]" />
        </div>
      ))}
    </div>
  );
}

