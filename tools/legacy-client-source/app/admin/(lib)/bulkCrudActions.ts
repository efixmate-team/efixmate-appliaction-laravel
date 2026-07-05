import type { LucideIcon } from "lucide-react";
import { Edit2, Check, X, Trash2 } from "lucide-react";

/**
 * Table action shape used by `Column` (type "actions") and the floating bulk bar in `PaginatedTable`.
 * Bulk operations are confirmed in `PaginatedTable` before `onBulkClick` runs.
 */
export type CrudTableAction = {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "danger";
  /** RBAC privilege name for custom actions, e.g. "APPROVE", "REJECT", "ASSIGN". */
  permission?: string | false;
  requiredPermission?: string;
  onClick: (row: any) => void;
  onBulkClick?: (ids: any[]) => void | Promise<void>;
};

/**
 * Standard Edit + Activate + Deactivate [+ optional Delete] column actions, each with `onBulkClick`
 * for the floating selection bar.
 */
export function buildBulkCrudActions(config: {
  /** Defaults to "Edit" (e.g. use "View/Edit" on read-heavy tables). */
  editLabel?: string;
  onEdit: (row: any) => void;
  onActivateRow: (row: any) => void;
  onDeactivateRow: (row: any) => void;
  onBulkActivate: (ids: any[]) => void | Promise<void>;
  onBulkDeactivate: (ids: any[]) => void | Promise<void>;
  onDeleteRow?: (row: any) => void;
  onBulkDelete?: (ids: any[]) => void | Promise<void>;
  extra?: CrudTableAction[];
}): CrudTableAction[] {
  const {
    editLabel = "Edit",
    onEdit,
    onActivateRow,
    onDeactivateRow,
    onBulkActivate,
    onBulkDeactivate,
    onDeleteRow,
    onBulkDelete,
    extra = [],
  } = config;

  const base: CrudTableAction[] = [
    { label: editLabel, icon: Edit2, onClick: onEdit },
    {
      label: "Activate",
      icon: Check,
      onClick: onActivateRow,
      onBulkClick: onBulkActivate,
    },
    {
      label: "Deactivate",
      icon: X,
      onClick: onDeactivateRow,
      onBulkClick: onBulkDeactivate,
    },
  ];

  if (onDeleteRow && onBulkDelete) {
    base.push({
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onClick: onDeleteRow,
      onBulkClick: onBulkDelete,
    });
  }

  return [...base, ...extra];
}

type BulkResultCallbacks = { onSuccess: () => void; onError: () => void };

/**
 * Shared bulk activate / deactivate for APIs shaped like
 * `patch(id, { is_active: true | false })` (lookups, masters, many CRUD tables).
 */
export function makeIsActiveBulkHandlers(
  patch: (id: any, data: { is_active: boolean }) => Promise<unknown>,
  { onSuccess, onError }: BulkResultCallbacks
) {
  const handleBulkActivate = async (ids: any[]) => {
    try {
      await Promise.all(ids.map((id) => patch(id, { is_active: true })));
      onSuccess();
    } catch {
      onError();
    }
  };
  const handleBulkDeactivate = async (ids: any[]) => {
    try {
      await Promise.all(ids.map((id) => patch(id, { is_active: false })));
      onSuccess();
    } catch {
      onError();
    }
  };
  return { handleBulkActivate, handleBulkDeactivate };
}

/**
 * Row actions for tables with no "Edit" column — only activate / deactivate (e.g. Technicians list).
 */
export function buildToggleOnlyRowActions(config: {
  onActivateRow: (row: any) => void;
  onDeactivateRow: (row: any) => void;
  onBulkActivate: (ids: any[]) => void | Promise<void>;
  onBulkDeactivate: (ids: any[]) => void | Promise<void>;
}): CrudTableAction[] {
  return [
    {
      label: "Activate",
      icon: Check,
      onClick: config.onActivateRow,
      onBulkClick: config.onBulkActivate,
    },
    {
      label: "Deactivate",
      icon: X,
      onClick: config.onDeactivateRow,
      onBulkClick: config.onBulkDeactivate,
    },
  ];
}
