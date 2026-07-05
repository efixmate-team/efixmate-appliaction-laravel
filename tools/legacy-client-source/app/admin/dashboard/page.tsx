"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  Users,
  Wrench,
  IndianRupee,
  AlertCircle,
  Clock,
  ClipboardList,
  Zap,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { FIRST_SETUP_STEP } from "@/app/admin/(lib)/adminSetupGuide";
import {
  CHART_GRADIENTS,
  KPI_CARD_THEMES,
  STATUS_BADGE_COLORS,
  STATUS_BAR_COLORS,
  TREND_COLORS,
} from "@/app/admin/(lib)/adminColors";

type RangeKey = "7d" | "30d" | "90d" | "year";

type KpiTrend = { change?: string; trend?: "up" | "down" | "neutral" };

type DashboardStats = {
  kpis: {
    revenue: { value: string; totalAllTime: string } & KpiTrend;
    bookings: { value: number } & KpiTrend;
    technicians: { value: number; newInPeriod: number };
    customers: { value: number; newInPeriod: number };
  };
  chart: { labels: string[]; bookings: number[]; revenue: number[] };
  statusBreakdown: { status: string; count: number }[];
  alerts: {
    pendingApplications: number;
    delayedBookings: number;
    todayBookings: number;
  };
};

type RecentBooking = {
  id: string;
  customer: string;
  service: string;
  amount: number | string;
  status: string;
  date: string;
};

type TopService = { name: string; sales: number; revenue: string; pct: number };

type ActivityItem = {
  kind: string;
  ref: string;
  title: string;
  subtitle: string;
  timeAgo: string;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "Year" },
];

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function TrendBadge({ change, trend }: KpiTrend) {
  if (!change) return null;
  const isUp = trend === "up";
  const isDown = trend === "down";
  const colors = isUp ? TREND_COLORS.up : isDown ? TREND_COLORS.down : TREND_COLORS.neutral;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {isUp && <ArrowUpRight className="w-3 h-3" />}
      {isDown && <ArrowDownRight className="w-3 h-3" />}
      {change}
    </span>
  );
}

