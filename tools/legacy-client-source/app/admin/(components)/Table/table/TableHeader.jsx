"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "../utils";

/**
 * TableHeader
 * Renders the <thead><tr> with sort indicators.
 *
 * @prop {Array}    columns  - Parsed column prop objects
 * @prop {{ key, direction }} sort
 * @prop {function} onSort(dataKey: string)
 */
export function TableHeader({ 
  columns, 
  sort, 
  onSort,
  enableSelection = true,
  isAllSelected = false,
  toggleAll
}) {
  return (
    <tr className="bg-[#f8fafc]/50">
      {enableSelection && (
        <th className="pl-6 pr-0 w-10 py-3.5 border-b border-[#cbd5e1]">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-[#cbd5e1] text-[#334155] focus:ring-[#0f172a] cursor-pointer accent-[#0f172a]"
          />
        </th>
      )}
        {columns.map((col, i) => {
          const align = col.align || (["status", "actions"].includes(col.type) ? "center" : "left");
          const isFit = ["status", "actions"].includes(col.type);

          return (
            <th
              key={col.dataKey || i}
              onClick={col.sortable ? () => onSort(col.dataKey) : undefined}
              className={cn(
                "px-3 py-3.5 text-[11px] font-semibold text-[#53697e]0 tracking-widest border-b border-[#cbd5e1] select-none transition-colors",
                align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
                isFit && "whitespace-nowrap w-px",
                col.sortable && "hover:bg-[#f1f5f9]/50 cursor-pointer",
                col.width
              )}
            >
              <div className={cn(
                "flex items-center gap-2 w-full min-w-0",
                align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"
              )}>
                <span className="truncate">{col.header}</span>
                {col.sortable && (
                  <span className="shrink-0">
                    {sort.key === col.dataKey
                      ? sort.direction === "asc"
                        ? <ChevronUp className="w-3 h-3 text-[#0f172a]" />
                        : <ChevronDown className="w-3 h-3 text-[#0f172a]" />
                      : <ChevronsUpDown className="w-3 h-3 text-[#cbd5e1]" />}
                  </span>
                )}
              </div>
            </th>
          );
        })}
    </tr>
  );
}
