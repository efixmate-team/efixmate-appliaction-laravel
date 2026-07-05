"use client";

import { cn } from "../utils";

/**
 * ToolbarButton
 * Icon-only or icon + label button for the table toolbar.
 *
 * @prop {React.ElementType} icon
 * @prop {function} [onClick]
 * @prop {string}   [label]     - Text label shown beside the icon
 * @prop {string}   [tooltip]   - Native title tooltip
 * @prop {boolean}  [active]    - Highlights the button when true
 */
export function ToolbarButton({ icon: Icon, onClick, label, tooltip, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        "cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0]",
        active
          ? "text-[#0f172a] bg-[#f1f5f9] border-[#cbd5e1]"
          : "text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
      )}
    >
      <Icon className="w-4 h-4" />
      {label && <span>{label}</span>}
    </button>
  );
}
