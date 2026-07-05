"use client";

import { cn } from "../utils";

/**
 * ChipsCell
 * Generic badge / chip for use in table cells or standalone.
 *
 * @prop {string}  value     - Display text
 * @prop {React.ElementType} [Icon] - Lucide icon component
 * @prop {"default"|"success"|"danger"|"warning"|"info"} [variant="default"]
 * @prop {"sm"|"md"} [size="sm"]
 * @prop {string}  [className]
 */
export function ChipsCell({
  value,
  Icon,
  variant = "default",
  size = "sm",
  className = "",
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset transition-all";

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-[12px]",
  };

  const variants = {
    default: "bg-[#f1f5f9] text-[#334155] ring-[#e2e8f0]",
    success: "bg-[#ecfdf5] text-[#047857] ring-[#a7f3d0]",
    danger:  "bg-[#fef2f2] text-[#b91c1c] ring-[#fecaca]",
    warning: "bg-[#fffbeb] text-[#b45309] ring-[#fde68a]",
    info:    "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]",
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)}>
      {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
      <span className="truncate">{value}</span>
    </span>
  );
}
