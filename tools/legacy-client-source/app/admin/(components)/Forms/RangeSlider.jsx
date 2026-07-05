'use client';

import { cn, Label } from "./formUtils";

export default function RangeSlider({
  title, disabled = false, required = false, value = 0,
  onChange, name, id, className, min = 0, max = 100, step = 1,
  showValue = true,
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Label title={title} required={required} htmlFor={id ?? name} />
        {showValue && (
          <span className="text-[12px] font-semibold text-[#334155]">{value}</span>
        )}
      </div>
      <div className="relative flex items-center h-5">
        <div className="absolute w-full h-1.5 rounded-full bg-[#e2e8f0]" />
        <div
          className="absolute h-1.5 rounded-full bg-[#334155] transition-all"
          style={{ width: `${percent}%` }}
        />
        <input
          id={id ?? name}
          name={name}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className={cn(
            "relative w-full appearance-none bg-transparent cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffffff]",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#334155]",
            "[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      <div className="flex justify-between text-[11px] text-[#94a3b8]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
