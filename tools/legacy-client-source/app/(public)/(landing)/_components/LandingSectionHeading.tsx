export function LandingSectionHeading({
  title,
  subtitle,
  eyebrow,
  align,
  className = "",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const textAlign = align === "left" ? "text-left" : "text-center";
  return (
    <div className={`${textAlign} ${className}`}>
      {eyebrow && (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1d4ed8]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] text-[#0f172a] sm:text-[1.875rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-[15px] leading-relaxed text-[#475569]">{subtitle}</p>
      ) : null}
    </div>
  );
}
