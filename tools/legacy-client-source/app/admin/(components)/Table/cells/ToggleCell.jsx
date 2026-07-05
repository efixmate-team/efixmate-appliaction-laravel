"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "../utils";

/**
 * ToggleCell
 * Inline toggle / switch for table rows.
 *
 * @prop {boolean}        value   - Current checked state
 * @prop {object}         row     - Full row data object
 * @prop {object}         colDef  - Column definition (from <Column /> props)
 *   @prop {boolean|fn}  colDef.disabled  - Disable the toggle (or fn(row) => boolean)
 *   @prop {fn}          colDef.onToggle  - Called with (checked, row) on change
 */
export function ToggleCell({ value, row, colDef }) {
  const pathname = usePathname();
  const canEdit = usePermission(pathname, colDef?.permission || "EDIT");
  const [checked, setChecked] = useState(Boolean(value));
  useEffect(() => setChecked(Boolean(value)), [value]);

  const disabled =
    !canEdit ||
    colDef?.disabled === true ||
    (typeof colDef?.disabled === "function" && colDef.disabled(row));

  const handleClick = () => {
    if (disabled) return;
    const next = !checked;
    setChecked(next);
    colDef?.onToggle?.(next, row);
  };

  if (!canEdit && colDef?.hideWhenUnauthorized !== false) return null;

  return (
    <label className={cn(
      "inline-flex items-center gap-2 cursor-pointer select-none",
      disabled && "opacity-40 cursor-not-allowed"
    )}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative w-8 h-[18px] rounded-full transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#e2e8f0]",
          checked ? "bg-[#334155]" : "bg-[#e2e8f0]",
          disabled && "pointer-events-none"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200",
          checked ? "translate-x-3.5" : "translate-x-0"
        )} />
      </button>
    </label>
  );
}
