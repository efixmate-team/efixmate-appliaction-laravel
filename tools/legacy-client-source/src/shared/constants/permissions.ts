export const PERMISSIONS = {
  USER: "USER",
  USER_VIEW: "USER_VIEW",
  USER_CREATE: "USER_CREATE",
  USER_EDIT: "USER_EDIT",
  USER_DELETE: "USER_DELETE",
  BOOKING: "BOOKING",
  BOOKING_VIEW: "BOOKING_VIEW",
  BOOKING_ASSIGN: "BOOKING_ASSIGN",
  BOOKING_REFUND: "BOOKING_REFUND",
  BOOKING_CONFIRM: "BOOKING_CONFIRM",
  TECHNICIAN: "TECHNICIAN",
  TECHNICIAN_VIEW: "TECHNICIAN_VIEW",
  TECHNICIAN_CREATE: "TECHNICIAN_CREATE",
  TECHNICIAN_EDIT: "TECHNICIAN_EDIT",
  TECHNICIAN_APPROVE: "TECHNICIAN_APPROVE",
  PAYMENT: "PAYMENT",
  PAYMENT_VIEW: "PAYMENT_VIEW",
  PAYMENT_CREATE: "PAYMENT_CREATE",
  PAYMENT_EDIT: "PAYMENT_EDIT",
  PAYMENT_REFUND: "PAYMENT_REFUND",
  FINANCE: "FINANCE",
  FINANCE_VIEW: "FINANCE_VIEW",
  FINANCE_CREATE: "FINANCE_CREATE",
  FINANCE_EDIT: "FINANCE_EDIT",
  FINANCE_DELETE: "FINANCE_DELETE",
  REPORTS: "REPORTS",
  REPORTS_VIEW: "REPORTS_VIEW",
  REPORTS_EXPORT: "REPORTS_EXPORT",
  SETTINGS: "SETTINGS",
  SETTINGS_VIEW: "SETTINGS_VIEW",
  SETTINGS_CREATE: "SETTINGS_CREATE",
  SETTINGS_EDIT: "SETTINGS_EDIT",
  SETTINGS_DELETE: "SETTINGS_DELETE",
  SYSTEM: "SYSTEM",
  SYSTEM_VIEW: "SYSTEM_VIEW",
  SYSTEM_CREATE: "SYSTEM_CREATE",
  SYSTEM_EDIT: "SYSTEM_EDIT",
  SYSTEM_DELETE: "SYSTEM_DELETE",
  ROLE_MANAGE: "ROLE_MANAGE",
  ADMIN_MANAGE: "ADMIN_MANAGE",
  PRIVILEGE_MANAGE: "PRIVILEGE_MANAGE",
  SYSTEM_SETTINGS: "SYSTEM_SETTINGS",
  AUDIT_VIEW: "AUDIT_VIEW",
  ADMIN_VIEW: "ADMIN_VIEW",
  ADMIN_CREATE: "ADMIN_CREATE",
  ADMIN_EDIT: "ADMIN_EDIT",
  ADMIN_DELETE: "ADMIN_DELETE",
  MASTER_VIEW: "MASTER_VIEW",
  MASTER_CREATE: "MASTER_CREATE",
  MASTER_EDIT: "MASTER_EDIT",
  MASTER_DELETE: "MASTER_DELETE",
  NOTIFICATION: "NOTIFICATION",
  NOTIFICATION_VIEW: "NOTIFICATION_VIEW",
  NOTIFICATION_CREATE: "NOTIFICATION_CREATE",
  NOTIFICATION_EDIT: "NOTIFICATION_EDIT",
  NOTIFICATION_SEND: "NOTIFICATION_SEND",
  NOTIFICATION_DELETE: "NOTIFICATION_DELETE",
  SUPPORT: "SUPPORT",
  SUPPORT_VIEW: "SUPPORT_VIEW",
  SUPPORT_CREATE: "SUPPORT_CREATE",
  SUPPORT_EDIT: "SUPPORT_EDIT",
  SUPPORT_ASSIGN: "SUPPORT_ASSIGN",
  SUPPORT_ESCALATE: "SUPPORT_ESCALATE",
  SUPPORT_DELETE: "SUPPORT_DELETE",
  SECURITY: "SECURITY",
  SECURITY_VIEW: "SECURITY_VIEW",
  SECURITY_EDIT: "SECURITY_EDIT",
  CRM: "CRM",
  CRM_VIEW: "CRM_VIEW",
  CRM_EDIT: "CRM_EDIT",
  OPERATIONS_LIVE_VIEW: "OPERATIONS_LIVE_VIEW",
} as const;

