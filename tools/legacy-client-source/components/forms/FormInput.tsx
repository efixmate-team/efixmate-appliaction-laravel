/** @format */
import React from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon; // âœ… Make optional
  rightElement?: React.ReactNode;
  error?: string;
  type?: string; // ensure optional typing
}

export default function FormInput({
  label,
  icon: Icon,
  rightElement,
  disabled,
  type = "text", // âœ… default type
  maxLength = 255,
  error,
  ...props
}: InputProps): React.ReactElement {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const getInputType = () => {
    if (type === "password") return showPassword ? "text" : "password";
    if (type === "year") return "number";
    if (type === "date") return "date";
    if (type === "month") return "month";
    if (type === "time") return "time";
    return type;
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-wider text-[#433333]">
          {label}
        </label>
        {rightElement}
      </div>

      <div className="relative">
        {/* âœ… Only render icon if provided */}
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
        )}

        <input
          {...props}
          disabled={disabled}
          type={getInputType()}
          maxLength={type === "year" ? 4 : maxLength}
          min={type === "year" ? 1900 : props.min}
          max={type === "year" ? 2100 : props.max}
          inputMode={type === "tel" ? "numeric" : undefined}
          pattern={type === "tel" ? "[0-9]*" : undefined}
          onChange={(e) => {
            let value = e.target.value;

            if (type === "tel") {
              value = value.replace(/\D/g, "");
            }

            if (type === "year") {
              value = value.replace(/\D/g, "").slice(0, 4);
            }

            e.target.value = value;
            props.onChange?.(e);
          }}
          className={`h-12 w-full rounded-xl border bg-[#ffffff] ${
            Icon ? "pl-10" : "pl-4"
          } ${type === "password" ? "pr-10" : "pr-4"}  text-[13px] 
            transition-all outline-none focus:ring-0
            dark:bg-[#18181b]
            disabled:opacity-60
            ${
              error
                ? "border-[#fef2f2] focus:ring-[#fef2f2] dark:border-[#fef2f2]"
                : "border-[#e4e4e7] focus:ring-[#18181b] dark:border-[#27272a] dark:focus:ring-[#d4d4d8]"
            }`}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#52525b] dark:hover:text-[#e4e4e7]"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[#7b5757] mt-1">{error}</p>}
    </div>
  );
}