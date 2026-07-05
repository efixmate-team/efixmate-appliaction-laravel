"use client";

import { ChevronDown } from "lucide-react";

/**
 * DropdownFilter
 * Select / dropdown filter for the filter bar.
 *
 * @prop {string}   value
 * @prop {function} onChange(value: string)
 * @prop {string}   [placeholder="All"]
 * @prop {Array}    options  - [{ value, label }]
 */
export function DropdownFilter({ value, onChange, placeholder = "All", options = [] }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-8 pl-3 pr-8 text-[13px] rounded-md border border-[#e2e8f0] bg-[#ffffff] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#cbd5e1] transition-all appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
    </div>
  );
}
