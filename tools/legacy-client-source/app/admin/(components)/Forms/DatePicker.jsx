'use client';

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { cn, BASE_INPUT, borderState, Label, ErrorMsg, TrailingIcon, useFormContext } from "./formUtils";

export default function DatePicker({
  title, placeholder = "Pick a date", disabled = false, readonly = false,
  required = false, value, onChange, name, id, className, min, max,
}) {
  const { submitCount } = useFormContext();
  const [touched, setTouched] = useState(false);

  // 🔥 Trigger validation on submit
  useEffect(() => {
    if (submitCount > 0) setTouched(true);
  }, [submitCount]);

  const showError = touched && required && !value;
  const showValid = touched && !showError && Boolean(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label title={title} required={required} htmlFor={id ?? name} />
      <div className="relative flex items-center">
        <Calendar className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
        <input
          id={id ?? name}
          name={name}
          type="date"
          value={value ?? ""}
          min={min}
          max={max}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          className={cn(
            BASE_INPUT, "h-8 pl-9 pr-9",
            borderState(showError, showValid),
            !value && "text-[#94a3b8]",
            disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            readonly  && "cursor-default bg-[#f8fafc] text-[#53697e]0",
          )}
        />
        <TrailingIcon showError={showError} showValid={showValid} />
      </div>
      <ErrorMsg show={showError} />
    </div>
  );
}
