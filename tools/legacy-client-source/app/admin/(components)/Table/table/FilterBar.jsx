"use client";

// Legacy filter descriptor imports
import { SearchFilter }                from "../filters/SearchFilter";
import { DropdownFilter }              from "../filters/DropdownFilter";
import { DateFilter, DateRangeFilter } from "../filters/DateFilter";
import { ToggleFilter }                from "../filters/ToggleFilter";

/**
 * FilterBar
 * Internal wrapper that accepts either:
 *   - children  (component-based mode, preferred)
 *   - filters   (legacy descriptor-object array, backward-compatible)
 *
 * Not exported from the public index — consumed only by PaginatedTable.
 */
export function FilterBar({ filters, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b border-[#f1f5f9]">
      {/* Component children mode */}
      {children}

      {/* Legacy descriptor mode */}
      {!children && filters?.map((f, i) => {
        switch (f.type) {
          case "search":    return <SearchFilter    key={i} {...f} />;
          case "dropdown":  return <DropdownFilter  key={i} {...f} />;
          case "date":      return <DateFilter      key={i} {...f} />;
          case "daterange": return <DateRangeFilter key={i} {...f} />;
          case "toggle":    return <ToggleFilter    key={i} {...f} />;
          default:          return null;
        }
      })}
    </div>
  );
}