export const PERMISSION_CATEGORIES = [
  "USER",
  "BOOKING",
  "TECHNICIAN",
  "PAYMENT",
  "FINANCE",
  "REPORTS",
  "SETTINGS",
  "SYSTEM",
  "NOTIFICATION",
  "SUPPORT",
  "SECURITY",
  "CRM",
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export const PERMISSION_GROUPS: Record<PermissionCategory, string[]> = {
  USER: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DELETE],
  BOOKING: [
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_ASSIGN,
    PERMISSIONS.BOOKING_REFUND,
    PERMISSIONS.BOOKING_CONFIRM,
    PERMISSIONS.OPERATIONS_LIVE_VIEW,
  ],
  TECHNICIAN: [
    PERMISSIONS.TECHNICIAN_VIEW,
    PERMISSIONS.TECHNICIAN_CREATE,
    PERMISSIONS.TECHNICIAN_EDIT,
    PERMISSIONS.TECHNICIAN_APPROVE,
  ],
  PAYMENT: [
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_EDIT,
    PERMISSIONS.PAYMENT_REFUND,
  ],
  FINANCE: [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.FINANCE_EDIT,
    PERMISSIONS.FINANCE_DELETE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_REFUND,
  ],
  REPORTS: [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT],
  SETTINGS: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_CREATE,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SETTINGS_DELETE,
    PERMISSIONS.ADMIN_VIEW,
    PERMISSIONS.ADMIN_CREATE,
    PERMISSIONS.ADMIN_EDIT,
    PERMISSIONS.ADMIN_DELETE,
  ],
  SYSTEM: [
    PERMISSIONS.SYSTEM_VIEW,
    PERMISSIONS.SYSTEM_CREATE,
    PERMISSIONS.SYSTEM_EDIT,
    PERMISSIONS.SYSTEM_DELETE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.ADMIN_MANAGE,
    PERMISSIONS.PRIVILEGE_MANAGE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_CREATE,
    PERMISSIONS.MASTER_EDIT,
    PERMISSIONS.MASTER_DELETE,
  ],
  NOTIFICATION: [
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.NOTIFICATION_EDIT,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_DELETE,
  ],
  SUPPORT: [
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_EDIT,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.SUPPORT_ESCALATE,
    PERMISSIONS.SUPPORT_DELETE,
  ],
  SECURITY: [PERMISSIONS.SECURITY_VIEW, PERMISSIONS.SECURITY_EDIT, PERMISSIONS.AUDIT_VIEW],
  CRM: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_EDIT],
};

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, string> = {
  USER: "User",
  BOOKING: "Booking",
  TECHNICIAN: "Technician",
  PAYMENT: "Payment",
  FINANCE: "Finance",
  REPORTS: "Reports",
  SETTINGS: "Settings",
  SYSTEM: "System",
  NOTIFICATION: "Notifications",
  SUPPORT: "Support",
  SECURITY: "Security",
  CRM: "CRM",
};

const PERMISSION_ALIASES: Record<string, PermissionCategory> = {
  ADMIN: "SETTINGS",
  MASTER: "SYSTEM",
};

export const SYSTEM_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.ROLE_MANAGE,
  PERMISSIONS.ADMIN_MANAGE,
  PERMISSIONS.PRIVILEGE_MANAGE,
  PERMISSIONS.SYSTEM_SETTINGS,
  PERMISSIONS.AUDIT_VIEW,
] as const;

