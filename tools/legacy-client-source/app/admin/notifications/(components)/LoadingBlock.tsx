export function LoadingBlock({ label = "Loadingâ€¦" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#f1f5f9] bg-[#ffffff] py-16 text-sm text-[#53697e]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-blue-600" />
      {label}
    </div>
  );
}

