export type CrmDashboard = {
  total_customers: number;
  blocked_customers: number;
  spam_flagged: number;
  open_complaints: number;
  total_clv: number;
  avg_clv: number;
  loyalty_points_outstanding: number;
};

export type CrmCustomerRow = {
  customer_id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  mobile_number: string;
  is_blocked?: boolean;
  spam_flag?: boolean;
  spam_score?: number;
  lifetime_value?: number;
  total_bookings?: number;
  loyalty_points?: number;
  created_at?: string;
};

export type ActivityEvent = {
  event_id: string;
  event_type: string;
  title: string;
  description?: string;
  created_at: string;
  meta?: Record<string, unknown>;
};
