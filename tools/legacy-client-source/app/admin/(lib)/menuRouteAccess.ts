/**
 * Validates the current URL against menus returned by GET /admin/menus
 * (active menus only; backend applies permission-based visibility).
 */

type MenuRow = { menu_path?: string | null };

export type MenuGroup = { menus?: MenuRow[] };

/** Strip query/hash; trim trailing slash (except "/"). */
export function normalizeAdminPath(path: string): string {
  if (!path) return "";
  const base = path.split("?")[0].split("#")[0];
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** Paths that must stay reachable even when absent from the menu table. */
const ROUTE_ALLOWLIST: { path: string; match: "exact" | "prefix" }[] = [
  { path: "/admin", match: "exact" },
  { path: "/admin/settings/profile", match: "prefix" },
  { path: "/admin/notifications", match: "prefix" },
  { path: "/admin/support", match: "prefix" },
  { path: "/admin/booking-management/workflow", match: "prefix" },
  { path: "/admin/finance", match: "prefix" },
  { path: "/admin/security", match: "prefix" },
  { path: "/admin/crm", match: "prefix" },
  { path: "/admin/contact-inquiries", match: "prefix" },
  { path: "/admin/cms", match: "prefix" },
  { path: "/admin/masters", match: "prefix" },
  { path: "/admin/reports", match: "prefix" },
];

export const RESTRICTED_ADMIN_ROUTE_PERMISSIONS: { path: string; permissions: string[] }[] = [
  { path: "/admin/admin-management/roles", permissions: ["ROLE_MANAGE"] },
  { path: "/admin/admin-management/permissions", permissions: ["PRIVILEGE_MANAGE"] },
  { path: "/admin/admin-management/menus", permissions: ["PRIVILEGE_MANAGE"] },
  { path: "/admin/admin-management/admins", permissions: ["ADMIN_VIEW", "ADMIN_MANAGE"] },
  { path: "/admin/settings", permissions: ["SYSTEM_SETTINGS"] },
  { path: "/admin/operations/audit", permissions: ["AUDIT_VIEW"] },
  { path: "/admin/notifications", permissions: ["NOTIFICATION_VIEW"] },
  { path: "/admin/support", permissions: ["SUPPORT_VIEW"] },
  { path: "/admin/finance", permissions: ["FINANCE_VIEW"] },
  { path: "/admin/security", permissions: ["SECURITY_VIEW"] },
  { path: "/admin/crm", permissions: ["CRM_VIEW"] },
];

export function collectMenuPaths(groups: MenuGroup[], _isSuperAdmin = false): string[] {
  const raw: string[] = [];
  for (const g of groups || []) {
    for (const m of g.menus || []) {
      const p = (m.menu_path || "").trim();
      if (p) raw.push(normalizeAdminPath(p));
    }
  }
  return [...new Set(raw)];
}

function allowlisted(path: string): boolean {
  const p = normalizeAdminPath(path);
  for (const rule of ROUTE_ALLOWLIST) {
    const base = normalizeAdminPath(rule.path);
    if (rule.match === "exact" && p === base) return true;
    if (rule.match === "prefix" && (p === base || p.startsWith(`${base}/`))) return true;
  }
  return false;
}

/** True if pathname is under an active (and permitted) menu path or allowlist. */
export function isAdminPathAllowed(pathname: string, menuPaths: string[]): boolean {
  const path = normalizeAdminPath(pathname);
  if (!path.startsWith("/admin")) return true;
  if (allowlisted(path)) return true;
  for (const mp of menuPaths) {
    if (path === mp || path.startsWith(`${mp}/`)) return true;
  }
  return false;
}

export function restrictedPermissionsForAdminPath(pathname: string): string[] {
  const path = normalizeAdminPath(pathname);
  const match = RESTRICTED_ADMIN_ROUTE_PERMISSIONS
    .sort((a, b) => b.path.length - a.path.length)
    .find((rule) => path === rule.path || path.startsWith(`${rule.path}/`));
  return match?.permissions ?? [];
}
