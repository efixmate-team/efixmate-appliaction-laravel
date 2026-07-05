import * as React from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted" | "secondary";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]",
  success: "bg-[#ecfdf5] text-[#047857] border-[#d1fae5]",
  warning: "bg-[#fffbeb] text-[#b45309] border-[#fef3c7]",
  danger: "bg-[#fef2f2] text-[#b91c1c] border-[#fee2e2]",
  muted: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
  secondary: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
