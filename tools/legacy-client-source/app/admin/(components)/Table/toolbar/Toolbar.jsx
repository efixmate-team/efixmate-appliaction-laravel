"use client";

/**
 * Toolbar
 * Slot component — place inside <PaginatedTable> to inject custom
 * toolbar content (buttons, etc.) on the right side of the header bar.
 *
 * @example
 *   <PaginatedTable ...>
 *     <Toolbar>
 *       <ToolbarButton icon={Download} label="Export" onClick={handleExport} />
 *     </Toolbar>
 *   </PaginatedTable>
 */
export function Toolbar({ children }) {
  return <>{children}</>;
}
Toolbar.displayName = "Toolbar";
