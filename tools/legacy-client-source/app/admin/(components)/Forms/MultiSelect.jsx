'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn, Label, ErrorMsg } from "./formUtils";

// options: [{ key, value }]
/**
 * @typedef {{ key: string, value: string }} MultiSelectOption
 * @typedef {{
 *   title?: string;
 *   placeholder?: string;
 *   disabled?: boolean;
 *   required?: boolean;
 *   value?: string[];
 *   onChange?: (value: string[]) => void;
 *   name?: string;
 *   id?: string;
 *   className?: string;
 *   options?: MultiSelectOption[];
 * }} MultiSelectProps
 */

/**
 * @param {MultiSelectProps} props
 */
export default function MultiSelect({
  title, placeholder = "Select options...", disabled = false,
  required = false, value = [], onChange, name, id, className,
  options = [],
}) {
  const [touched, setTouched] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);

  const showError = touched && required && value.length === 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (key) => {
    setTouched(true);
    const next = value.includes(key)
      ? value.filter((k) => k !== key)
      : [...value, key];
    onChange?.(next);
  };

  const removeTag = (key) => onChange?.(value.filter((k) => k !== key));

  const selectedLabels = options.filter((o) => value.includes(o.key));

  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5 relative", className)}>
      <Label title={title} required={required} htmlFor={id ?? name} />

      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          "min-h-8 w-full flex flex-wrap items-center gap-1.5 pl-3 pr-8 py-1.5",
          "rounded-lg border border-[#f1f5f9] bg-[#ffffff] cursor-pointer transition-all relative",
          showError
            ? "border-[#fca5a5] ring-2 ring-[#fee2e2]"
            : open
            ? "border-[#94a3b8] ring-2 ring-[#0f172a]/5"
            : "border-[#e2e8f0]",
          disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]"
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-[13px] text-[#94a3b8]">{placeholder}</span>
        ) : (
          selectedLabels.map((opt) => (
            <span
              key={opt.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#334155] text-[12px] font-medium border border-[#e2e8f0]"
            >
              {opt.value}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(opt.key); }}
                className="text-[#94a3b8] hover:text-[#334155] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={cn(
          "absolute right-2.5 w-4 h-4 text-[#94a3b8] transition-transform",
          open && "rotate-180"
        )} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#ffffff] border border-[#e2e8f0] rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-[13px] text-[#94a3b8] px-3 py-2">No options available</p>
          ) : (
            options.map((opt) => {
              const selected = value.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggle(opt.key)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left transition-colors",
                    selected ? "bg-[#f8fafc] text-[#0f172a]" : "text-[#475569] hover:bg-[#f8fafc]"
                  )}
                >
                  {opt.value}
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-[#334155]" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      <ErrorMsg show={showError} message="Please select at least one option" />
    </div>
  );
}
