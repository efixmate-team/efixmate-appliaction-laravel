export type BookingWorkflowRow = {
  booking_id: number;
  booking_uid: string;
  customer_id: number;
  technician_id: number | null;
  booking_status_id: number;
  lifecycle_state: string;
  scheduled_date: string;
  scheduled_time: string | null;
  is_emergency: boolean;
  priority: string;
  sla_due_at: string | null;
  fraud_score: number;
  duplicate_of_booking_id: number | null;
  status_name: string;
  service_name: string;
  customer_name: string;
  sla_breached: boolean;
};

export type PaginatedBookings = {
  rows: BookingWorkflowRow[];
  total: number;
  page: number;
  limit: number;
};

export type BookingWorkflowDashboard = {
  byLifecycle: { lifecycle_state: string; cnt: number }[];
  slaBreached: number;
  activeEmergency: number;
  fraudReview: number;
};

export type TimelineEvent = {
  event_type: string;
  event_label: string;
  created_at: string;
  meta?: Record<string, unknown>;
};

export type FraudFlag = {
  code: string;
  severity: string;
  count?: number;
};

export type BookingDetail = {
  booking: Record<string, unknown>;
  technicians: { technician_id: number; technician_name: string; assignment_role: string; is_primary: boolean }[];
  tags: { tag_id: number; name: string; color: string }[];
  internalNotes: { note_id: number; note: string; created_at: string; first_name?: string; last_name?: string }[];
  timeline: TimelineEvent[];
  fraud: {
    fraud_score: number;
    fraud_flags: FraudFlag[];
    duplicates: { booking_id: number; booking_uid: string; created_at: string }[];
  };
};

export type BookingTag = {
  tag_id: number;
  name: string;
  color: string;
};
