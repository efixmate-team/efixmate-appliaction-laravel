"use client";

import { cn } from "../utils";

/**
 * ToggleFilter
 * Boolean on/off toggle for the filter bar.
 *
 * @prop {boolean}  value
 * @prop {function} onChange(value: boolean)
 * @prop {string}   [label="Active"]
 */
export function ToggleFilter({ value, onChange, label = "Active" }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="text-[13px] text-[#53697e]0">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value ?? false}
        onClick={() => onChange?.(!value)}
        className={cn(
          "relative w-8 h-[18px] rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#e2e8f0]",
          value ? "bg-[#334155]" : "bg-[#e2e8f0]"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200",
          value ? "translate-x-3.5" : "translate-x-0"
        )} />
      </button>
    </label>
  );
}
