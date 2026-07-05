"use client";

/**
 * Filters
 * Slot component — place inside <PaginatedTable> to inject a custom filter bar.
 * The bar is shown/hidden when the "Filters" toolbar button is clicked.
 *
 * @example
 *   <PaginatedTable ...>
 *     <Filters>
 *       <SearchFilter value={q} onChange={setQ} />
 *       <DropdownFilter value={status} onChange={setStatus} options={[...]} />
 *     </Filters>
 *   </PaginatedTable>
 */
export function Filters({ children }) {
  return <>{children}</>;
}
Filters.displayName = "Filters";
