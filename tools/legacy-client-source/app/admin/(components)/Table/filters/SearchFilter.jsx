"use client";

import { Search } from "lucide-react";

/**
 * SearchFilter
 * Text search input for the filter bar.
 *
 * @prop {string}   value
 * @prop {function} onChange(value: string)
 * @prop {string}   [placeholder="Search..."]
 */
export function SearchFilter({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-8 pl-8 pr-3 text-[13px] rounded-md border border-[#e2e8f0] bg-[#ffffff] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#cbd5e1] transition-all w-44"
      />
    </div>
  );
}
