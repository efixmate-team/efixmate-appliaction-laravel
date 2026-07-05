"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminAPI } from "@/lib/api";
import {
  groupedPermissions as buildGroupedPermissions,
  hasPermission,
  hasPermissionGroup,
  isPermissionGroupDenied,
  type PermissionCategory,
} from "@/src/shared/constants/permissions";

export type AdminMenuRow = {
  menu_id: number;
  menu_name: string;
  menu_path: string;
  menu_icon: string;
  menu_type: "P" | "C" | "I";
  menu_parent_id?: number | null;
  permissions?: string[];
  [key: string]: unknown;
};

export type AdminMenuGroup = {
  menu_group_id: number;
  menu_group: string;
  menus: AdminMenuRow[];
};

type AdminPermissionContextValue = {
  loading: boolean;
  groups: AdminMenuGroup[];
  permissionsByPath: Record<string, string[]>;
  permissions: string[];
  deniedPermissions: string[];
  groupedPermissions: Record<PermissionCategory, string[]>;
  groupedDeniedPermissions: Record<PermissionCategory, string[]>;
  privileges: string[];
  deniedPrivileges: string[];
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasPermissionGroup: (group: string) => boolean;
  refetch: () => Promise<void>;
};

const AdminPermissionContext = createContext<AdminPermissionContextValue | null>(null);

export function AdminPermissionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AdminMenuGroup[]>([]);
  const [permissionsByPath, setPermissionsByPath] = useState<Record<string, string[]>>({});
  const [permissions, setPermissions] = useState<string[]>([]);
  const [deniedPermissions, setDeniedPermissions] = useState<string[]>([]);
  const [serverGroupedPermissions, setServerGroupedPermissions] = useState<
    Record<PermissionCategory, string[]> | null
  >(null);
  const [serverGroupedDeniedPermissions, setServerGroupedDeniedPermissions] = useState<
    Record<PermissionCategory, string[]> | null
  >(null);
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [deniedPrivileges, setDeniedPrivileges] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getMenus();
      if (res.status) {
        setGroups((res.group ?? []) as AdminMenuGroup[]);
        setPermissionsByPath((res.permissionsByPath ?? {}) as Record<string, string[]>);
        const nextPermissions = (res.permissions ?? res.privileges ?? []) as string[];
        const nextDeniedPermissions = (res.deniedPermissions ?? res.deniedPrivileges ?? []) as string[];
        setPermissions(nextPermissions);
        setDeniedPermissions(nextDeniedPermissions);
        setServerGroupedPermissions(
          (res.groupedPermissions as Record<PermissionCategory, string[]> | undefined) ??
            buildGroupedPermissions(nextPermissions)
        );
        setServerGroupedDeniedPermissions(
          (res.groupedDeniedPermissions as Record<PermissionCategory, string[]> | undefined) ??
            buildGroupedPermissions(nextDeniedPermissions)
        );
        setPrivileges((res.privileges ?? []) as string[]);
        setDeniedPrivileges((res.deniedPrivileges ?? []) as string[]);
        setIsSuperAdmin(Boolean(res.isSuperAdmin));
      }
    } catch {
      setGroups([]);
      setPermissionsByPath({});
      setPermissions([]);
      setDeniedPermissions([]);
      setServerGroupedPermissions(null);
      setServerGroupedDeniedPermissions(null);
      setPrivileges([]);
      setDeniedPrivileges([]);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const groupedPermissions = useMemo(
    () => serverGroupedPermissions ?? buildGroupedPermissions(permissions),
    [serverGroupedPermissions, permissions]
  );

  const groupedDeniedPermissions = useMemo(
    () => serverGroupedDeniedPermissions ?? buildGroupedPermissions(deniedPermissions),
    [serverGroupedDeniedPermissions, deniedPermissions]
  );

  const canUsePermission = useCallback(
    (permission: string) => isSuperAdmin || hasPermission(permissions, permission, deniedPermissions),
    [permissions, deniedPermissions, isSuperAdmin]
  );

  const canUsePermissionGroup = useCallback(
    (group: string) =>
      isSuperAdmin ||
      (!isPermissionGroupDenied(deniedPermissions, group) && hasPermissionGroup(permissions, group)),
    [permissions, deniedPermissions, isSuperAdmin]
  );

  const value = useMemo(
    () => ({
      loading,
      groups,
      permissionsByPath,
      permissions,
      deniedPermissions,
      groupedPermissions,
      groupedDeniedPermissions,
      privileges,
      deniedPrivileges,
      isSuperAdmin,
      hasPermission: canUsePermission,
      hasPermissionGroup: canUsePermissionGroup,
      refetch,
    }),
    [
      loading,
      groups,
      permissionsByPath,
      permissions,
      deniedPermissions,
      groupedPermissions,
      groupedDeniedPermissions,
      privileges,
      deniedPrivileges,
      isSuperAdmin,
      canUsePermission,
      canUsePermissionGroup,
      refetch,
    ]
  );

  return (
    <AdminPermissionContext.Provider value={value}>{children}</AdminPermissionContext.Provider>
  );
}

export function useAdminPermissionContext() {
  const ctx = useContext(AdminPermissionContext);
  if (!ctx) {
    throw new Error("useAdminPermissionContext must be used within AdminPermissionProvider");
  }
  return ctx;
}
