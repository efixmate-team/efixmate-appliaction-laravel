'use client';

import { useState, useEffect } from "react";
import {
  Search, Mail, Lock, Eye, EyeOff, User, Phone,
  Calendar, Link, Hash, AlertCircle, CheckCircle2,
} from "lucide-react";

import { useFormContext } from "./formUtils";

// Map string icon names â†' lucide components
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

// Per-validation-type regex
const VALIDATORS = {
  text: null,                                                       // no validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{7,15}$/,
  url: /^https?:\/\/.+\..+/,
  number: /^\d+$/,
  password: /^.{8,}$/,                                                  // min 8 chars
};

const VALIDATION_MESSAGES = {
  email: "Enter a valid email address",
  phone: "Enter a valid phone number",
  url: "Enter a valid URL (https://...)",
  number: "Only numbers are allowed",
  password: "Password must be at least 8 characters",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Input({
  title,
  placeholder,
  icon,
  disabled = false,
  type = "text",
  readonly = false,
  validation = "text",    // "text" | "email" | "phone" | "url" | "number" | "password"
  value,
  onChange,
  name,
  id,
  required = false,
  className,
  errorMessage,
  ...rest
}) {
  const { submitCount } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState(errorMessage);
  const [valid, setValid] = useState(false);

  // Resolve icon component from string or component
  const IconComponent = icon
    ? (typeof icon === "string" ? ICON_MAP[icon.toLowerCase()] : icon)
    : null;

  // Actual <input> type (password stays hidden unless toggled)
  const inputType =
    type === "password"
      ? showPassword ? "text" : "password"
      : type;

  const validate = (val) => {
    if (!val && required) {
      setError("This field is required");
      setValid(false);
      return;
    }
    const regex = VALIDATORS[validation];
    if (val && regex && !regex.test(val)) {
      setError(VALIDATION_MESSAGES[validation] ?? "Invalid value");
      setValid(false);
    } else {
      setError("");
      setValid(Boolean(val));
    }
  };

  const [internalValue, setInternalValue] = useState(value ?? "");

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e) => {
    const val = e.target.value;

    if (value === undefined) {
      setInternalValue(val); // manage internally
    }

    validate(val);
    onChange?.(e);
  };

  const handleBlur = () => {
    setTouched(true);
    validate(currentValue);
  };

  const showError = touched && error;
  const showValid = touched && valid && !error;

  useEffect(() => {
    if (submitCount > 0) {
      setTouched(true);       // ðŸ"¥ force validation
      validate(currentValue); // ðŸ"¥ run validation
    }
  }, [submitCount]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>

      {/* Label */}
      {title && (
        <label
          htmlFor={id ?? name}
          className="text-[13px] font-semibold text-[#334155]"
        >
          {title}
          {required && <span className="ml-0.5 text-[#7b5757]0">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">

        {/* Leading icon */}
        {IconComponent && (
          <IconComponent className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
        )}

        <input
          id={id ?? name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          {...rest}
          className={cn(
            // base
            "w-full h-8 text-[13px] rounded-lg border border-[#f1f5f9] bg-[#ffffff] text-[#1e293b]",
            "placeholder-[#94a3b8] transition-all outline-none",
            // padding - left depends on icon, right depends on password/validation icons
            IconComponent ? "pl-9" : "pl-3",
            (type === "password" || showError || showValid) ? "pr-9" : "pr-3",
            // border states
            showError
              ? "border-[#fca5a5] ring-2 ring-[#fee2e2] focus:border-[#f87171] focus:ring-[#fee2e2]"
              : showValid
                ? "border-[#6ee7b7] ring-2 ring-[#d1fae5] focus:border-[#34d399]"
                : "border-[#e2e8f0] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#0f172a]/5",
            // disabled / readonly
            disabled && "opacity-50 cursor-not-allowed bg-[#f8fafc]",
            readonly && "cursor-default bg-[#f8fafc] text-[#53697e]0",
          )}
        />

        {/* Trailing - password toggle OR validation icon */}
        {type === "password" ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-2.5 text-[#94a3b8] hover:text-[#475569] transition-colors"
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />}
          </button>
        ) : showError ? (
          <AlertCircle className="absolute right-2.5 w-4 h-4 text-[#f87171] pointer-events-none" />
        ) : showValid ? (
          <CheckCircle2 className="absolute right-2.5 w-4 h-4 text-[#34d399] pointer-events-none" />
        ) : null}

      </div>

      {/* Error message */}
      {showError && (
        <p className="text-[11px] text-[#7b5757]0 leading-tight">{error}</p>
      )}

    </div>
  );
}
