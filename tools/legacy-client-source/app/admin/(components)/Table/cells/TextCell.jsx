"use client";

/**
 * TextCell
 * Plain text fallback cell.
 *
 * @prop {any} value - Displayed as-is; renders "—" when null/undefined
 */
export function TextCell({ value }) {
  if (!value) return <span className="text-[13px] text-[#53697e]0">—</span>;
  
  return (
    <div className="relative group/tooltip inline-block max-w-full">
      <span className="text-[13px] text-[#475569] truncate block text-ellipsis overflow-hidden whitespace-nowrap">
        {value}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-[#0f172a] text-[#ffffff] text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-[100] pointer-events-none border border-[#334155] font-medium ">
        {value}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
