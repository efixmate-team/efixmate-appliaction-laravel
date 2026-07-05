'use client';

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn, borderState, Label, ErrorMsg } from "./formUtils";

export default function NumberStepper({
  title, disabled = false, required = false, value = 0,
  onChange, name, id, className, min, max, step = 1,
}) {
  const [touched, setTouched] = useState(false);
  const showError = touched && required && (value === "" || value === null || value === undefined);

  const decrement = () => {
    setTouched(true);
    const next = Number(value) - step;
    if (min !== undefined && next < min) return;
    onChange?.(next);
  };

  const increment = () => {
    setTouched(true);
    const next = Number(value) + step;
    if (max !== undefined && next > max) return;
    onChange?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label title={title} required={required} htmlFor={id ?? name} />
      <div className="flex items-center">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || (min !== undefined && Number(value) <= min)}
          className="h-8 w-8 flex items-center justify-center rounded-l-lg border border-r-0 border-[#e2e8f0] bg-[#f8fafc] text-[#53697e]0 hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          id={id ?? name}
          name={name}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          onChange={(e) => { setTouched(true); onChange?.(Number(e.target.value)); }}
          className={cn(
            "h-8 w-16 text-center text-[13px] border bg-[#ffffff] text-[#1e293b]",
            "transition-all outline-none",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
            borderState(showError, false),
          )}
        />
        <button
          type="button"
          onClick={increment}
          disabled={disabled || (max !== undefined && Number(value) >= max)}
          className="h-8 w-8 flex items-center justify-center rounded-r-lg border border-l-0 border-[#e2e8f0] bg-[#f8fafc] text-[#53697e]0 hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <ErrorMsg show={showError} />
    </div>
  );
}
