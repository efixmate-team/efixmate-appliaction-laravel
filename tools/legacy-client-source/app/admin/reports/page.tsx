"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Check,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Percent,
  Receipt,
  RefreshCcw,
  Settings2,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { BASE_URL } from "@/lib/api/coreClient";

type ExportFormat = "csv" | "xlsx" | "pdf";

interface ReportItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  formats: ExportFormat[];
}

interface ReportCategory {
  id: string;
  label: string;
  CategoryIcon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  reports: ReportItem[];
}

const FORMAT_META: Record<ExportFormat, { label: string; Icon: React.ElementType; cls: string }> = {
  csv: {
    label: "CSV",
    Icon: FileText,
    cls: "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] hover:bg-[#dcfce7]",
  },
  xlsx: {
    label: "Excel",
    Icon: FileSpreadsheet,
    cls: "bg-[#f0fdf4] text-[#166534] border border-[#86efac] hover:bg-[#dcfce7]",
  },
  pdf: {
    label: "PDF",
    Icon: FileText,
    cls: "bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5] hover:bg-[#fee2e2]",
  },
};

const CATEGORIES: ReportCategory[] = [
  {
    id: "financial",
    label: "Financial Reports",
    CategoryIcon: TrendingUp,
    iconColor: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#6ee7b7",
    reports: [
      {
        id: "revenue",
        label: "Revenue Report",
        description: "Total revenue, collections and payouts by date range",
        icon: TrendingUp,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "transactions",
        label: "Transaction Report",
        description: "All payment gateway transactions with status",
        icon: CreditCard,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "commissions",
        label: "Commission Report",
        description: "Technician commission breakdowns and settlements",
        icon: Percent,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "taxes",
        label: "Tax Report",
        description: "GST and tax collected across all bookings",
        icon: Receipt,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "refunds",
        label: "Refund Report",
        description: "All refunds issued with reasons and amounts",
        icon: RefreshCcw,
        formats: ["csv", "xlsx"],
      },
    ],
  },
  {
    id: "bookings",
    label: "Booking Reports",
    CategoryIcon: Calendar,
    iconColor: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
    reports: [
      {
        id: "all-bookings",
        label: "All Bookings",
        description: "Complete booking list with all details and status",
        icon: Calendar,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "bookings-by-status",
        label: "Bookings by Status",
        description: "Bookings grouped and filtered by current status",
        icon: BarChart3,
        formats: ["csv", "xlsx"],
      },
      {
        id: "bookings-by-service",
        label: "Bookings by Service",
        description: "Service-wise booking count and revenue summary",
        icon: Settings2,
        formats: ["csv", "xlsx", "pdf"],
      },
    ],
  },
  {
    id: "users",
    label: "User & Technician Reports",
    CategoryIcon: Users,
    iconColor: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#c4b5fd",
    reports: [
      {
        id: "customers",
        label: "Customer Report",
        description: "All registered customers with booking activity",
        icon: Users,
        formats: ["csv", "xlsx", "pdf"],
      },
      {
        id: "technicians",
        label: "Technician Report",
        description: "Technician profiles, earnings and ratings",
        icon: UserCheck,
        formats: ["csv", "xlsx", "pdf"],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations Reports",
    CategoryIcon: Activity,
    iconColor: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fdba74",
    reports: [
      {
        id: "audit-logs",
        label: "Audit Log Report",
        description: "All admin actions with timestamps and IP addresses",
        icon: Activity,
        formats: ["csv", "xlsx"],
      },
      {
        id: "login-activity",
        label: "Login Activity",
        description: "Admin login/logout history and access events",
        icon: Shield,
        formats: ["csv", "xlsx"],
      },
    ],
  },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  // Computed client-side only — a server-rendered date would go stale
  // (baked in at build/SSR time) and mismatch the browser's actual date.
  useEffect(() => {
    setFromDate(firstOfMonthStr());
    setToDate(todayStr());
  }, []);

  const handleExport = async (reportId: string, format: ExportFormat) => {
    const key = `${reportId}-${format}`;
    if (loadingKey) return;
    setLoadingKey(key);

    try {
      const params = new URLSearchParams({ format });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(
        `${BASE_URL}/admin/reports/${reportId}/export?${params}`,
        { credentials: "include" },
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const ext = format === "xlsx" ? "xlsx" : format;
      const filename = `${reportId}-${fromDate}-to-${toDate}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDoneKeys((prev) => new Set([...prev, key]));
      setTimeout(() => {
        setDoneKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2500);
    } catch {
      // silent — toast can be added here
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#1e293b]">Reports</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Export and download data reports in your preferred format
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2">
          <Download size={13} className="text-[#0e55d9]" />
          <span className="text-[12px] font-medium text-[#0e55d9]">
            Select a format on any report to download
          </span>
        </div>
      </div>

      {/* Date range filter */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff6ff]">
              <Calendar size={14} className="text-[#0e55d9]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1e293b]">Date Range</p>
              <p className="text-[10.5px] text-[#94a3b8]">Applied to all exports</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[11.5px] font-medium text-[#64748b]">From</label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[12px] text-[#1e293b] focus:border-[#0e55d9] focus:outline-none focus:ring-2 focus:ring-[#0e55d9]/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11.5px] font-medium text-[#64748b]">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[12px] text-[#1e293b] focus:border-[#0e55d9] focus:outline-none focus:ring-2 focus:ring-[#0e55d9]/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report categories */}
      {CATEGORIES.map((cat) => {
        const { CategoryIcon } = cat;
        return (
          <div key={cat.id}>
            {/* Category header */}
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: cat.bgColor }}
              >
                <CategoryIcon size={15} style={{ color: cat.iconColor }} />
              </div>
              <h2 className="text-[14px] font-bold text-[#1e293b]">{cat.label}</h2>
              <div className="h-px flex-1 bg-[#e2e8f0]" />
              <span className="text-[11px] text-[#94a3b8]">{cat.reports.length} reports</span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.reports.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] transition-shadow hover:shadow-[0_4px_20px_rgba(14,85,217,0.10)]"
                    style={{ borderLeft: `3px solid ${cat.iconColor}` }}
                  >
                    {/* Card body */}
                    <div className="flex items-start gap-3 px-4 pb-3 pt-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: cat.bgColor }}
                      >
                        <Icon size={18} style={{ color: cat.iconColor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1e293b]">
                          {report.label}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-[#64748b]">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    {/* Format buttons */}
                    <div className="mt-auto border-t border-[#f1f5f9] px-4 py-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                        Export as
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.formats.map((fmt) => {
                          const meta = FORMAT_META[fmt];
                          const key = `${report.id}-${fmt}`;
                          const isLoading = loadingKey === key;
                          const isDone = doneKeys.has(key);
                          return (
                            <button
                              key={fmt}
                              type="button"
                              disabled={!!loadingKey}
                              onClick={() => handleExport(report.id, fmt)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDone
                                  ? "border border-[#86efac] bg-[#ecfdf5] text-[#16a34a]"
                                  : meta.cls
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : isDone ? (
                                <Check size={11} strokeWidth={3} />
                              ) : (
                                <meta.Icon size={11} />
                              )}
                              {isLoading ? "Exporting…" : isDone ? "Done!" : meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
