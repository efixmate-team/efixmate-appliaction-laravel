'use client';

import { useState, useEffect } from "react";
import {
  Search, Mail, Lock, User, Phone,
  Calendar, Link, Hash, AlertCircle, CheckCircle2, ChevronDown,
} from "lucide-react";

import { useFormContext } from "./formUtils";

const ICON_MAP = {
  search: Search,
  mail: Mail,
  lock: Lock,
  user: User,
  phone: Phone,
  calendar: Calendar,
  link: Link,
  hash: Hash,
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Select({
  title,
  placeholder,
  icon,
  disabled = false,
  readonly = false,
  required = false,
  value,
  defaultValue,
  onChange,
  name,
  id,
  className,
  options = [],
}) {
  const { submitCount } = useFormContext();
  const [touched, setTouched] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");

  const currentValue = value !== undefined ? value : internalValue;

  const IconComponent = icon
    ? (typeof icon === "string" ? ICON_MAP[icon.toLowerCase()] : icon)
    : null;

  const showError = touched && required && !currentValue;
  const showValid = touched && !showError && Boolean(currentValue);

  const handleChange = (e) => {
    if (readonly || disabled) return;
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleBlur = () => setTouched(true);

  // âœ… Trigger validation on submit
  useEffect(() => {
    if (submitCount > 0) {
      setTouched(true);
    }
  }, [submitCount]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>

      {title && (
        <label htmlFor={id ?? name} className="text-[13px] font-semibold text-[#334155]">
          {title}
          {required && <span className="ml-0.5 text-[#7b5757]0">*</span>}
        </label>
      )}

      <div className="relative flex items-center">

        {IconComponent && (
          <IconComponent className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none z-10" />
        )}

        <select
          id={id ?? name}
          name={name}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full h-8 text-[13px] rounded-lg border border-[#f1f5f9] bg-[#ffffff] text-[#1e293b]",
            "transition-all outline-none appearance-none cursor-pointer",
            IconComponent ? "pl-9" : "pl-3",
            "pr-8",
            !currentValue && "text-[#94a3b8]",
            showError
              ? "border-[#fca5a5] ring-2 ring-[#fee2e2]"
              : showValid
                ? "border-[#6ee7b7] ring-2 ring-[#d1fae5]"
                : "border-[#e2e8f0] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#0f172a]/5",
            disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            readonly && "pointer-events-none bg-[#f8fafc] text-[#53697e]0",
          )}
        >
          <option value="" disabled hidden>
            {placeholder ?? "Select an option"}
          </option>

          {options.map((opt, idx) => (
            <option key={opt.id || opt.value || idx} value={opt.id || opt.value}>
              {opt.label || opt.name || opt.value}
            </option>
          ))}
        </select>

        {showError ? (
          <AlertCircle className="absolute right-2.5 w-4 h-4 text-[#f87171]" />
        ) : showValid ? (
          <CheckCircle2 className="absolute right-2.5 w-4 h-4 text-[#34d399]" />
        ) : (
          <ChevronDown className="absolute right-2.5 w-4 h-4 text-[#94a3b8]" />
        )}
      </div>

      {showError && (
        <p className="text-[11px] text-[#7b5757]0">This field is required</p>
      )}
    </div>
  );
}
