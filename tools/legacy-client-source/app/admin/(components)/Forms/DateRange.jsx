'use client';

import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn, BASE_INPUT, Label, ErrorMsg } from "./formUtils";

export default function DateRange({
  title, disabled = false, required = false,
  fromValue, toValue, onFromChange, onToChange,
  name, className,
}) {
  const [touched, setTouched] = useState(false);
  const showError = touched && required && (!fromValue || !toValue);

  const fieldBorder = showError
    ? "border-[#fca5a5] ring-2 ring-[#fee2e2]"
    : "border-[#e2e8f0] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#0f172a]/5";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label title={title} required={required} />
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
          <input
            type="date"
            value={fromValue ?? ""}
            disabled={disabled}
            required={required}
            onChange={onFromChange}
            onBlur={() => setTouched(true)}
            className={cn(
              BASE_INPUT, "h-8 pl-9 pr-3", fieldBorder,
              !fromValue && "text-[#94a3b8]",
              disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            )}
          />
        </div>
        <span className="text-[12px] text-[#94a3b8] shrink-0">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
          <input
            type="date"
            value={toValue ?? ""}
            min={fromValue}
            disabled={disabled}
            required={required}
            onChange={onToChange}
            onBlur={() => setTouched(true)}
            className={cn(
              BASE_INPUT, "h-8 pl-9 pr-3", fieldBorder,
              !toValue && "text-[#94a3b8]",
              disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            )}
          />
        </div>
      </div>
      <ErrorMsg show={showError} message="Please select both dates" />
    </div>
  );
}
