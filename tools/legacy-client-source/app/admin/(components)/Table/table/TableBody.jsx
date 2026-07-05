"use client";

import { Loader2, Inbox } from "lucide-react";
import { cn } from "../utils";

// Cells
import { ChipsCell }   from "../cells/ChipsCell";
import { StatusCell }  from "../cells/StatusCell";
import { TextCell }    from "../cells/TextCell";
import { LinkCell }    from "../cells/LinkCell";
import { ToggleCell }  from "../cells/ToggleCell";
import { AvatarCell }  from "../cells/AvatarCell";
import { ActionsCell } from "../cells/ActionsCell";
import { formatCellValue } from "../formatDisplayValue";

/**
 * renderCell
 * Dispatches to the correct cell component based on col.type,
 * or calls col.render() for custom cells.
 */
export function renderCell(col, row, index, page, limit) {
  const value = row[col.dataKey];

  if (col.render) return col.render(value, row, index);

  switch (col.type) {
    case "serial":  return <TextCell value={(page - 1) * limit + index + 1} />;
    case "status":  return <StatusCell value={value} statusMap={col.statusMap} />;
    case "avatar":  return <AvatarCell value={value} row={row} />;
    case "actions": return <ActionsCell row={row} actions={col.actions} />;
    case "toggle":  return <ToggleCell value={value} row={row} colDef={col} />;
    case "chips":   return <ChipsCell value={value} />;
    case "link":    return <LinkCell value={value} />;
    case "time":    return <TextCell value={formatCellValue(value, col) ?? value ?? "—"} />;
    case "datetime": return <TextCell value={formatCellValue(value, col) ?? value ?? "—"} />;
    case "date":    return <TextCell value={formatCellValue(value, col) ?? value ?? "—"} />;
    case "text":    return <TextCell value={value} />;
    default: {
      const formatted = formatCellValue(value, col);
      if (formatted != null) return <TextCell value={formatted} />;
      return value ?? "—";
    }
  }
}

/**
 * TableBody
 * Renders loading spinner, empty state, or data rows.
 *
 * @prop {Array}   columns
 * @prop {Array}   rows
 * @prop {boolean} loading
 * @prop {string}  emptyMessage
 * @prop {number}  page
 * @prop {number}  limit
 * @prop {string}  rowKey        - Row identity field name
 */
export function TableBody({ 
  columns, 
  rows, 
  loading, 
  emptyMessage, 
  page, 
  limit, 
  rowKey,
  enableSelection = true,
  selectedIds = [],
  isRowSelected,
  toggleRow
}) {
  if (loading) {
    return (
      <tr className="bg-[#ffffff]">
        <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="py-24 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#94a3b8]" />
        </td>
      </tr>
    );
  }

  if (!rows.length) {
    return (
      <tr className="bg-[#ffffff]">
        <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="py-24 text-center">
          <div className="flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-[#e2e8f0]" />
            <p className="text-[#94a3b8] text-[13px]">{emptyMessage}</p>
          </div>
        </td>
      </tr>
    );
  }

  return rows.map((row, ri) => {
    const id = row[rowKey];
    const isSelected = isRowSelected
      ? isRowSelected(id)
      : selectedIds.some((selectedId) => String(selectedId) === String(id));

    return (
      <tr
        key={id ?? ri}
        className={cn(
          "group transition-all",
          isSelected ? "bg-[#f8fafc]/100" : "hover:bg-[#f8fafc]/80"
        )}
      >
        {enableSelection && (
          <td className="pl-6 pr-0 w-10 py-4 border-b border-[#f1f5f9]">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleRow?.(id)}
              className="w-4 h-4 rounded border-[#cbd5e1] text-[#334155] focus:ring-[#0f172a] cursor-pointer accent-[#0f172a]"
            />
          </td>
        )}
        {columns.map((col, ci) => {
          const align = col.align || (["status", "actions"].includes(col.type) ? "center" : "left");
          const isFit = ["status", "actions"].includes(col.type);

          return (
            <td
              key={ci}
              className={cn(
                "px-3 py-4 text-[13px] text-[#475569] transition-all border-b border-[#f1f5f9]",
                align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
                isFit && "whitespace-nowrap w-px",
                col.type === "actions" && "overflow-visible relative z-20",
                ci === 0 && !enableSelection && "text-[#0f172a] font-medium"
              )}
            >
              <div className={cn(
                "flex items-center w-full min-w-0",
                align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"
              )}>
                <div
                  className={cn(
                    "w-full min-w-0",
                    col.type === "actions" ? "overflow-visible" : "truncate",
                    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {renderCell(col, row, ri, page, limit)}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    );
  });
}
