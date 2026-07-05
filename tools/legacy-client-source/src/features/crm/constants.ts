export const CRM_NAV = [
  { href: "/admin/crm", label: "Overview", exact: true as const },
  { href: "/admin/crm/customers", label: "Customers" },
  { href: "/admin/crm/complaints", label: "Complaints" },
  { href: "/admin/crm/spam", label: "Spam review" },
  { href: "/admin/crm/analytics", label: "Analytics" },
] as const;

export const COMPLAINT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const COMM_CHANNELS = ["email", "sms", "phone", "whatsapp", "in_app"] as const;
