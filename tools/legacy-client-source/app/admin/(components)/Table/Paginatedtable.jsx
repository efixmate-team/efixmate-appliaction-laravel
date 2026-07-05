"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, Filter, Download, RefreshCw, X, BadgeAlert } from "lucide-react";
import Modal from "@/components/modals/Modal";
import { useMenuPermissions, usePermission } from "@/hooks/usePermission";

// Context / Settings
import { useSettings } from "@/providers/SettingsProvider";

// Shared modular components
import { cn } from "./utils";
import { TableTitle, ToolbarButton, ExportMenu } from "./toolbar";
import { FilterBar, TableHeader, TableBody, Column } from "./table";
import { Pagination } from "./pagination";

/**
 * PaginatedTable (Modular Version)
 * ─────────────────────────────────────────────────────────────────────────────
 * Backward-compatible monolithic component that delegates to modular sub-components.
 */
export default function PaginatedTable({
  children,
  showMe = true,
  data = [],
  total = 0,
  loading = false,
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  onSort,
  onSearch,
  searchValue = "",
  title,
  subtitle,
  badge,
  showSearch = false,
  showAdd = false,
  showFilter = false,
  showExport = false,
  showRefresh = false,
  exportFileName,
  onAdd,
  onExport,
  onRefresh,
  addLabel = "Add",
  rowKey = "id",
  emptyMessage = "No data found",
  searchPlaceholder = "Search records...",
  filters,
  enableSelection = true,
  onSelectionChange,
  headerActions,
}) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const canCreate = usePermission(pathname, "CREATE");
  const canEdit = usePermission(pathname, "EDIT");
  const canDelete = usePermission(pathname, "DELETE");
  const menuPermissions = useMenuPermissions(pathname);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState({ open: false, action: null });

  const isSameId = (a, b) => String(a) === String(b);
  const isValidId = (id) => id !== undefined && id !== null && id !== "";
  const isRowSelected = (id) => selectedIds.some((selectedId) => isSameId(selectedId, id));
  const clearSelection = () => setSelectedIds((prev) => (prev.length > 0 ? [] : prev));

  // Sync selection change to parent
  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Apply default limit from settings if not explicitly provided
  const actualLimit = limit || settings?.table?.rowsPerPage || 10;

  // ── Parse columns and Filters slot ──
  const columns = [];
  let filtersSlot = null;
  const childArray = Array.isArray(children) ? children.flat() : [children];
  childArray.forEach(child => {
    if (!child?.props) return;
    if (child?.type?.displayName === "Filters") {
      filtersSlot = child.props.children;
    } else {
      columns.push(child.props);
    }
  });

  const handleSort = (key) => {
    const next = sort.key === key
      ? (sort.direction === "asc" ? "desc" : sort.direction === "desc" ? null : "asc")
      : "asc";
    const nextSort = { key: next ? key : null, direction: next || null };
    clearSelection();
    setSort(nextSort);
    onSort?.(nextSort);
  };

  const toggleAll = () => {
    if (data.length === 0) return;
    const pageIds = data
      .map((row) => row[rowKey])
      .filter(isValidId);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => isRowSelected(id));

    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pageIds);
    }
  };

  const toggleRow = (id) => {
    if (!isValidId(id)) return;
    setSelectedIds((prev) =>
      prev.some((selectedId) => isSameId(selectedId, id))
        ? prev.filter((selectedId) => !isSameId(selectedId, id))
        : [...prev, id]
    );
  };

  // Find actions for batch bar
  const actionCol = columns.find(c => c.type === "actions");
  const batchActions = actionCol?.actions || [];
  const actionAllowed = (action) => {
    if (action?.permission === false) return false;
    const explicit = action?.permission || action?.requiredPermission;
    const label = String(action?.label || "").toLowerCase();
    const customPermission = String(action?.label || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const permission = explicit
      ? String(explicit).trim().toUpperCase()
      : menuPermissions.includes(customPermission)
        ? customPermission
        : label.includes("delete")
          ? "DELETE"
          : label.includes("edit") ||
            label.includes("activate") ||
            label.includes("deactivate") ||
            label.includes("verify") ||
            label.includes("approve") ||
            label.includes("refund") ||
            label.includes("confirm") ||
            label.includes("manage") ||
            label.includes("reset") ||
            label.includes("reject")
            ? "EDIT"
            : label.includes("create") || label.includes("add")
              ? "CREATE"
              : "VIEW";
    if (menuPermissions.includes("*")) return true;
    if (!["VIEW", "CREATE", "EDIT", "DELETE"].includes(permission)) {
      return menuPermissions.includes("VIEW") && menuPermissions.includes(permission);
    }
    if (permission === "CREATE") return canCreate;
    if (permission === "EDIT") return canEdit;
    if (permission === "DELETE") return canDelete;
    return true;
  };
  const permittedBatchActions = batchActions.filter(actionAllowed);
  const getBulkVerb = (label = "") => {
    const text = String(label).toLowerCase();
    if (text.includes("delete")) return "delete";
    if (text.includes("deactivate")) return "deactivate";
    if (text.includes("activate")) return "activate";
    return "run";
  };

  const searchTimer = useRef(null);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      clearSelection();
      onSearch?.(val);
    }, 400);
  };

  if (!showMe) return null;

  return (
    <>
      <div className="flex flex-col w-full bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden font-sans">
        
        {/* ── TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-[#f1f5f9]">
          <TableTitle title={title} subtitle={subtitle} badge={badge} />

          <div className="flex flex-wrap items-center gap-2">
            {showSearch && (
              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] group-focus-within:text-[#475569] transition-colors" />
                <input
                  value={localSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-1 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-3xl focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#94a3b8] transition-all"
                />
                {localSearch && (
                  <button type="button" onClick={() => { setLocalSearch(""); clearSelection(); onSearch?.(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-[#475569]">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <div className="h-8 w-[1px] bg-[#e2e8f0] mx-1 hidden sm:block" />
            {showRefresh && <ToolbarButton icon={RefreshCw} onClick={() => { clearSelection(); onRefresh?.(); }} tooltip="Refresh" />}
            {showFilter && <ToolbarButton icon={Filter} onClick={() => setShowFilters(prev => !prev)} label="Filters" active={showFilters} />}
            {showExport && (
              onExport ? (
                <ToolbarButton icon={Download} onClick={onExport} label="Export" />
              ) : (
                <ExportMenu
                  columns={columns}
                  data={data}
                  title={title}
                  fileName={exportFileName || title}
                  page={page}
                  limit={actualLimit}
                  disabled={loading}
                />
              )
            )}
            {showAdd && canCreate && <ToolbarButton icon={Plus} onClick={onAdd} label={addLabel} />}
            {headerActions}
          </div>
        </div>

        {/* ── FILTERS ── */}
        {(() => {
          const hasFilters = filtersSlot || (filters?.length > 0);
          return (
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showFilters && hasFilters ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {hasFilters && <FilterBar filters={filters}>{filtersSlot}</FilterBar>}
            </div>
          );
        })()}

        {/* ── TABLE ── */}
        <div className="relative w-full overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <TableHeader 
                columns={columns} 
                sort={sort} 
                onSort={handleSort} 
                enableSelection={enableSelection}
                isAllSelected={
                  data.length > 0 &&
                  data
                    .map((row) => row[rowKey])
                    .filter(isValidId)
                    .every((id) => isRowSelected(id))
                }
                toggleAll={toggleAll}
              />
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              <TableBody 
                columns={columns}
                rows={data}
                loading={loading}
                emptyMessage={emptyMessage}
                page={page}
                limit={actualLimit}
                rowKey={rowKey}
                enableSelection={enableSelection}
                selectedIds={selectedIds}
                isRowSelected={isRowSelected}
                toggleRow={toggleRow}
              />
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <Pagination 
          page={page}
          total={total}
          limit={actualLimit}
          onPageChange={(nextPage) => { clearSelection(); onPageChange?.(nextPage); }}
          onLimitChange={(nextLimit) => { clearSelection(); onLimitChange?.(nextLimit); }}
          limitOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* ── FLOATING BATCH BAR ── */}
      {enableSelection && selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-6 py-3 bg-[#0f172a]/90 text-[#ffffff] rounded-2xl shadow-2xl border border-[#ffffff]/10 ring-1 ring-[#000000]/20 backdrop-blur-md">
            <span className="text-[13px] font-semibold border-r border-[#ffffff]/20 pr-4 mr-1">
              {selectedIds.length} <span className="opacity-60 font-normal ml-1">selected</span>
            </span>

            {permittedBatchActions
              .filter(action => action.onBulkClick)
              .map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBulkConfirm({ open: true, action })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all hover:bg-[#ffffff]/10 active:scale-95",
                      action.variant === "danger" ? "text-[#f87171] hover:text-[#fca5a5]" : "text-[#ffffff]"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {action.label}
                  </button>
                );
              })}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="ml-2 p-1.5 rounded-full hover:bg-[#ffffff]/10 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Modal openModal={bulkConfirm.open} setOpenModal={(value) => setBulkConfirm((prev) => ({ ...prev, open: value }))}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2]0 shadow flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#ffffff]" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-center capitalize">
            {getBulkVerb(bulkConfirm.action?.label)} selected records?
          </h2>
          <p className="mt-2 text-[13px] text-[#53697e]0 text-center mx-auto">
            You are about to {getBulkVerb(bulkConfirm.action?.label)} {selectedIds.length} selected item{selectedIds.length === 1 ? "" : "s"}.
          </p>
          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={() => setBulkConfirm({ open: false, action: null })}
              className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const action = bulkConfirm.action;
                setBulkConfirm({ open: false, action: null });
                action?.onBulkClick?.(selectedIds);
              }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[#ffffff] font-semibold text-[13px]",
                bulkConfirm.action?.variant === "danger" ? "bg-[#fef2f2]0" : "bg-[#0f172a]"
              )}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Re-export Column for convenience (sentinel)
export { Column };
