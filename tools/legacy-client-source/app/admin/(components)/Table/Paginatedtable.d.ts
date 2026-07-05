import { ReactNode } from "react";

// ── Slot sentinels ──────────────────────────────────────────────────────────
export declare function Filters(props: { children?: ReactNode }): JSX.Element;

// ── Filter bar components ───────────────────────────────────────────────────
export interface DropdownFilterOption { value: string | number; label: string; }
export declare function DropdownFilter(props: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options?: DropdownFilterOption[];
}): JSX.Element;

export declare function DateFilter(props: {
  value?: string;
  onChange?: (value: string) => void;
}): JSX.Element;

export declare function DateRangeFilter(props: {
  fromValue?: string;
  toValue?: string;
  onFromChange?: (value: string) => void;
  onToChange?: (value: string) => void;
}): JSX.Element;

export declare function ToggleFilter(props: {
  value?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
}): JSX.Element;

// ── Column ──────────────────────────────────────────────────────────────────
export interface ColumnProps {
  header?: string;
  dataKey?: string;
  sortable?: boolean;
  type?: "serial" | "status" | "avatar" | "actions" | "toggle" | "chips" | "link" | "text" | "time" | "datetime" | "date";
  render?: (value: any, row: any, index: number) => ReactNode;
  onToggle?: (newValue: boolean, row: any) => void;
  actions?: Array<{
    label?: string;
    icon?: any;
    onClick?: (row: any) => void;
    onBulkClick?: (ids: any[]) => void;
    variant?: "default" | "danger";
  }>;
  align?: "left" | "center" | "right";
  width?: string;
  disabled?: boolean | ((row: any) => boolean);
  statusMap?: Record<string, any>;
}

export declare function Column(props: ColumnProps): null;

export interface FilterConfig {
  type: "search" | "dropdown" | "date" | "daterange" | "toggle";
  label?: string;
  placeholder?: string;
  value?: any;
  fromValue?: any;
  toValue?: any;
  options?: Array<{ label: string; value: string | number }>;
  onChange?: (value: any) => void;
  onFromChange?: (value: any) => void;
  onToChange?: (value: any) => void;
}

export interface PaginatedTableProps {
  children?: ReactNode;
  showMe?: boolean;
  data?: any[];
  total?: number;
  loading?: boolean;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (sort: { key: string | null; direction: string | null }) => void;
  onSearch?: (value: string) => void;
  searchValue?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  showSearch?: boolean;
  showAdd?: boolean;
  showFilter?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  /** Base filename for built-in Excel/PDF export (defaults to `title`) */
  exportFileName?: string;
  onAdd?: () => void;
  onFilter?: () => void;
  /** Custom export handler; when omitted, built-in Excel/PDF menu is used */
  onExport?: () => void;
  onRefresh?: () => void;
  addLabel?: string;
  rowKey?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  enableSelection?: boolean;
  onSelectionChange?: (selectedIds: any[]) => void;
  headerActions?: ReactNode;
}

declare const PaginatedTable: (props: PaginatedTableProps) => JSX.Element;
export default PaginatedTable;
