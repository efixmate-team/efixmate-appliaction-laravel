/** @format */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Radio,
  RefreshCw,
  Route,
  Server,
  ShieldAlert,
  Signal,
  Siren,
  TimerReset,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/app/admin/(components)/PageHeader";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useAdminSocket } from "@/hooks/useAdminSocket";

type Metrics = {
  active_bookings?: number;
  online_technicians?: number;
  delayed_jobs?: number;
  emergency_jobs?: number;
  failed_payments_today?: number;
  revenue_today?: number;
  sla_violations?: number;
  queue_failures_24h?: number;
  refreshed_at?: string;
};

type BookingRow = Record<string, unknown>;

const STATUS_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  CREATED: { bg: "#f8fafc", text: "#475569", ring: "#e2e8f0" },
  ASSIGNED: { bg: "#eff6ff", text: "#1d4ed8", ring: "#bfdbfe" },
  STARTED: { bg: "#f5f3ff", text: "#6d28d9", ring: "#ddd6fe" },
  COMPLETED: { bg: "#ecfdf5", text: "#047857", ring: "#a7f3d0" },
  CANCELLED: { bg: "#fef2f2", text: "#b91c1c", ring: "#fecaca" },
  EMERGENCY: { bg: "#fff1f2", text: "#be123c", ring: "#fecdd3" },
};

const METRICS = [
  {
    label: "Active bookings",
    key: "active_bookings" as keyof Metrics,
    Icon: Activity,
    tone: "#2563eb",
    bg: "#eff6ff",
    sub: "Open field workload",
  },
  {
    label: "Online technicians",
    key: "online_technicians" as keyof Metrics,
    Icon: Wrench,
    tone: "#059669",
    bg: "#ecfdf5",
    sub: "Available workforce",
  },
  {
    label: "Delayed jobs",
    key: "delayed_jobs" as keyof Metrics,
    Icon: Clock,
    tone: "#d97706",
    bg: "#fffbeb",
    sub: "Needs dispatcher attention",
  },
  {
    label: "Emergency jobs",
    key: "emergency_jobs" as keyof Metrics,
    Icon: Siren,
    tone: "#e11d48",
    bg: "#fff1f2",
    sub: "Priority queue",
  },
  {
    label: "Revenue today",
    key: "revenue_today" as keyof Metrics,
    Icon: IndianRupee,
    tone: "#7c3aed",
    bg: "#f5f3ff",
    sub: "Collected value",
    format: (v: number) => `Rs ${v.toLocaleString("en-IN")}`,
  },
  {
    label: "SLA violations",
    key: "sla_violations" as keyof Metrics,
    Icon: ShieldAlert,
    tone: "#ea580c",
    bg: "#fff7ed",
    sub: "Policy breach count",
  },
];

function asNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatTime(value?: string) {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase() || "";
  const tone = STATUS_MAP[key] ?? { bg: "#f8fafc", text: "#64748b", ring: "#e2e8f0" };
  return (
    <span
      style={{ backgroundColor: tone.bg, color: tone.text, borderColor: tone.ring }}
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
    >
      {status || "-"}
    </span>
  );
}

