"use client";

import { cn } from "../utils";

export const STATUS_THEMES = {
  active:   { label: "Active",   dot: "bg-[#ecfdf5]0", chip: "bg-[#ecfdf5] text-[#334155] ring-[#059669]/20" },
  inactive: { label: "Inactive", dot: "bg-[#94a3b8]",   chip: "bg-[#f1f5f9] text-[#475569] ring-[#f8fafc]0/20" },
  pending:  { label: "Pending",  dot: "bg-[#fffbeb]0",   chip: "bg-[#fffbeb] text-[#b45309] ring-[#d97706]/20" },
  error:    { label: "Error",    dot: "bg-[#fef2f2]0",      chip: "bg-[#fef2f2] text-[#b91c1c] ring-[#dc2626]/20" },
  draft:    { label: "Draft",    dot: "bg-[#eff6ff]0",     chip: "bg-[#eff6ff] text-[#1d4ed8] ring-[#2563eb]/20" },
};

/**
 * StatusCell
 * Renders a coloured pill with a leading dot.
 *
 * @prop {string} value      - Status key (e.g. "active", "pending")
 * @prop {object} [statusMap] - Extend / override STATUS_THEMES
 *   Shape: { [key]: { label, dot: "bg-*", chip: "bg-* text-* ring-*" } }
 */
export function StatusCell({ value, statusMap = {} }) {
  const key   = String(value).toLowerCase();
  const theme = { ...STATUS_THEMES, ...statusMap }[key] ?? STATUS_THEMES.inactive;

  // Backward compatibility for old monolithic "color" property
  let chipClass = theme.chip;
  let dotClass  = theme.dot;
  if (theme.color && !chipClass) {
    const parts = theme.color.split(" dot-");
    chipClass = parts[0];
    dotClass  = parts[1];
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset shadow-sm",
      chipClass
    )}>
      <span className={cn("w-1 h-1 rounded-full", dotClass)} />
      {theme.label}
    </span>
  );
}
