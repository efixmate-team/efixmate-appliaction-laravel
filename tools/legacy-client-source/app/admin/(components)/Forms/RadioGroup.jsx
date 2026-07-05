'use client';

import { useState } from "react";
import { cn, Label, ErrorMsg } from "./formUtils";

/**
 * @typedef {{ key: string; value: string }} RadioOption
 */

/**
 * @typedef {Object} RadioGroupProps
 * @property {string} [title]
 * @property {RadioOption[]} [options]
 * @property {boolean} [disabled]
 * @property {string | number} [value]
 * @property {(e: import("react").ChangeEvent<HTMLInputElement>) => void} [onChange]
 * @property {string} [name]
 * @property {string} [className]
 * @property {boolean} [required]
 * @property {"vertical" | "horizontal"} [direction]
 */

/**
 * @param {RadioGroupProps} props
 */
export default function RadioGroup({
  title, options = [], disabled = false, value, onChange,
  name, className, required = false, direction = "vertical",
}) {
  const [touched, setTouched] = useState(false);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(value ?? "");

  const currentValue = isControlled ? value : internalValue;

  const showError = touched && required && !currentValue;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label title={title} required={required} />
      <div className={cn(
        "flex gap-3",
        direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
      )}>
        {options.map((opt) => (
          <label
            key={opt.key}
            className={cn(
              "inline-flex items-center gap-2.5 cursor-pointer select-none",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name={name}
                value={opt.key}
                checked={currentValue === opt.key}
                disabled={disabled}
                onChange={(e) => {
                  setTouched(true);
                  if (!isControlled) {
                    setInternalValue(opt.key);
                  }
                  onChange?.(e);
                }}
                className="sr-only"
              />
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                currentValue === opt.key
                  ? "border-[#334155]"
                  : showError ? "border-[#f87171]" : "border-[#cbd5e1]"
              )}>
                {currentValue === opt.key && (
                  <div className="w-2 h-2 rounded-full bg-[#334155]" />
                )}
              </div>
            </div>
            <span className="text-[13px] text-[#475569]">{opt.value}</span>
          </label>
        ))}
      </div>
      <ErrorMsg show={showError} message="Please select an option" />
    </div>
  );
}
