export type TicketSource = "customer" | "technician";

export type TicketStatus =
  | "open"
  | "pending"
  | "in_progress"
  | "waiting_customer"
  | "waiting_technician"
  | "escalated"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketListItem {
  ticket_id: number;
  ticket_source: TicketSource;
  ticket_number: string | null;
  requester_id: number;
  requester_name: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: number | null;
  category_name: string | null;
  assigned_admin_id: number | null;
  assignee_first: string | null;
  assignee_last: string | null;
  sla_due_at: string | null;
  escalation_level: number;
  booking_id: number | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TicketReply {
  reply_id: number;
  ticket_id: number;
  sender_type: string;
  message: string;
  attachment_urls: string[];
  created_at: string;
}

export interface InternalNote {
  note_id: number;
  admin_id: number;
  note: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface TimelineEvent {
  timeline_id: number;
  event_type: string;
  event_label: string;
  actor_type: string | null;
  actor_id: number | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface TicketDetail {
  ticket: Record<string, unknown> & {
    ticket_id: number;
    ticket_source: TicketSource;
    ticket_number: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
  };
  replies: TicketReply[];
  internalNotes: InternalNote[];
  timeline: TimelineEvent[];
  escalations: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  slaPolicy: { first_response_minutes: number; resolution_minutes: number } | null;
}

export interface TicketCategory {
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SlaPolicy {
  policy_id: number;
  priority: TicketPriority;
  first_response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
}

export interface PaginatedTickets {
  rows: TicketListItem[];
  total: number;
  page: number;
  limit: number;
}
