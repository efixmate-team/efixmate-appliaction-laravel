export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc]/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-[#334155]">{title}</p>
      {description ? <p className="mt-1 text-xs text-[#53697e]">{description}</p> : null}
    </div>
  );
}
