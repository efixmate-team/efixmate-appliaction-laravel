"use client";

import { useMemo } from "react";
import { useAdminPermissionContext } from "@/providers/AdminPermissionProvider";
import {
  hasPermission,
  hasPermissionGroup,
  isPermissionGroupDenied,
  permissionForPathAction,
} from "@/src/shared/constants/permissions";

export function usePermission(pathOrPermission: string, action?: string): boolean {
  const { permissions, deniedPermissions, isSuperAdmin } = useAdminPermissionContext();

  return useMemo(() => {
    if (isSuperAdmin) return true;
    const required = action
      ? permissionForPathAction(pathOrPermission, action)
      : String(pathOrPermission || "").trim().toUpperCase();
    if (!required) return true;
    return hasPermission(permissions, required, deniedPermissions);
  }, [permissions, deniedPermissions, isSuperAdmin, pathOrPermission, action]);
}

export function usePermissionGroup(group: string): boolean {
  const { permissions, deniedPermissions, isSuperAdmin } = useAdminPermissionContext();

  return useMemo(() => {
    if (isSuperAdmin) return true;
    return !isPermissionGroupDenied(deniedPermissions, group) && hasPermissionGroup(permissions, group);
  }, [permissions, deniedPermissions, isSuperAdmin, group]);
}

export function useMenuPermissions(menuPath: string): string[] {
  const { permissions, deniedPermissions, isSuperAdmin } = useAdminPermissionContext();

  return useMemo(() => {
    if (isSuperAdmin) return ["*"];
    const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "VERIFY", "REFUND", "CONFIRM", "ASSIGN"];
    return actions.filter((action) => {
      const required = permissionForPathAction(menuPath, action);
      if (!required) return false;
      return hasPermission(permissions, required, deniedPermissions);
    });
  }, [permissions, deniedPermissions, isSuperAdmin, menuPath]);
}

export function usePrivilegeNames(): string[] {
  const { permissions } = useAdminPermissionContext();
  return permissions;
}