function SocketIndicator({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-bold ${
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {connected ? "Socket live" : "Polling"}
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
    </span>
  );
}

function MetricTile({
  item,
  metrics,
  loading,
}: {
  item: (typeof METRICS)[number];
  metrics: Metrics | null;
  loading: boolean;
}) {
  const raw = metrics?.[item.key];
  const value = raw == null ? "-" : item.format ? item.format(asNumber(raw)) : asNumber(raw).toLocaleString("en-IN");
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
          <div className="mt-2 h-8">
            {loading && metrics == null ? (
              <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="text-[26px] font-black leading-none text-slate-950">{value}</p>
            )}
          </div>
          <p className="mt-2 text-[12px] text-slate-500">{item.sub}</p>
        </div>
        <div
          style={{ backgroundColor: item.bg, color: item.tone }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        >
          <item.Icon size={19} strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}

function HealthValue({ value }: { value: unknown }) {
  const text = typeof value === "object" ? JSON.stringify(value) : String(value ?? "unknown");
  const normalized = text.toLowerCase();
  const ok = normalized === "true" || normalized.includes("ok") || normalized.includes("healthy");
  const bad = normalized === "false" || normalized.includes("error") || normalized.includes("down");
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : bad
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {text}
    </span>
  );
}

export default function LiveOperationsDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stream, setStream] = useState<BookingRow[]>([]);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { metrics: socketMetrics, bookings: socketBookings, connected } = useAdminSocket(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, b, h] = await Promise.all([
      adminOperationalAPI.dashboard.liveMetrics(),
      adminOperationalAPI.dashboard.liveBookings({ limit: 12 }),
      adminOperationalAPI.dashboard.systemHealth(),
    ]);
    if (m.status) setMetrics(m.data as Metrics);
    if (b.status) setStream((b.data as BookingRow[]) || []);
    if (h.status) setHealth(h.data as Record<string, unknown>);
    setLoading(false);
  }, []);

  useEffect(() => {
    const run = () => { void load(); };
    window.setTimeout(run, 0);
    const timer = window.setInterval(run, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    window.queueMicrotask(() => {
      if (socketMetrics) setMetrics(socketMetrics as Metrics);
      if (socketBookings?.length) setStream(socketBookings as BookingRow[]);
    });
  }, [socketMetrics, socketBookings]);

  const riskItems = useMemo(
    () => [
      {
        label: "Delayed jobs",
        value: asNumber(metrics?.delayed_jobs),
        Icon: TimerReset,
        tone: "text-amber-700",
        bg: "bg-amber-50",
      },
      {
        label: "Emergency jobs",
        value: asNumber(metrics?.emergency_jobs),
        Icon: Zap,
        tone: "text-rose-700",
        bg: "bg-rose-50",
      },
      {
        label: "Failed payments",
        value: asNumber(metrics?.failed_payments_today),
        Icon: AlertTriangle,
        tone: "text-red-700",
        bg: "bg-red-50",
      },
      {
        label: "Queue failures",
        value: asNumber(metrics?.queue_failures_24h),
        Icon: Server,
        tone: "text-slate-700",
        bg: "bg-slate-100",
      },
    ],
    [metrics],
  );

  const activeBookings = asNumber(metrics?.active_bookings);
  const onlineTechnicians = asNumber(metrics?.online_technicians);
  const loadRatio = onlineTechnicians ? Math.min(100, Math.round((activeBookings / onlineTechnicians) * 100)) : 0;
  const riskTotal = riskItems.reduce((sum, item) => sum + item.value, 0) + asNumber(metrics?.sla_violations);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <PageHeader
        Icon={Activity}
        iconBg="#eef2ff"
        iconColor="#4f46e5"
        title="Live Dashboard"
        subtitle="Real-time operations overview"
      />

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Radio size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-black  text-slate-950">Operations Control</h1>
                <SocketIndicator connected={connected} />
              </div>
              <p className="mt-1 text-[12px] font-medium text-slate-500">
                Last sync {formatTime(metrics?.refreshed_at)} · 30 second fallback polling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/admin/operations/bookings"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Booking ops
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {METRICS.map((item) => (
              <MetricTile key={item.label} item={item} metrics={metrics} loading={loading} />
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Operational posture</p>
                <h2 className="mt-2 text-[22px] font-black text-slate-950">
                  {riskTotal > 0 ? `${riskTotal} active risks` : "Stable"}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Signal size={19} />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-slate-600">
                <span>Booking load per online technician</span>
                <span>{loadRatio}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${loadRatio > 80 ? "bg-red-500" : loadRatio > 55 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${loadRatio}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {riskItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${item.bg} ${item.tone}`}>
                      <item.Icon size={14} />
                    </span>
                    <span className="text-[12px] font-bold text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-[14px] font-black text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Route size={16} className="text-blue-600" />
                <h2 className="text-[13px] font-black uppercase tracking-wide text-slate-800">Live booking pipeline</h2>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {stream.length} rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Booking</th>
                    <th className="px-4 py-3 font-black">Service</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black">Technician</th>
                    <th className="px-4 py-3 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stream.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-[13px] font-semibold text-slate-500">No active booking events right now.</p>
                      </td>
                    </tr>
                  ) : (
                    stream.map((booking, index) => {
                      const id = String(booking.booking_uid || booking.booking_id || "-");
                      const status = String(booking.status_name || booking.lifecycle_state || "");
                      const technician = String(booking.technician_name || booking.technician || "-");
                      const amount = booking.amount ?? booking.total_amount ?? booking.payable_amount;
                      return (
                        <tr key={`${id}-${index}`} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-mono text-[12px] font-bold text-slate-800">{id}</p>
                            <p className="text-[11px] text-slate-400">#{String(booking.booking_id ?? "-")}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-[240px] truncate text-[13px] font-bold text-slate-800">
                              {String(booking.service_name || "Service")}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-3 text-[12px] font-semibold text-slate-600">{technician}</td>
                          <td className="px-4 py-3 text-right text-[12px] font-black text-slate-800">
                            {amount == null ? "-" : `Rs ${asNumber(amount).toLocaleString("en-IN")}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-slate-600" />
                  <h2 className="text-[13px] font-black uppercase tracking-wide text-slate-800">System health</h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">service mesh</span>
              </div>

              <div className="space-y-2 p-4">
                {health ? (
                  Object.entries(health).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="text-[12px] font-bold capitalize text-slate-700">{key.replace(/_/g, " ")}</span>
                      <HealthValue value={value} />
                    </div>
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h2 className="text-[13px] font-black uppercase tracking-wide text-slate-800">Dispatcher notes</h2>
              </div>
              <div className="mt-3 space-y-2">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
                  Prioritize emergency and delayed jobs before accepting new manual assignments.
                </p>
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-800">
                  Keep booking ops open for technician replacement and route decisions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
