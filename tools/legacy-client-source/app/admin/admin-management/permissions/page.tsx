"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck, PlusCircle, Loader2, Plus, Pencil, Trash2,
  ChevronRight, KeyRound, LayoutGrid, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminAPI } from "@/lib/api";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import { groupMenusLikeSidebar, type SidebarMenuRow } from "@/app/admin/(lib)/menuSidebarOrder";
import {
  PERMISSION_CATEGORY_LABELS,
  SYSTEM_MANAGEMENT_PERMISSIONS,
  normalizePermission,
  permissionGroupFor,
  permissionForPathAction,
  type PermissionCategory,
} from "@/src/shared/constants/permissions";
import { useAdminPermissionContext } from "@/providers/AdminPermissionProvider";

type TabType = "assign" | "create";

type PrivilegeRow = {
  privilege_id: number;
  privilege_name: string;
  is_assigned?: boolean;
  is_allowed?: boolean;
  is_denied?: boolean;
  is_active?: boolean;
  menu_id?: number;
  category?: PermissionCategory | null;
};

type RoleOption = { id: number | string; label: string };
type RolePermissionRow = SidebarMenuRow & { privileges?: PrivilegeRow[] };

function errorMessageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getPrivilegeCategory(menuPath: string, privilegeName: string): PermissionCategory | null {
  const directCategory = permissionGroupFor(privilegeName);
  if (directCategory) return directCategory;
  const translated = permissionForPathAction(menuPath, privilegeName);
  return translated ? permissionGroupFor(translated) : null;
}

// ── Privilege toggle (Allow / Deny) ──────────────────────────────────────────

