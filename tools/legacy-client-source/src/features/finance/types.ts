export type FinanceDashboard = {
  revenue: { total: number | string; count: number };
  refunds: { total: number | string; count: number };
  pending_refunds: number;
  settlements: { batches: number; total: number | string };
  failed_payments: number;
  wallets: { customer_balance?: number | string; technician_credits?: number | string };
  invoices_count: number;
  gst_collected: number | string;
  period: { from: string | null; to: string | null };
};

export type RevenueSeriesPoint = {
  period: string;
  revenue: number | string;
  transactions?: number;
};

export type ReportListResponse<T> = {
  rows: T[];
  total?: number;
  page?: number;
  limit?: number;
  summary?: Record<string, unknown>[];
};

export type ExportPayload = {
  export_format: string;
  filename?: string;
  content?: string;
  mime_type?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
};
