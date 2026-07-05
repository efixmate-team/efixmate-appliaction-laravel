import type { TicketPriority, TicketSource, TicketStatus } from "./types";

export const TICKET_SOURCES: { value: TicketSource | ""; label: string }[] = [
  { value: "", label: "All sources" },
  { value: "customer", label: "Customer" },
  { value: "technician", label: "Technician" },
];

export const TICKET_STATUSES: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_customer", label: "Waiting customer" },
  { value: "waiting_technician", label: "Waiting technician" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const SUPPORT_NAV = [
  { href: "/admin/support", label: "Overview", exact: true },
  { href: "/admin/support/tickets", label: "Tickets" },
  { href: "/admin/support/categories", label: "Categories" },
  { href: "/admin/support/sla", label: "SLA policies" },
] as const;

export const SENDER_TYPE_OPTIONS = [
  { value: "admin", label: "Admin (public reply)" },
  { value: "customer", label: "Customer" },
  { value: "technician", label: "Technician" },
];
