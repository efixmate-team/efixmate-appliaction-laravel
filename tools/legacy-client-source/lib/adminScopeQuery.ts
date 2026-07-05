import type { AdminScopeState } from "@/store/adminScope.store";

const PERSIST_KEY = "efm_admin_scope";

export function readPersistedAdminScope(): Partial<AdminScopeState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { state?: AdminScopeState };
    return parsed.state ?? (parsed as AdminScopeState);
  } catch {
    return {};
  }
}

export function adminScopeSearchParams(
  scope?: Partial<AdminScopeState> | null,
): Record<string, number> {
  const s = scope ?? readPersistedAdminScope();
  const out: Record<string, number> = {};
  if (s.country_id != null) out.country_id = s.country_id;
  if (s.state_id != null) out.state_id = s.state_id;
  if (s.city_id != null) out.city_id = s.city_id;
  if (s.area_id != null) out.area_id = s.area_id;
  if (s.fy_id != null) out.fy_id = s.fy_id;
  return out;
}

const ADMIN_SCOPE_EXEMPT_PREFIXES = [
  "admin/scope",
  "admin/menus",
  "admin/profile",
  "admin/settings",
  "admin/login",
  "admin/create",
  "admin/verify-2fa",
];

export function shouldAttachAdminScope(endpoint: string): boolean {
  const path = String(endpoint).replace(/^\/+/, "").split("?")[0];
  if (!path.startsWith("admin/")) return false;
  if (ADMIN_SCOPE_EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return false;
  }
  // Master/lookup CRUD is global config — never scope-filter these requests
  if (path.startsWith("master/") || path.startsWith("lookup/")) return false;
  if (path.includes("masters/geography")) return false;
  return true;
}

/** True when user narrowed below country (state / city / area). */
export function hasNarrowGeoScope(scope?: Partial<AdminScopeState> | null): boolean {
  if (!scope) return false;
  return !!(scope.state_id || scope.city_id || scope.area_id);
}

export function dispatchAdminScopeChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("admin-scope-changed"));
  }
}