function PrivilegeToggle({
  label,
  allowed,
  denied,
  disabled,
  isSystem,
  onToggleAllow,
  onToggleDeny,
}: {
  label: string;
  allowed: boolean;
  denied: boolean;
  disabled?: boolean;
  isSystem?: boolean;
  onToggleAllow: () => void;
  onToggleDeny: () => void;
}) {
  return (
    <div className={cn(
      "inline-flex items-stretch rounded-lg border overflow-hidden transition-all shadow-sm",
      allowed ? "border-[#86efac]" : denied ? "border-[#fca5a5]" : "border-[#e2e8f0]"
    )}>
      {/* Label */}
      <div className={cn(
        "flex items-center gap-1.5 border-r px-3 py-1.5",
        allowed ? "border-[#86efac] bg-[#f0fdf4]"
          : denied ? "border-[#fca5a5] bg-[#fef2f2]"
          : "border-[#e2e8f0] bg-[#f8fafc]"
      )}>
        <span className={cn(
          "text-[11px] font-black uppercase tracking-wider whitespace-nowrap",
          allowed ? "text-[#15803d]" : denied ? "text-[#b91c1c]" : "text-[#475569]"
        )}>
          {label}
        </span>
        {isSystem && (
          <span className="rounded bg-[#fef9c3] px-1 py-0.5 text-[8px] font-bold text-[#854d0e] leading-none">
            sys
          </span>
        )}
      </div>
      {/* Allow button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleAllow}
        title="Allow"
        className={cn(
          "flex items-center justify-center gap-1 border-r px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          allowed
            ? "bg-[#16a34a] text-white border-[#16a34a]"
            : "bg-white text-[#94a3b8] border-[#e2e8f0] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
        )}
      >
        <Check className="h-3 w-3" />
        <span>Allow</span>
      </button>
      {/* Deny button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleDeny}
        title="Deny"
        className={cn(
          "flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          denied
            ? "bg-[#dc2626] text-white"
            : "bg-white text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
        )}
      >
        <X className="h-3 w-3" />
        <span>Deny</span>
      </button>
    </div>
  );
}

// ── Menu row ──────────────────────────────────────────────────────────────────

function MenuPermissionRow({
  menu, isChild, activeTab, assignPrivileges, createPrivileges,
  selectedRole, togglingId, addForMenuId, editPrivilegeId,
  newPrivilegeName, editPrivilegeName, savingPrivilege,
  onTogglePermission, onStartAdd, onCancelAdd, onStartEdit, onCancelEdit,
  onNameChange, onEditNameChange, onCreatePrivilege, onUpdatePrivilege,
  onDeletePrivilege, canUseSystemPermission,
}: {
  menu: SidebarMenuRow;
  isChild: boolean;
  activeTab: TabType;
  assignPrivileges: PrivilegeRow[];
  createPrivileges: PrivilegeRow[];
  selectedRole: string;
  togglingId: number | null;
  addForMenuId: number | null;
  editPrivilegeId: number | null;
  newPrivilegeName: string;
  editPrivilegeName: string;
  savingPrivilege: boolean;
  onTogglePermission: (id: number, type: "ALLOW" | "DENY", current: boolean) => void;
  onStartAdd: (menuId: number) => void;
  onCancelAdd: () => void;
  onStartEdit: (priv: PrivilegeRow) => void;
  onCancelEdit: () => void;
  onNameChange: (v: string) => void;
  onEditNameChange: (v: string) => void;
  onCreatePrivilege: (menuId: number) => void;
  onUpdatePrivilege: (priv: PrivilegeRow) => void;
  onDeletePrivilege: (priv: PrivilegeRow) => void;
  canUseSystemPermission: (permission: string) => boolean;
}) {
  const showingAdd = addForMenuId === menu.menu_id;

  const grantedCount = assignPrivileges.filter(p => p.is_allowed ?? p.is_assigned).length;
  const deniedCount  = assignPrivileges.filter(p => p.is_denied).length;

  return (
    <div className={cn(
      "border-b border-[#f1f5f9] transition-colors hover:bg-[#fafafa]",
      isChild && "bg-[#fbfcfe]"
    )}>
      <div className="flex flex-col gap-3 px-5 py-3.5 md:flex-row md:items-center md:gap-5">

        {/* ── Menu info ─────────────────────────────────────────────── */}
        <div className={cn("flex min-w-0 shrink-0 items-center gap-2.5 md:w-56", isChild && "pl-4")}>
          {isChild && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" />
          )}
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isChild ? "bg-[#f1f5f9]" : "bg-[#1e293b]"
          )}>
            <LayoutGrid className={cn("h-3 w-3", isChild ? "text-[#94a3b8]" : "text-white")} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0f172a] leading-tight truncate">
              {menu.menu_name}
            </p>
            {activeTab === "assign" && assignPrivileges.length > 0 && (grantedCount > 0 || deniedCount > 0) && (
              <div className="mt-1 flex gap-1 flex-wrap">
                {grantedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-bold text-[#15803d]">
                    <Check className="h-2 w-2" /> {grantedCount}
                  </span>
                )}
                {deniedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fee2e2] px-1.5 py-0.5 text-[9px] font-bold text-[#b91c1c]">
                    <X className="h-2 w-2" /> {deniedCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Privileges area ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ASSIGN tab */}
          {activeTab === "assign" && (
            !selectedRole ? (
              <p className="text-[12px] italic text-[#cbd5e1]">Select a role first.</p>
            ) : assignPrivileges.length === 0 ? (
              <p className="text-[12px] italic text-[#cbd5e1]">No privileges defined.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignPrivileges.map((priv) => {
                  const sysKey = normalizePermission(priv.privilege_name);
                  const isSystem = SYSTEM_MANAGEMENT_PERMISSIONS.includes(sysKey as any);
                  const systemRestricted = isSystem && !canUseSystemPermission(sysKey);
                  return (
                    <PrivilegeToggle
                      key={priv.privilege_id}
                      label={priv.privilege_name}
                      allowed={!!(priv.is_allowed ?? priv.is_assigned)}
                      denied={!!priv.is_denied}
                      disabled={togglingId !== null || systemRestricted}
                      isSystem={isSystem}
                      onToggleAllow={() =>
                        onTogglePermission(priv.privilege_id, "ALLOW", !!(priv.is_allowed ?? priv.is_assigned))
                      }
                      onToggleDeny={() =>
                        onTogglePermission(priv.privilege_id, "DENY", !!priv.is_denied)
                      }
                    />
                  );
                })}
              </div>
            )
          )}

          {/* CREATE tab */}
          {activeTab === "create" && (
            <div className="flex flex-wrap items-center gap-2">
              {createPrivileges.map((priv) => {
                const isEditing = editPrivilegeId === priv.privilege_id;
                const sysKey = normalizePermission(priv.privilege_name);
                const isSystem = SYSTEM_MANAGEMENT_PERMISSIONS.includes(sysKey as any);
                const systemRestricted = isSystem && !canUseSystemPermission(sysKey);
                const catLabel = PERMISSION_CATEGORY_LABELS[
                  getPrivilegeCategory(menu.menu_path, priv.privilege_name) ?? "SYSTEM"
                ] ?? "System";

                if (isEditing) {
                  return (
                    <div key={priv.privilege_id}
                      className="flex items-center gap-1.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-2 py-1.5 shadow-sm"
                    >
                      <input
                        type="text"
                        value={editPrivilegeName}
                        onChange={(e) => onEditNameChange(e.target.value)}
                        className="w-32 rounded-lg border border-[#e2e8f0] px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#fde68a]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onUpdatePrivilege(priv);
                          if (e.key === "Escape") onCancelEdit();
                        }}
                      />
                      <button type="button" disabled={savingPrivilege || !editPrivilegeName.trim()}
                        onClick={() => onUpdatePrivilege(priv)}
                        className="rounded-lg bg-[#d97706] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#b45309] disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button type="button" onClick={onCancelEdit}
                        className="rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#475569] hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={priv.privilege_id}
                    className={cn(
                      "group inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition-all",
                      isSystem
                        ? "border-[#fde68a] bg-[#fefce8]"
                        : "border-[#e2e8f0] bg-white hover:border-[#c7d2fe] hover:bg-[#eef2ff]/40"
                    )}
                  >
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#1e293b] leading-none">
                        {priv.privilege_name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#94a3b8]">{catLabel}</p>
                    </div>
                    {isSystem && (
                      <KeyRound className="h-3 w-3 text-[#d97706] shrink-0" />
                    )}
                    <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" disabled={savingPrivilege || systemRestricted}
                        onClick={() => onStartEdit(priv)}
                        className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#e0e7ff] hover:text-[#4f46e5] disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" disabled={savingPrivilege || systemRestricted}
                        onClick={() => onDeletePrivilege(priv)}
                        className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#dc2626] disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!showingAdd ? (
                <button type="button" onClick={() => onStartAdd(menu.menu_id)} disabled={savingPrivilege}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#6366f1] hover:border-[#818cf8] hover:bg-[#eef2ff] disabled:opacity-50 transition-all"
                  title="Add privilege"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[#c7d2fe] bg-[#eef2ff]/60 px-3 py-2">
                  <input
                    type="text"
                    value={newPrivilegeName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. EXPORT"
                    className="w-32 rounded-lg border border-[#e2e8f0] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onCreatePrivilege(menu.menu_id);
                      if (e.key === "Escape") onCancelAdd();
                    }}
                  />
                  <button type="button"
                    disabled={
                      savingPrivilege || !newPrivilegeName.trim() ||
                      (SYSTEM_MANAGEMENT_PERMISSIONS.includes(normalizePermission(newPrivilegeName) as any) &&
                        !canUseSystemPermission(normalizePermission(newPrivilegeName)))
                    }
                    onClick={() => onCreatePrivilege(menu.menu_id)}
                    className="rounded-lg bg-[#4f46e5] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#4338ca] disabled:opacity-50"
                  >
                    {savingPrivilege ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                  </button>
                  <button type="button" onClick={onCancelAdd}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { hasPermission, isSuperAdmin } = useAdminPermissionContext();
  const [activeTab, setActiveTab] = useState<TabType>("assign");
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [menus, setMenus] = useState<SidebarMenuRow[]>([]);
  const [rolePermissionRows, setRolePermissionRows] = useState<RolePermissionRow[]>([]);
  const [privilegesByMenuId, setPrivilegesByMenuId] = useState<Record<number, PrivilegeRow[]>>({});
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [addForMenuId, setAddForMenuId] = useState<number | null>(null);
  const [editPrivilegeId, setEditPrivilegeId] = useState<number | null>(null);
  const [newPrivilegeName, setNewPrivilegeName] = useState("");
  const [editPrivilegeName, setEditPrivilegeName] = useState("");
  const [savingPrivilege, setSavingPrivilege] = useState(false);

  const menuGroups = useMemo(() => groupMenusLikeSidebar(menus), [menus]);
  const canUseSystemPermission = useCallback(
    (permission: string) => isSuperAdmin || hasPermission(permission),
    [hasPermission, isSuperAdmin]
  );

  const permissionByMenuId = useMemo(() => {
    const map = new Map<number, { privileges: PrivilegeRow[] }>();
    rolePermissionRows.forEach((row) => map.set(row.menu_id, { privileges: row.privileges ?? [] }));
    return map;
  }, [rolePermissionRows]);

  const loadMenus = useCallback(async () => {
    setLoadingMenus(true);
    try {
      const menuRes = await adminAPI.paginatedMenu({ limit: 1000, isActive: true });
      if (menuRes.data) setMenus(menuRes.data as SidebarMenuRow[]);
    } catch (e) { console.error(e); }
    finally { setLoadingMenus(false); }
  }, []);

  const fetchRolePermissions = useCallback(async () => {
    if (!selectedRole) { setRolePermissionRows([]); return; }
    setLoadingPanel(true);
    try {
      const res = await adminAPI.getRolePermissions({ roleId: Number(selectedRole) });
      if (res.status) setRolePermissionRows(res.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoadingPanel(false); }
  }, [selectedRole]);

  const fetchAllPrivileges = useCallback(async () => {
    setLoadingPanel(true);
    try {
      const res = await adminAPI.privilegesListWithMenu();
      if (res.status && Array.isArray(res.data)) {
        const map: Record<number, PrivilegeRow[]> = {};
        for (const p of res.data) {
          if (!map[p.menu_id]) map[p.menu_id] = [];
          map[p.menu_id].push(p);
        }
        setPrivilegesByMenuId(map);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingPanel(false); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const roleRes = await adminAPI.getRoleDropdown();
        if (roleRes.status && roleRes.data?.length) {
          setRoles(roleRes.data);
          setSelectedRole((prev) => prev || String(roleRes.data[0].id));
        }
      } catch (e) { console.error(e); }
      await loadMenus();
    })();
  }, [loadMenus]);

  useEffect(() => { if (activeTab === "assign") fetchRolePermissions(); }, [activeTab, selectedRole, fetchRolePermissions]);
  useEffect(() => { if (activeTab === "create") fetchAllPrivileges(); }, [activeTab, fetchAllPrivileges]);

  const handleTogglePermission = async (privilegeId: number, permissionType: "ALLOW" | "DENY", currentAssigned: boolean) => {
    if (!selectedRole) return;
    setTogglingId(privilegeId);
    try {
      const res = await adminAPI.toggleRolePermission({ roleId: Number(selectedRole), privilegeId, permissionType, isAssigned: !currentAssigned });
      if (res.status) await fetchRolePermissions();
      else { setErrorMessage(res.message || "Failed to update permission."); setFailedOverlay(true); }
    } catch (err) { setErrorMessage(errorMessageFrom(err, "Failed to update permission.")); setFailedOverlay(true); }
    finally { setTogglingId(null); }
  };

  const handleCreatePrivilege = async (menuId: number) => {
    if (!newPrivilegeName.trim()) return;
    setSavingPrivilege(true);
    try {
      const res = await adminAPI.createPrivilege({ menuId, privilegeName: newPrivilegeName.trim() });
      if (res.status) {
        setSuccessOverlay(true); setTimeout(() => setSuccessOverlay(false), 2000);
        setNewPrivilegeName(""); setAddForMenuId(null);
        await fetchAllPrivileges();
        if (selectedRole) await fetchRolePermissions();
      } else { setErrorMessage(res.message || "Failed to create privilege."); setFailedOverlay(true); }
    } catch (e: unknown) { setErrorMessage(errorMessageFrom(e, "Failed to create privilege.")); setFailedOverlay(true); }
    finally { setSavingPrivilege(false); }
  };

  const handleUpdatePrivilege = async (priv: PrivilegeRow) => {
    if (!editPrivilegeName.trim()) return;
    setSavingPrivilege(true);
    try {
      const res = await adminAPI.updatePrivilege({ privilegeId: priv.privilege_id, privilegeName: editPrivilegeName.trim(), isActive: priv.is_active !== false });
      if (res.status) {
        setSuccessOverlay(true); setTimeout(() => setSuccessOverlay(false), 2000);
        setEditPrivilegeId(null); setEditPrivilegeName("");
        await fetchAllPrivileges();
        if (selectedRole) await fetchRolePermissions();
      } else { setErrorMessage(res.message || "Failed to update privilege."); setFailedOverlay(true); }
    } catch (e: unknown) { setErrorMessage(errorMessageFrom(e, "Failed to update privilege.")); setFailedOverlay(true); }
    finally { setSavingPrivilege(false); }
  };

  const handleDeletePrivilege = async (priv: PrivilegeRow) => {
    if (!window.confirm(`Delete privilege "${priv.privilege_name}"? This removes it from all roles.`)) return;
    setSavingPrivilege(true);
    try {
      const res = await adminAPI.deletePrivilege({ privilegeId: priv.privilege_id });
      if (res.status) {
        setSuccessOverlay(true); setTimeout(() => setSuccessOverlay(false), 2000);
        if (editPrivilegeId === priv.privilege_id) { setEditPrivilegeId(null); setEditPrivilegeName(""); }
        await fetchAllPrivileges();
        if (selectedRole) await fetchRolePermissions();
      } else { setErrorMessage(res.message || "Failed to delete privilege."); setFailedOverlay(true); }
    } catch (e: unknown) { setErrorMessage(errorMessageFrom(e, "Failed to delete privilege.")); setFailedOverlay(true); }
    finally { setSavingPrivilege(false); }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setAddForMenuId(null); setEditPrivilegeId(null);
    setNewPrivilegeName(""); setEditPrivilegeName("");
  };

  const isBusy = loadingPanel || togglingId !== null || loadingMenus;

  // Stats for assign tab
  const totalGranted = useMemo(() =>
    Array.from(permissionByMenuId.values()).reduce(
      (acc, { privileges }) => acc + privileges.filter(p => p.is_allowed ?? p.is_assigned).length, 0
    ), [permissionByMenuId]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Updated" subtitle="Permissions updated successfully." />
      <FailedOverlay show={failedOverlay} title="Operation Failed" subtitle={errorMessage || "Something went wrong."} onFinish={() => setFailedOverlay(false)} />

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0f172a] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#16a34a]" />
            Permission Settings
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Control what each role can access and do across the admin panel.
          </p>
        </div>

        {activeTab === "assign" && selectedRole && (
          <div className="flex items-center gap-2 rounded-xl border border-[#dcfce7] bg-[#f0fdf4] px-4 py-2.5">
            <Check className="h-4 w-4 text-[#16a34a]" />
            <span className="text-[13px] font-semibold text-[#15803d]">
              {totalGranted} permission{totalGranted !== 1 ? "s" : ""} granted
            </span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">

        {/* ── Toolbar: tabs + role selector ───────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1 w-fit shadow-sm">
            {(["assign", "create"] as TabType[]).map((tab) => (
              <button key={tab} type="button" onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all",
                  activeTab === tab
                    ? "bg-[#0f172a] text-white shadow-sm"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                )}
              >
                {tab === "assign" ? <ShieldCheck className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                {tab === "assign" ? "Assign Permissions" : "Manage Privileges"}
              </button>
            ))}
          </div>

          {activeTab === "assign" && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] whitespace-nowrap">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] font-semibold text-[#0f172a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 min-w-[160px]"
              >
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Table header ────────────────────────────────────────── */}
        <div className="flex items-center gap-5 border-b border-[#f1f5f9] bg-[#f8fafc] px-5 py-2.5">
          <div className="w-56 shrink-0 text-[10px] font-black uppercase tracking-widest text-[#b0bec5]">Menu</div>
          <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-[#b0bec5]">
            {activeTab === "assign" ? "Privileges" : "Defined Privileges"}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div className="relative max-h-[calc(100vh-280px)] overflow-y-auto">

          {/* Loading bar */}
          {isBusy && (
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#e2e8f0] bg-white/90 px-6 py-2.5 backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#4f46e5]" />
              <span className="text-[12px] font-medium text-[#64748b]">
                {togglingId ? "Updating permission…" : "Loading…"}
              </span>
            </div>
          )}

          {!menus.length && !loadingMenus ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <LayoutGrid className="h-10 w-10 text-[#e2e8f0]" />
              <p className="text-[14px] font-semibold text-[#94a3b8]">No menus available</p>
              <p className="text-[12px] text-[#cbd5e1]">Run the master seed to populate admin menus.</p>
            </div>
          ) : (
            menuGroups.map((group) => (
              <div key={group.menu_group_id}>
                {/* Sticky group header */}
                <div className="sticky top-0 z-[4] flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f1f5f9] px-6 py-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#475569]">
                    {group.menu_group}
                  </span>
                  <span className="rounded-full bg-[#e2e8f0] px-1.5 py-0.5 text-[9px] font-bold text-[#64748b]">
                    {group.menus.length}
                  </span>
                </div>

                {group.menus.map((menu) => {
                  const isChild = menu.menu_type === "C" || menu.menu_parent_id != null;
                  const assignPrivileges = permissionByMenuId.get(menu.menu_id)?.privileges ?? [];
                  const createPrivileges = privilegesByMenuId[menu.menu_id] ?? [];
                  return (
                    <MenuPermissionRow
                      key={menu.menu_id}
                      menu={menu}
                      isChild={!!isChild}
                      activeTab={activeTab}
                      assignPrivileges={assignPrivileges}
                      createPrivileges={createPrivileges}
                      selectedRole={selectedRole}
                      togglingId={togglingId}
                      addForMenuId={addForMenuId}
                      editPrivilegeId={editPrivilegeId}
                      newPrivilegeName={newPrivilegeName}
                      editPrivilegeName={editPrivilegeName}
                      savingPrivilege={savingPrivilege}
                      onTogglePermission={handleTogglePermission}
                      onStartAdd={(id) => { setAddForMenuId(id); setEditPrivilegeId(null); setNewPrivilegeName(""); }}
                      onCancelAdd={() => { setAddForMenuId(null); setNewPrivilegeName(""); }}
                      onStartEdit={(priv) => { setAddForMenuId(null); setEditPrivilegeId(priv.privilege_id); setEditPrivilegeName(priv.privilege_name); }}
                      onCancelEdit={() => { setEditPrivilegeId(null); setEditPrivilegeName(""); }}
                      onNameChange={setNewPrivilegeName}
                      onEditNameChange={setEditPrivilegeName}
                      onCreatePrivilege={handleCreatePrivilege}
                      onUpdatePrivilege={handleUpdatePrivilege}
                      onDeletePrivilege={handleDeletePrivilege}
                      canUseSystemPermission={canUseSystemPermission}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
