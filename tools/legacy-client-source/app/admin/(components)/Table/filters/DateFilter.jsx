"use client";

import { CalendarDays } from "lucide-react";

/**
 * DateFilter
 * Single date picker for the filter bar.
 *
 * @prop {string}   value          - ISO date string "YYYY-MM-DD"
 * @prop {function} onChange(value: string)
 */
export function DateFilter({ value, onChange }) {
  return (
    <div className="relative">
      <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-8 pl-8 pr-3 text-[13px] rounded-md border border-[#e2e8f0] bg-[#ffffff] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#cbd5e1] transition-all"
      />
    </div>
  );
}

/**
 * DateRangeFilter
 * Paired from/to date pickers for the filter bar.
 *
 * @prop {string}   fromValue
 * @prop {string}   toValue
 * @prop {function} onFromChange(value: string)
 * @prop {function} onToChange(value: string)
 */
export function DateRangeFilter({ fromValue, toValue, onFromChange, onToChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <DateFilter value={fromValue} onChange={onFromChange} />
      <span className="text-xs text-[#94a3b8]">to</span>
      <DateFilter value={toValue}   onChange={onToChange} />
    </div>
  );
}
