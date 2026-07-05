'use client';

import { useState, useEffect } from "react";
import { cn, Label } from "./formUtils";

export default function Toggle({
  title, label, disabled = false, checked = false, defaultChecked = false,
  onChange, name, id, className,
}) {
  const isControlled = onChange !== undefined;
  const [internalChecked, setInternalChecked] = useState(isControlled ? checked : (defaultChecked || checked));

  useEffect(() => {
    if (!isControlled) {
       setInternalChecked(checked);
    }
  }, [checked, isControlled]);

  const activeChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    if (!isControlled) {
      setInternalChecked(!activeChecked);
    }
    onChange?.(!activeChecked);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {title && <Label title={title} htmlFor={id ?? name} />}
      {name && <input type="hidden" name={name} value={activeChecked ? "true" : "false"} />}
      <label className={cn(
        "inline-flex items-center gap-2.5 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <button
          type="button"
          role="switch"
          id={id ?? name}
          aria-checked={activeChecked}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "relative w-9 h-5 rounded-full transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#e2e8f0]",
            activeChecked ? "bg-[#334155]" : "bg-[#e2e8f0]",
            disabled && "pointer-events-none"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200",
            activeChecked ? "translate-x-4" : "translate-x-0"
          )} />
        </button>
        {label && <span className="text-[13px] text-[#475569]">{label}</span>}
      </label>
    </div>
  );
}
