"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils";

/**
 * Pagination
 * Standalone pagination bar — can be used inside <PaginatedTable>
 * or completely on its own.
 *
 * @prop {number}   page             - Current page (1-based)
 * @prop {number}   total            - Total record count
 * @prop {number}   limit            - Records per page
 * @prop {function} onPageChange(page: number)
 * @prop {function} onLimitChange(limit: number)
 * @prop {number[]} [limitOptions=[10, 20, 50]]
 */
export function Pagination({
  page = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc]/50 border-t border-[#f1f5f9]">
      {/* Left: record count + rows-per-page */}
      <div className="flex items-center gap-4">
        <p className="text-xs text-[#53697e]0">
          Showing{" "}
          <span className="text-[#0f172a]">{from}</span> to{" "}
          <span className="text-[#0f172a]">{to}</span> of {total}
        </p>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className="bg-transparent text-xs font-bold text-[#334155] focus:outline-none cursor-pointer hover:text-[#0f172a]"
        >
          {limitOptions.map((v) => (
            <option key={v} value={v}>{v} / page</option>
          ))}
        </select>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        <PagBtn
          onClick={() => onPageChange?.(1)}
          disabled={Number(page) === 1}
          title="First page"
        >
          <ChevronLeft className="w-3 h-3" />
          <ChevronLeft className="w-3 h-3 -ml-2" />
        </PagBtn>

        <PagBtn
          onClick={() => onPageChange?.(Number(page) - 1)}
          disabled={Number(page) === 1}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </PagBtn>

        <div className="flex items-center px-2 text-xs font-bold text-[#334155]">
          {page}
          <span className="mx-2 text-[#cbd5e1] font-normal">of</span>
          {totalPages}
        </div>

        <PagBtn
          onClick={() => onPageChange?.(Number(page) + 1)}
          disabled={Number(page) === Number(totalPages)}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </PagBtn>

        <PagBtn
          onClick={() => onPageChange?.(totalPages)}
          disabled={Number(page) === Number(totalPages)}
          title="Last page"
        >
          <ChevronRight className="w-3 h-3" />
          <ChevronRight className="w-3 h-3 -ml-2" />
        </PagBtn>
      </div>
    </div>
  );
}

// ─── Private helper ───────────────────────────────────────────────────────────

function PagBtn({ children, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center p-2 rounded-lg text-[#53697e]0 hover:bg-[#e2e8f0] hover:text-[#0f172a] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
    >
      {children}
    </button>
  );
}
