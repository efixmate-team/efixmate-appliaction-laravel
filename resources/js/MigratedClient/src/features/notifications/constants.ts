import type { NotificationChannel } from "./types";

export const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

export const DELIVERY_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
];

export const SCHEDULE_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export const NOTIFICATION_NAV = [
  { href: "/admin/notifications", label: "Overview", exact: true },
  { href: "/admin/notifications/templates", label: "Templates" },
  { href: "/admin/notifications/broadcast", label: "Broadcast" },
  { href: "/admin/notifications/scheduled", label: "Scheduled" },
  { href: "/admin/notifications/history", label: "History" },
  { href: "/admin/notifications/logs", label: "Channel logs" },
] as const;

export const CHANNEL_LOG_TABS: { channel: NotificationChannel; label: string }[] = [
  { channel: "push", label: "Push" },
  { channel: "sms", label: "SMS" },
  { channel: "email", label: "Email" },
  { channel: "whatsapp", label: "WhatsApp" },
];