export function normalizePermission(permission: string): string {
  return String(permission || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9*]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function permissionGroupFor(permission: string): PermissionCategory | null {
  const normalized = normalizePermission(permission).replace(/_\*$/, "");
  for (const [group, groupPermissions] of Object.entries(PERMISSION_GROUPS)) {
    if (groupPermissions.includes(normalized)) return group as PermissionCategory;
  }
  const head = normalized.split("_")[0] as PermissionCategory;
  if ((PERMISSION_CATEGORIES as readonly string[]).includes(head)) return head;
  return PERMISSION_ALIASES[head] ?? null;
}

function permissionMatches(permissions: string[], permission: string): boolean {
  const wanted = normalizePermission(permission);
  if (!wanted) return false;
  const wantedGroup = permissionGroupFor(wanted);
  const normalizedList = (permissions ?? []).map(normalizePermission);
  const normalized = new Set(normalizedList);
  if (normalized.has("*") || normalized.has(wanted)) return true;
  if ((SYSTEM_MANAGEMENT_PERMISSIONS as readonly string[]).includes(wanted)) return false;
  if (!wantedGroup) return false;
  if (normalized.has(wantedGroup) || normalized.has(`${wantedGroup}_*`)) return true;

  const wantedAction = wanted.split("_").slice(1).join("_");
  return normalizedList.some((stored) => {
    if (!stored || stored === "*" || stored.endsWith("_*")) return false;
    return permissionGroupFor(stored) === wantedGroup && stored.split("_").slice(1).join("_") === wantedAction;
  });
}

export function isPermissionDenied(deniedPermissions: string[], permission: string): boolean {
  return permissionMatches(deniedPermissions, permission);
}

export function hasPermission(
  permissions: string[],
  permission: string,
  deniedPermissions: string[] = []
): boolean {
  const wanted = normalizePermission(permission);
  if (!wanted) return true;
  if (isPermissionDenied(deniedPermissions, wanted)) return false;
  return permissionMatches(permissions, wanted);
}

export function hasPermissionGroup(permissions: string[], group: string): boolean {
  const wantedGroup = permissionGroupFor(group) ?? (normalizePermission(group) as PermissionCategory);
  if (!(PERMISSION_CATEGORIES as readonly string[]).includes(wantedGroup)) return false;
  const normalized = new Set((permissions ?? []).map(normalizePermission));
  if (normalized.has("*") || normalized.has(wantedGroup) || normalized.has(`${wantedGroup}_*`)) {
    return true;
  }
  return PERMISSION_GROUPS[wantedGroup].some((permission) => normalized.has(permission));
}

export function isPermissionGroupDenied(deniedPermissions: string[], group: string): boolean {
  const wantedGroup = permissionGroupFor(group) ?? (normalizePermission(group) as PermissionCategory);
  if (!(PERMISSION_CATEGORIES as readonly string[]).includes(wantedGroup)) return false;
  const normalized = new Set((deniedPermissions ?? []).map(normalizePermission));
  return normalized.has("*") || normalized.has(wantedGroup) || normalized.has(`${wantedGroup}_*`);
}

export function groupedPermissions(permissions: string[]): Record<PermissionCategory, string[]> {
  const grouped = PERMISSION_CATEGORIES.reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<PermissionCategory, string[]>);
  for (const permission of permissions ?? []) {
    const normalized = normalizePermission(permission);
    if (normalized === "*") {
      PERMISSION_CATEGORIES.forEach((category) => grouped[category].push("*"));
      continue;
    }
    const category = permissionGroupFor(normalized);
    if (category) grouped[category].push(normalized);
  }
  return grouped;
}

