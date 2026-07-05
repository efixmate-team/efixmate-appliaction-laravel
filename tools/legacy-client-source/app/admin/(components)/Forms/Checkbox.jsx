'use client';

import { useState } from "react";
import { cn, Label, ErrorMsg } from "./formUtils";

/**
 * @param {{ title?: string, label?: string, disabled?: boolean, checked?: boolean, onChange?: (e: import('react').ChangeEvent<HTMLInputElement>) => void, name?: string, id?: string, className?: string, required?: boolean }} props
 */
export default function Checkbox({
  title, label, disabled = false, checked = false,
  onChange, name, id, className, required = false,
}) {
  const [touched, setTouched] = useState(false);
  const isControlled = onChange !== undefined;
  const [internalChecked, setInternalChecked] = useState(checked);

  const activeChecked = isControlled ? checked : internalChecked;

  const showError = touched && required && !activeChecked;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {title && <Label title={title} required={required} htmlFor={id ?? name} />}
      <label className={cn(
        "inline-flex items-center gap-2.5 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={id ?? name}
            name={name}
            checked={activeChecked}
            disabled={disabled}
            required={required}
            onChange={(e) => {
              setTouched(true);
              if (!isControlled) {
                setInternalChecked(e.target.checked);
              }
              onChange?.(e);
            }}
            className="sr-only"
          />
          <div className={cn(
            "w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all",
            activeChecked
              ? "bg-[#334155] border-[#334155]"
              : showError
              ? "border-[#f87171] bg-[#ffffff]"
              : "border-[#cbd5e1] bg-[#ffffff]"
          )}>
            {activeChecked && (
              <svg className="w-2.5 h-2.5 text-[#ffffff]" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        {label && <span className="text-[13px] text-[#475569]">{label}</span>}
      </label>
      <ErrorMsg show={showError} message="Please check this field" />
    </div>
  );
}
