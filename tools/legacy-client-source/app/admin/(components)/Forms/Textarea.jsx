'use client';

import { useState } from "react";
import { cn, BASE_INPUT, borderState, Label, ErrorMsg } from "./formUtils";

export default function Textarea({
  title, placeholder, disabled = false, readonly = false,
  required = false, value, onChange, name, id, className,
  rows = 4, maxLength,
}) {
  const [touched, setTouched] = useState(false);
  const showError = touched && required && !value;
  const showValid = touched && !showError && Boolean(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label title={title} required={required} htmlFor={id ?? name} />
      <div className="relative">
        <textarea
          id={id ?? name}
          name={name}
          placeholder={placeholder}
          value={value ?? ""}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          className={cn(
            BASE_INPUT, "resize-none p-3 leading-relaxed",
            borderState(showError, showValid),
            disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            readonly  && "cursor-default bg-[#f8fafc] text-[#53697e]0",
          )}
        />
        {maxLength && (
          <span className="absolute bottom-2 right-3 text-[11px] text-[#94a3b8]">
            {(value ?? "").length}/{maxLength}
          </span>
        )}
      </div>
      <ErrorMsg show={showError} />
    </div>
  );
}