const PATH_ACTION_PERMISSION_MAP: Record<string, Record<string, string>> = {
  "/admin/admin-management": {
    VIEW: PERMISSIONS.ADMIN_VIEW,
    CREATE: PERMISSIONS.ADMIN_MANAGE,
    ADD: PERMISSIONS.ADMIN_MANAGE,
    EDIT: PERMISSIONS.ADMIN_MANAGE,
    DELETE: PERMISSIONS.ADMIN_MANAGE,
  },
  "/admin/user-management": {
    VIEW: PERMISSIONS.USER_VIEW,
    CREATE: PERMISSIONS.USER_CREATE,
    ADD: PERMISSIONS.USER_CREATE,
    EDIT: PERMISSIONS.USER_EDIT,
    VERIFY: PERMISSIONS.USER_EDIT,
    DELETE: PERMISSIONS.USER_DELETE,
  },
  "/admin/crm": {
    VIEW: PERMISSIONS.CRM_VIEW,
    CREATE: PERMISSIONS.CRM_EDIT,
    EDIT: PERMISSIONS.CRM_EDIT,
    DELETE: PERMISSIONS.CRM_EDIT,
  },
  "/admin/booking-management": {
    VIEW: PERMISSIONS.BOOKING_VIEW,
    ASSIGN: PERMISSIONS.BOOKING_ASSIGN,
    EDIT: PERMISSIONS.BOOKING_ASSIGN,
    REFUND: PERMISSIONS.BOOKING_REFUND,
    CONFIRM: PERMISSIONS.BOOKING_CONFIRM,
  },
  "/admin/technician-management": {
    VIEW: PERMISSIONS.TECHNICIAN_VIEW,
    CREATE: PERMISSIONS.TECHNICIAN_CREATE,
    ADD: PERMISSIONS.TECHNICIAN_CREATE,
    EDIT: PERMISSIONS.TECHNICIAN_EDIT,
    VERIFY: PERMISSIONS.TECHNICIAN_EDIT,
    APPROVE: PERMISSIONS.TECHNICIAN_APPROVE,
  },
  "/admin/masters": {
    VIEW: PERMISSIONS.SYSTEM_VIEW,
    CREATE: PERMISSIONS.SYSTEM_CREATE,
    ADD: PERMISSIONS.SYSTEM_CREATE,
    EDIT: PERMISSIONS.SYSTEM_EDIT,
    DELETE: PERMISSIONS.SYSTEM_DELETE,
  },
  "/admin/lookups": {
    VIEW: PERMISSIONS.SYSTEM_VIEW,
    CREATE: PERMISSIONS.SYSTEM_CREATE,
    ADD: PERMISSIONS.SYSTEM_CREATE,
    EDIT: PERMISSIONS.SYSTEM_EDIT,
    DELETE: PERMISSIONS.SYSTEM_DELETE,
  },
  "/admin/transactions": {
    VIEW: PERMISSIONS.FINANCE_VIEW,
    CREATE: PERMISSIONS.FINANCE_CREATE,
    ADD: PERMISSIONS.FINANCE_CREATE,
    EDIT: PERMISSIONS.FINANCE_EDIT,
    DELETE: PERMISSIONS.FINANCE_DELETE,
    REFUND: PERMISSIONS.PAYMENT_REFUND,
  },
  "/admin/masters/finance-management": {
    VIEW: PERMISSIONS.FINANCE_VIEW,
    CREATE: PERMISSIONS.FINANCE_CREATE,
    ADD: PERMISSIONS.FINANCE_CREATE,
    EDIT: PERMISSIONS.FINANCE_EDIT,
    DELETE: PERMISSIONS.FINANCE_DELETE,
  },
  "/admin/settings": {
    VIEW: PERMISSIONS.SYSTEM_SETTINGS,
    CREATE: PERMISSIONS.SYSTEM_SETTINGS,
    ADD: PERMISSIONS.SYSTEM_SETTINGS,
    EDIT: PERMISSIONS.SYSTEM_SETTINGS,
    DELETE: PERMISSIONS.SYSTEM_SETTINGS,
  },
  "/admin/operations/live-dashboard": {
    VIEW: PERMISSIONS.OPERATIONS_LIVE_VIEW,
    ASSIGN: PERMISSIONS.BOOKING_ASSIGN,
    EDIT: PERMISSIONS.BOOKING_ASSIGN,
  },
  "/admin/operations": {
    VIEW: PERMISSIONS.BOOKING_VIEW,
    ASSIGN: PERMISSIONS.BOOKING_ASSIGN,
    EDIT: PERMISSIONS.BOOKING_ASSIGN,
  },
  "/admin/notifications": {
    VIEW: PERMISSIONS.NOTIFICATION_VIEW,
    CREATE: PERMISSIONS.NOTIFICATION_CREATE,
    ADD: PERMISSIONS.NOTIFICATION_CREATE,
    EDIT: PERMISSIONS.NOTIFICATION_EDIT,
    DELETE: PERMISSIONS.NOTIFICATION_DELETE,
    SEND: PERMISSIONS.NOTIFICATION_SEND,
  },
  "/admin/support": {
    VIEW: PERMISSIONS.SUPPORT_VIEW,
    CREATE: PERMISSIONS.SUPPORT_CREATE,
    ADD: PERMISSIONS.SUPPORT_CREATE,
    EDIT: PERMISSIONS.SUPPORT_EDIT,
    DELETE: PERMISSIONS.SUPPORT_DELETE,
    ASSIGN: PERMISSIONS.SUPPORT_ASSIGN,
    ESCALATE: PERMISSIONS.SUPPORT_ESCALATE,
  },
};

export function permissionForPathAction(pathname: string, action: string): string | null {
  const rawPath = String(pathname || "").trim().replace(/\/+$/, "");
  const path = rawPath && !rawPath.startsWith("/") ? `/${rawPath}` : rawPath;
  const normalizedAction = String(action || "").trim().toUpperCase();
  const prefix = Object.keys(PATH_ACTION_PERMISSION_MAP)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => path === candidate || path.startsWith(`${candidate}/`));
  return prefix ? PATH_ACTION_PERMISSION_MAP[prefix][normalizedAction] ?? null : null;
}