function MiniBarChart({
  labels,
  values,
  gradientFrom = CHART_GRADIENTS.bookings.from,
  gradientTo = CHART_GRADIENTS.bookings.to,
}: {
  labels: string[];
  values: number[];
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const max = Math.max(...values, 1);
  const step = labels.length > 14 ? Math.ceil(labels.length / 7) : 1;

  return (
    <div className="flex items-end gap-0.5 sm:gap-1 h-32">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full flex items-end justify-center h-24">
            <div
              className="w-full max-w-[22px] rounded-t-md"
              style={{
                background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
                height: `${Math.max((v / max) * 100, v > 0 ? 6 : 0)}%`,
              }}
              title={`${labels[i]}: ${v}`}
            />
          </div>
          {i % step === 0 && (
            <span className="text-[9px] text-[#94a3b8] truncate w-full text-center leading-none">
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatINR(amount: string | number) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<RangeKey>("7d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"bookings" | "revenue">("bookings");

  const displayName = user?.first_name?.trim() || "Admin";

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const params = { range };
      const [statsRes, bookingsRes, servicesRes, activityRes] = await Promise.all([
        adminAPI.getDashboardStats(params),
        adminAPI.getRecentBookings({ limit: 8 }),
        adminAPI.getTopServices({ range, limit: 5 }),
        adminAPI.getDashboardActivity({ limit: 8 }),
      ]);

      const sanitizeApiError = (msg?: string) =>
        msg?.startsWith("Forbidden:") ? "You don't have permission to view this section." : msg;

      const errs: string[] = [];
      if (!statsRes?.status) errs.push(sanitizeApiError(statsRes?.message) || "Stats unavailable");
      if (!bookingsRes?.status) errs.push(sanitizeApiError(bookingsRes?.message) || "Bookings unavailable");
      const uniqueErrs = [...new Set(errs)];
      if (uniqueErrs.length) setLoadError(uniqueErrs.join(" · "));

      setStats(statsRes?.status && statsRes.data ? (statsRes.data as DashboardStats) : null);
      setRecentBookings(
        bookingsRes?.status && Array.isArray(bookingsRes.data)
          ? (bookingsRes.data as RecentBooking[])
          : []
      );
      setTopServices(
        servicesRes?.status && Array.isArray(servicesRes.data)
          ? (servicesRes.data as TopService[])
          : []
      );
      setActivity(
        activityRes?.status && Array.isArray(activityRes.data)
          ? (activityRes.data as ActivityItem[])
          : []
      );
    } catch {
      setLoadError("Network error while loading dashboard.");
      setStats(null);
      setRecentBookings([]);
      setTopServices([]);
      setActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onScopeChange = () => {
      setRefreshing(true);
      fetchData();
    };
    window.addEventListener("admin-scope-changed", onScopeChange);
    return () => window.removeEventListener("admin-scope-changed", onScopeChange);
  }, [fetchData]);

  const statusTotal = useMemo(
    () => stats?.statusBreakdown?.reduce((s, x) => s + x.count, 0) || 0,
    [stats]
  );

  const chartValues =
    chartTab === "bookings" ? stats?.chart.bookings ?? [] : stats?.chart.revenue ?? [];

  const alerts = stats?.alerts;
  const alertCount = (alerts?.pendingApplications || 0) + (alerts?.delayedBookings || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#e0e7ff] border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-[#94a3b8]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {loadError && (
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#78350f] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-[#4f46e5] uppercase tracking-widest mb-1">
            Operations overview
          </p>
          <h1 className="text-2xl font-bold text-[#0f172a] ">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-[13px] text-[#53697e] mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {alerts?.todayBookings != null && (
              <span className="text-[#94a3b8]">
                {" "}
                · <span className="text-[#4f46e5] font-medium">{alerts.todayBookings}</span> bookings today
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={FIRST_SETUP_STEP.path}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0e55d9] to-[#2563eb] px-3 py-2 text-sm font-semibold text-[#ffffff] shadow-sm shadow-[#bfdbfe]/80 hover:-translate-y-0.5 transition-transform"
          >
            <BookOpen className="h-4 w-4" />
            Start Configuration
            <ChevronRight className="h-4 w-4 opacity-90" />
          </Link>
          <Link
            href="/admin/operations/live-dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#c7d2fe] bg-[#e0e7ff] px-3 py-2 text-sm font-medium text-[#4338ca] hover:bg-[#e0e7ff]"
          >
            <Zap className="h-4 w-4" />
            Live ops
          </Link>
          <div className="flex rounded-xl bg-[#ffffff] border border-[#e2e8f0] p-0.5 shadow-sm">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  range === opt.key
                    ? "bg-[#0f172a] text-[#ffffff] shadow-sm"
                    : "text-[#53697e] hover:text-[#1e293b]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e8f0] text-[#475569] text-[12px] font-semibold hover:bg-[#f8fafc] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: "Revenue",
            subtitle: `${formatINR(stats?.kpis.revenue.totalAllTime ?? 0)} all-time`,
            value: formatINR(stats?.kpis.revenue.value ?? 0),
            trend: stats?.kpis.revenue,
            icon: IndianRupee,
            theme: KPI_CARD_THEMES.revenue,
          },
          {
            title: "Bookings",
            subtitle: "in selected period",
            value: (stats?.kpis.bookings.value ?? 0).toLocaleString("en-IN"),
            trend: stats?.kpis.bookings,
            icon: CalendarCheck,
            theme: KPI_CARD_THEMES.bookings,
          },
          {
            title: "Technicians",
            subtitle: stats?.kpis.technicians.newInPeriod
              ? `+${stats.kpis.technicians.newInPeriod} joined this period`
              : "active on platform",
            value: (stats?.kpis.technicians.value ?? 0).toLocaleString("en-IN"),
            icon: Wrench,
            theme: KPI_CARD_THEMES.technicians,
          },
          {
            title: "Customers",
            subtitle: stats?.kpis.customers.newInPeriod
              ? `+${stats.kpis.customers.newInPeriod} registered this period`
              : "active customers",
            value: (stats?.kpis.customers.value ?? 0).toLocaleString("en-IN"),
            icon: Users,
            theme: KPI_CARD_THEMES.customers,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-[#ffffff] rounded-2xl border p-5 shadow-sm"
              style={{ borderColor: card.theme.ring }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: `linear-gradient(to bottom right, ${card.theme.gradientFrom}, ${card.theme.gradientTo})`,
                  }}
                >
                  <Icon className="w-[18px] h-[18px] text-[#ffffff]" />
                </div>
                {card.trend?.change && (
                  <TrendBadge change={card.trend.change} trend={card.trend.trend} />
                )}
              </div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mt-4">
                {card.title}
              </p>
              <p className="text-[26px] font-bold text-[#0f172a] mt-0.5 leading-none ">
                {card.value}
              </p>
              <p className="text-[11px] text-[#94a3b8] mt-2">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#ffffff] rounded-2xl border border-[#f1f5f9] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#eef2ff]" />
              <h3 className="text-[14px] font-bold text-[#1e293b]">Performance trend</h3>
            </div>
            <div className="flex rounded-lg bg-[#f1f5f9] p-0.5">
              {(["bookings", "revenue"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChartTab(tab)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                    chartTab === tab ? "bg-[#ffffff] text-[#0f172a] shadow-sm" : "text-[#53697e]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {stats?.chart.labels?.length ? (
            <MiniBarChart
              labels={stats.chart.labels}
              values={chartValues}
              gradientFrom={
                chartTab === "revenue"
                  ? CHART_GRADIENTS.revenue.from
                  : CHART_GRADIENTS.bookings.from
              }
              gradientTo={
                chartTab === "revenue"
                  ? CHART_GRADIENTS.revenue.to
                  : CHART_GRADIENTS.bookings.to
              }
            />
          ) : (
            <p className="text-[13px] text-[#94a3b8] py-12 text-center">No chart data for this period</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#eff6ff]" />
              <h3 className="text-[14px] font-bold text-[#1e293b]">Booking status</h3>
            </div>
            <div className="space-y-3">
              {(stats?.statusBreakdown ?? []).slice(0, 6).map((item, i) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#475569]">
                      {item.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[12px] font-bold text-[#1e293b]">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${statusTotal ? (item.count / statusTotal) * 100 : 0}%`,
                        backgroundColor: STATUS_BAR_COLORS[i % STATUS_BAR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              {!stats?.statusBreakdown?.length && (
                <p className="text-[12px] text-[#94a3b8] text-center py-4">No bookings in period</p>
              )}
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#1e293b]">Needs attention</h3>
              {alertCount > 0 && (
                <span className="text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              <Link
                href="/admin/technician-management/applications"
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  (alerts?.pendingApplications ?? 0) > 0
                    ? "bg-[#fffbeb] border-[#fde68a]"
                    : "bg-[#f8fafc] border-[#f1f5f9] opacity-70"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#fffbeb] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-[#ffffff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-[#1e293b]">Pending applications</p>
                  <p className="text-[11px] text-[#53697e]">
                    {alerts?.pendingApplications ?? 0} awaiting review
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
              </Link>

              <Link
                href="/admin/booking-management/bookings"
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  (alerts?.delayedBookings ?? 0) > 0
                    ? "bg-[#eff6ff] border-[#bfdbfe]"
                    : "bg-[#f8fafc] border-[#f1f5f9] opacity-70"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#ffffff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-[#1e293b]">Overdue schedules</p>
                  <p className="text-[11px] text-[#53697e]">
                    {alerts?.delayedBookings ?? 0} past scheduled time
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings + services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#ffffff] rounded-2xl border border-[#f1f5f9] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
            <h3 className="text-[14px] font-bold text-[#1e293b]">Recent bookings</h3>
            <Link
              href="/admin/booking-management/bookings"
              className="flex items-center gap-1 text-[12px] font-semibold text-[#4f46e5] hover:text-[#4338ca]"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left bg-[#f8fafc]/80">
                  <th className="px-5 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-2.5 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider text-right">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((o, i) => (
                  <tr key={i} className="border-t border-[#f8fafc] hover:bg-[#f8fafc]/50">
                    <td className="px-5 py-3">
                      <span className="text-[12px] font-bold text-[#4f46e5]">{o.id}</span>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#334155]">{o.customer}</td>
                    <td className="px-3 py-3 text-[12px] text-[#53697e] max-w-[140px] truncate">
                      {o.service}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold text-[#1e293b]">
                      {formatINR(o.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-[#94a3b8] whitespace-nowrap">
                      {o.date}
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[13px] text-[#94a3b8]">
                      No bookings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#1e293b]">Top services</h3>
            <Link
              href="/admin/masters/services-management/services"
              className="text-[12px] font-semibold text-[#4f46e5] hover:text-[#4338ca]"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {topServices.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-[#cbd5e1] w-4">{i + 1}</span>
                    <p className="text-[12px] font-semibold text-[#334155] truncate">{p.name}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#1e293b] shrink-0">
                    {formatINR(p.revenue)}
                  </span>
                </div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#eef2ff] to-[#eff6ff] rounded-full"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-1">{p.sales} bookings</p>
              </div>
            ))}
            {topServices.length === 0 && (
              <p className="text-[12px] text-[#94a3b8] text-center py-6">No service data in period</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <h3 className="text-[14px] font-bold text-[#1e293b]">Recent activity</h3>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#ecfdf5] rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="relative">
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#f1f5f9]" />
          <div className="space-y-4">
            {activity.map((item, i) => (
              <div key={`${item.ref}-${i}`} className="flex items-start gap-3 pl-1">
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    item.kind === "booking" ? "bg-[#6f7790]" : "bg-[#f5f3ff]"
                  }`}
                >
                  {item.kind === "booking" ? (
                    <Zap className="w-3.5 h-3.5 text-[#ffffff]" />
                  ) : (
                    <Wrench className="w-3.5 h-3.5 text-[#ffffff]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[12.5px] font-semibold text-[#334155]">{item.title}</p>
                  <p className="text-[12px] text-[#94a3b8] truncate">{item.subtitle}</p>
                  <p className="text-[10px] text-[#cbd5e1] mt-0.5 font-mono">{item.ref}</p>
                </div>
                <span className="text-[11px] text-[#94a3b8] shrink-0">{item.timeAgo}</span>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-[13px] text-[#94a3b8] text-center py-6">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
