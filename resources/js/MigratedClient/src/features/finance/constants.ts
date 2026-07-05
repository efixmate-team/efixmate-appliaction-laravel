export const FINANCE_NAV = [
  { href: "/admin/finance", label: "Dashboard", exact: true },
  { href: "/admin/finance/reports", label: "Reports" },
  { href: "/admin/finance/refunds", label: "Refunds" },
  { href: "/admin/finance/wallet", label: "Wallet" },
  { href: "/admin/finance/payouts", label: "Payouts" },
  { href: "/admin/finance/invoices", label: "Invoices" },
  { href: "/admin/finance/failed", label: "Failed" },
];

export const REPORT_TYPES = [
  { value: "revenue", label: "Revenue" },
  { value: "gst", label: "GST" },
  { value: "tds", label: "TDS" },
  { value: "settlements", label: "Settlements" },
  { value: "commissions", label: "Commissions" },
  { value: "wallet", label: "Wallet ledger" },
  { value: "payouts", label: "Payouts" },
  { value: "refunds", label: "Refunds" },
  { value: "failed", label: "Failed payments" },
  { value: "invoices", label: "Invoices" },
];

export const REFUND_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];
