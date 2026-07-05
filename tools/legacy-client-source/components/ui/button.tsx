import * as React from "react";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8] border-transparent",
  secondary: "bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0] border-transparent",
  outline: "bg-[#ffffff] text-[#334155] hover:bg-[#f8fafc] border-[#e2e8f0]",
  ghost: "bg-transparent text-[#475569] hover:bg-[#f1f5f9] border-transparent",
  destructive: "bg-[#dc2626] text-[#ffffff] hover:bg-[#b91c1c] border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className = "",
  variant = "default",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
