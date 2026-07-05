export type NotificationChannel = "push" | "sms" | "email" | "whatsapp";

export type DeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "failed"
  | "cancelled";

export type CampaignStatus = "draft" | "scheduled" | "sent" | "cancelled";

export type ScheduleStatus = "pending" | "completed" | "failed" | "cancelled";

export interface NotificationTemplate {
  template_id: number;
  channel: NotificationChannel;
  template_key: string;
  title: string | null;
  body: string;
  variables: string[] | unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationCampaign {
  campaign_id: number;
  name: string;
  channel: NotificationChannel;
  template_id: number | null;
  template_key?: string;
  template_title?: string;
  audience: Record<string, unknown>;
  message_body: string | null;
  status: CampaignStatus;
  is_broadcast: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationDelivery {
  delivery_id: number;
  campaign_id: number | null;
  campaign_name?: string;
  recipient_type: string | null;
  recipient_id: number | null;
  channel: NotificationChannel;
  status: DeliveryStatus;
  subject: string | null;
  recipient_address: string | null;
  message_body: string | null;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  provider: string | null;
  sent_at: string | null;
  failed_at: string | null;
  created_at: string;
}

export interface NotificationSchedule {
  schedule_id: number;
  title: string;
  channel: NotificationChannel;
  template_id: number | null;
  template_key?: string;
  audience: Record<string, unknown>;
  payload: Record<string, unknown>;
  scheduled_at: string;
  status: ScheduleStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

export interface NotificationInboxItem {
  inbox_id: number;
  admin_id: number | null;
  title: string;
  body: string | null;
  channel: NotificationChannel | null;
  category: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  activeTemplates: number;
  campaignsByStatus: { status: string; cnt: number }[];
  deliveryByChannel: { channel: string; status: string; cnt: number }[];
  schedulesByStatus: { status: string; cnt: number }[];
  unreadInbox: number;
}

export interface TemplateFormValues {
  templateId?: number;
  channel: NotificationChannel;
  templateKey: string;
  title: string;
  body: string;
  variables: string;
  isActive: boolean;
}

export interface BroadcastFormValues {
  name: string;
  channel: NotificationChannel;
  templateId?: number;
  messageBody: string;
  segment: string;
}

export interface ScheduleFormValues {
  scheduleId?: number;
  title: string;
  channel: NotificationChannel;
  templateId?: number;
  scheduledAt: string;
  messageBody: string;
}
