// ─────────────────────────────────────────────────────────────────────────────
//  PaginatedTable — Public API
//
//  Single import point. Pick only what you need:
//
//    import PaginatedTable, {
//      Column, Toolbar, Filters,
//      Pagination,
//      TableTitle, ToolbarButton,
//      SearchFilter, DropdownFilter, DateFilter, DateRangeFilter, ToggleFilter,
//      ChipsCell, StatusCell, TextCell, LinkCell, ToggleCell, AvatarCell, ActionsCell,
//      STATUS_THEMES,
//    } from "@/components/PaginatedTable";
// ─────────────────────────────────────────────────────────────────────────────

// Main component (default)
export { default } from "./Paginatedtable";

// Slot sentinels
export { Column }  from "./table/Column";
export { Filters } from "./table/Filters";
export { Toolbar } from "./toolbar/Toolbar";

// Pagination
export { Pagination } from "./pagination/Pagination";

// Toolbar
export { ToolbarButton } from "./toolbar/ToolbarButton";
export { TableTitle }    from "./toolbar/TableTitle";

// Filters
export { SearchFilter }                  from "./filters/SearchFilter";
export { DropdownFilter }                from "./filters/DropdownFilter";
export { DateFilter, DateRangeFilter }   from "./filters/DateFilter";
export { ToggleFilter }                  from "./filters/ToggleFilter";

// Cells
export { ChipsCell }   from "./cells/ChipsCell";
export { StatusCell, STATUS_THEMES } from "./cells/StatusCell";
export { TextCell }    from "./cells/TextCell";
export { LinkCell }    from "./cells/LinkCell";
export { ToggleCell }  from "./cells/ToggleCell";
export { AvatarCell }  from "./cells/AvatarCell";
export { ActionsCell } from "./cells/ActionsCell";

// Utilities
export { cn } from "./utils";
