"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className = "",
}: Props) {
  const btn = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const icon = size === "sm" ? 12 : 14;
  const text = size === "sm" ? "text-[12px]" : "text-[14px]";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-2 py-1 transition-all ${className}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`grid ${btn} place-items-center rounded-lg text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-40 active:scale-95`}
      >
        <Minus size={icon} />
      </button>
      <span
        className={`min-w-[1.5rem] text-center font-black tabular-nums text-[#0f172a] transition-transform ${text}`}
        key={value}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`grid ${btn} place-items-center rounded-lg text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-40 active:scale-95`}
      >
        <Plus size={icon} />
      </button>
    </div>
  );
}
