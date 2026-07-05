"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck, Bell, CalendarDays, CalendarX, Check, ChevronRight,
  Clock4, Headphones, MapPin, Phone, RefreshCw, RotateCcw, Star,
  Truck, Wrench,
} from "lucide-react";
import { getBookings } from "@/lib/api/userClient";
import { resolveServiceImageUrl } from "@/lib/serviceImage";

type Booking = {
  booking_id: string | number;
  booking_uid?: string;
  service_name?: string;
  service?: string;
  category_name?: string;
  service_icon?: string | null;
  image?: string | null;
  status?: string;
  lifecycle_state?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  final_price?: number;
  total_amount?: number;
  technician_name?: string;
  technician_rating?: number;
  technician_photo?: string | null;
  technician_mobile?: string | null;
  address?: string;
  city?: string;
  area_name?: string;
};

const TABS = ["All", "Upcoming", "In Progress", "Completed", "Cancelled"] as const;
type Tab = typeof TABS[number];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  PENDING:             "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
  CONFIRMED:           "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  BROADCASTED:         "bg-[#6f7790] text-[#4338ca] border-[#c7d2fe]",
  TECHNICIAN_ASSIGNED: "bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]",
  ON_THE_WAY:          "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]",
  JOB_STARTED:         "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  JOB_COMPLETED:       "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]",
  CANCELLED:           "bg-[#fef2f2] text-[#7b5757] border-[#fecaca]",
  CLOSED:              "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]",
};

const TAB_COUNTS: Record<Tab, (b: Booking[]) => number> = {
  All:           (b) => b.length,
  Upcoming:      (b) => b.filter(x => ["PENDING","CONFIRMED","BROADCASTED","TECHNICIAN_ASSIGNED"].includes(x.lifecycle_state ?? x.status ?? "")).length,
  "In Progress": (b) => b.filter(x => ["ON_THE_WAY","JOB_STARTED"].includes(x.lifecycle_state ?? x.status ?? "")).length,
  Completed:     (b) => b.filter(x => ["JOB_COMPLETED","CLOSED"].includes(x.lifecycle_state ?? x.status ?? "")).length,
  Cancelled:     (b) => b.filter(x => (x.lifecycle_state ?? x.status) === "CANCELLED").length,
};

function statusLabel(s?: string) {
  const map: Record<string, string> = {
    PENDING: "Pending", CONFIRMED: "Confirmed", BROADCASTED: "Broadcasted",
    TECHNICIAN_ASSIGNED: "Assigned", ON_THE_WAY: "In Progress", JOB_STARTED: "In Progress",
    JOB_COMPLETED: "Completed", CANCELLED: "Cancelled", CLOSED: "Closed",
  };
  return s ? (map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())) : "Pending";
}

function isActive(s?: string)    { return ["ON_THE_WAY","JOB_STARTED"].includes(s ?? ""); }
function isUpcoming(s?: string)  { return ["PENDING","CONFIRMED","BROADCASTED","TECHNICIAN_ASSIGNED"].includes(s ?? ""); }
function isCompleted(s?: string) { return ["JOB_COMPLETED","CLOSED"].includes(s ?? ""); }
function isCancelled(s?: string) { return s === "CANCELLED"; }

function filterByTab(bookings: Booking[], tab: Tab) {
  if (tab === "All")         return bookings;
  if (tab === "Upcoming")    return bookings.filter(b => isUpcoming(b.lifecycle_state ?? b.status));
  if (tab === "In Progress") return bookings.filter(b => isActive(b.lifecycle_state ?? b.status));
  if (tab === "Completed")   return bookings.filter(b => isCompleted(b.lifecycle_state ?? b.status));
  if (tab === "Cancelled")   return bookings.filter(b => isCancelled(b.lifecycle_state ?? b.status));
  return bookings;
}

// ─── Date grouping ────────────────────────────────────────────────────────────
function getDateGroup(dateStr?: string, lifecycle?: string): string {
  if (isUpcoming(lifecycle) && !isActive(lifecycle)) return "Upcoming Bookings";
  if (!dateStr) return "Past Bookings";
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00`);
  if (isNaN(d.getTime())) return "Past Bookings";
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0)  return "Today";
  if (diff === 1)  return "Tomorrow";
  if (diff > 1 && diff <= 7) return "This Week";
  if (diff > 7)   return "Upcoming Bookings";
  // Past
  const monthKey = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const nowMonth = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return monthKey === nowMonth ? "This Month" : monthKey;
}

function fmtDateLine(dateStr?: string, timeStr?: string) {
  let line = "";
  if (dateStr) {
    const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00`);
    if (!isNaN(d.getTime())) {
      const now = new Date(); now.setHours(12, 0, 0, 0);
      const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
      if (diff === 0)      line = `Today, ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
      else if (diff === 1) line = `Tomorrow, ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
      else                 line = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  if (timeStr) line += (line ? " · " : "") + timeStr;
  return line;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-[#f1f5f9]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/3 rounded bg-[#e2e8f0]" />
          <div className="h-3 w-1/3 rounded bg-[#f1f5f9]" />
        </div>
        <div className="h-6 w-20 shrink-0 rounded-full bg-[#f1f5f9]" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-48 rounded bg-[#f1f5f9]" />
        <div className="h-3 w-36 rounded bg-[#f1f5f9]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#f8fafc] pt-3">
        <div className="h-5 w-16 rounded bg-[#e2e8f0]" />
        <div className="h-8 w-28 rounded-xl bg-[#f1f5f9]" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { title: string; sub: string }> = {
    All:           { title: "No bookings yet",           sub: "Book your first home service today" },
    Upcoming:      { title: "No upcoming bookings",      sub: "Schedule a service when you need it" },
    "In Progress": { title: "No active jobs right now",  sub: "Active bookings will appear here" },
    Completed:     { title: "No completed bookings yet", sub: "Your completed services will show here" },
    Cancelled:     { title: "No cancelled bookings",     sub: "Cancelled bookings will appear here" },
  };
  const { title, sub } = msgs[tab];
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] mb-3">
        <CalendarX size={28} className="text-[#0e55d9]" />
      </div>
      <p className="text-[16px] font-black text-[#0f172a]">{title}</p>
      <p className="mt-1 text-[13px] text-[#64748b]">{sub}</p>
      {tab === "All" && (
        <Link href="/services" className="mt-5 rounded-xl bg-[#0e55d9] px-6 py-2.5 text-[13px] font-black text-[#ffffff] shadow-sm hover:bg-[#0a46b8] transition-all">
          Browse Services
        </Link>
      )}
    </div>
  );
}

// ─── In-progress expanded section ────────────────────────────────────────────
function InProgressExpanded({ b }: { b: Booking }) {
  const steps = [
    { label: "Confirmed", done: true },
    { label: "Assigned",  done: true },
    { label: "In Progress", done: false, active: true },
    { label: "Completed", done: false },
  ];
  return (
    <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-4 py-4 space-y-4">
      {/* Status message */}
      <div>
        <p className="text-[14px] font-black text-[#0e55d9]">Job is in Progress</p>
        <p className="text-[12px] text-[#64748b] mt-0.5">Our professional is working on your service. You can track the job status here.</p>
      </div>
      {/* Stepper */}
      <div className="relative flex items-center justify-between">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#e2e8f0]" />
        <div className="absolute top-4 left-4 h-0.5 bg-[#0e55d9]" style={{ width: "50%" }} />
        {steps.map(({ label, done, active }) => (
          <div key={label} className="relative z-10 flex flex-col items-center gap-1.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
              done    ? "border-[#0e55d9] bg-[#0e55d9]" :
              active  ? "border-[#0e55d9] bg-[#ffffff]" :
                        "border-[#e2e8f0] bg-[#ffffff]"
            }`}>
              {done
                ? <Check size={14} className="text-[#ffffff]" strokeWidth={3} />
                : active
                  ? <Truck size={13} className="text-[#0e55d9]" strokeWidth={2} />
                  : <div className="h-2 w-2 rounded-full bg-[#e2e8f0]" />
              }
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight ${
              done || active ? "text-[#0e55d9]" : "text-[#94a3b8]"
            }`}>{label}</span>
          </div>
        ))}
      </div>
      {/* Technician */}
      {b.technician_name && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0e55d9] text-[15px] font-black text-[#ffffff]">
            {b.technician_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#0f172a]">{b.technician_name}</p>
            {b.technician_rating != null && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-[#f59e0b]" fill="currentColor" />
                <span className="text-[11px] font-bold text-[#64748b]">{b.technician_rating.toFixed(1)} (230+ jobs)</span>
              </div>
            )}
          </div>
          {b.technician_mobile && (
            <a href={`tel:${b.technician_mobile}`}
              className="flex items-center gap-1.5 rounded-xl border border-[#0e55d9] px-3 py-1.5 text-[12px] font-bold text-[#0e55d9] hover:bg-[#eef4ff] transition-colors">
              <Phone size={12} /> Call
            </a>
          )}
        </div>
      )}
      {/* Estimated completion */}
      {b.scheduled_date && (
        <div className="rounded-xl border border-[#0e55d9]/20 bg-[#eef4ff] px-4 py-3">
          <p className="text-[11px] font-semibold text-[#64748b]">Estimated Completion</p>
          <p className="text-[15px] font-black text-[#0e55d9] mt-0.5">
            {b.scheduled_time ?? "10:00 AM"}, {new Date(`${String(b.scheduled_date).slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab-specific banners ─────────────────────────────────────────────────────
function TabBanner({ tab }: { tab: Tab }) {
  if (tab === "In Progress" || tab === "Cancelled") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff]">
            <Headphones size={18} className="text-[#0e55d9]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#0f172a]">Need Help?</p>
            <p className="text-[11.5px] text-[#64748b]">Our support team is always here for you.</p>
          </div>
        </div>
        <Link href="/contact"
          className="flex items-center gap-1.5 rounded-xl border border-[#0e55d9]/30 bg-[#eef4ff] px-4 py-2 text-[12px] font-bold text-[#0e55d9] hover:bg-[#dbeafe] transition-colors">
          <Headphones size={13} /> Contact Support
        </Link>
      </div>
    );
  }
  if (tab === "Completed") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fffbeb]">
            <Star size={18} className="text-[#fffbeb]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#0f172a]">Enjoyed our service?</p>
            <p className="text-[11.5px] text-[#64748b]">Rate your experience and help us improve.</p>
          </div>
        </div>
        <button type="button"
          className="flex items-center gap-1.5 rounded-xl bg-[#fffbeb] px-4 py-2 text-[12px] font-bold text-[#ffffff] hover:bg-[#d97706] transition-colors shadow-sm">
          <Star size={12} fill="currentColor" /> Rate Now
        </button>
      </div>
    );
  }
  if (tab === "Upcoming") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7]">
          <Bell size={18} className="text-[#d97706]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#92400e]">Please be on time</p>
          <p className="text-[11.5px] text-[#b45309] mt-0.5">Our professional will arrive at the scheduled time. Please be available.</p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ b, showExpanded }: { b: Booking; showExpanded?: boolean }) {
  const router = useRouter();
  const id       = b.booking_id;
  const name     = b.service_name ?? b.service ?? "Service";
  const subLabel = b.category_name ?? "Home Service";
  const status   = b.lifecycle_state ?? b.status ?? "PENDING";
  const badgeCls = STATUS_BADGE[status] ?? "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]";
  const price    = b.final_price ?? b.total_amount ?? 0;
  const location = [b.area_name, b.city].filter(Boolean).join(", ") || b.address || "";
  const dateLine = fmtDateLine(b.scheduled_date, b.scheduled_time);
  const active   = isActive(status);
  const upcoming = isUpcoming(status);
  const completed = isCompleted(status);
  const cancelled = isCancelled(status);
  const serviceIcon = resolveServiceImageUrl(b.service_icon ?? b.image);

  return (
    <div
      onClick={() => router.push(`/bookings/${id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0e55d9]/20 hover:shadow-[0_8px_24px_rgba(14,85,217,0.10)]">

      <div className="p-3.5">
        {/* Row 1: icon + name + badge */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#f1f5f9] bg-[#f8fafc]">
            {serviceIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={serviceIcon} alt="" className="h-8 w-8 object-contain" />
            ) : (
              <Wrench size={18} className="text-[#94a3b8]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold leading-tight text-[#0f172a]">{name}</p>
            <p className="mt-0.5 text-[12px] text-[#64748b]">{subLabel}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeCls}`}>
            {statusLabel(status)}
          </span>
        </div>

        {/* Row 2: date + location */}
        <div className="mt-2 space-y-1">
          {dateLine && (
            <div className="flex items-center gap-2 text-[12.5px] text-[#64748b]">
              <Clock4 size={13} className="shrink-0 text-[#94a3b8]" />
              {dateLine}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-[12.5px] text-[#64748b]">
              <MapPin size={13} className="shrink-0 text-[#94a3b8]" />
              {location}
            </div>
          )}
        </div>

        {/* Row 3: price + CTA */}
        <div className="mt-2.5 flex items-center justify-between border-t border-[#f8fafc] pt-2.5">
          <p className="text-[16px] font-black text-[#0f172a]">
            {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "—"}
          </p>

          {active ? (
            <Link href={`/bookings/${id}/track`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-xl bg-[#0e55d9] px-4 py-2 text-[12px] font-bold text-[#ffffff] shadow-sm hover:bg-[#0a46b8] transition-colors">
              <MapPin size={12} /> Track Job
            </Link>
          ) : upcoming ? (
            <button type="button"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-xl border border-[#0e55d9]/30 bg-[#eef4ff] px-4 py-2 text-[12px] font-bold text-[#0e55d9] hover:bg-[#dbeafe] transition-colors">
              <RotateCcw size={12} /> Reschedule
            </button>
          ) : completed ? (
            <Link href={`/bookings/${id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[12px] font-bold text-[#64748b] hover:border-[#6ee7b7] hover:text-[#059669] transition-colors">
              <BadgeCheck size={13} /> View Details
            </Link>
          ) : cancelled ? (
            <Link href={`/bookings/${id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[12px] font-bold text-[#64748b] hover:border-[#fecaca] hover:text-[#7b5757] transition-colors">
              View Details <ChevronRight size={13} />
            </Link>
          ) : (
            <Link href={`/bookings/${id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[12px] font-bold text-[#64748b] hover:border-[#0e55d9]/30 hover:text-[#0e55d9] transition-colors">
              View Details <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Expanded in-progress section */}
      {showExpanded && active && <InProgressExpanded b={b} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<Tab>("All");

  const load = async () => {
    setLoading(true);
    const res = await getBookings() as { status: boolean; data?: Booking[] | { rows?: Booking[] }; rows?: Booking[] };
    const rows = Array.isArray(res.data) ? res.data
      : (res.data as { rows?: Booking[] })?.rows
      ?? (res as { rows?: Booking[] }).rows ?? [];
    setAllBookings(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const displayed = filterByTab(allBookings, activeTab);
  const activeCount = allBookings.filter(b => isActive(b.lifecycle_state ?? b.status)).length;

  // Group displayed bookings
  const groups = displayed.reduce<Record<string, Booking[]>>((acc, b) => {
    const g = getDateGroup(b.scheduled_date, b.lifecycle_state);
    if (!acc[g]) acc[g] = [];
    acc[g].push(b);
    return acc;
  }, {});
  const groupOrder = ["Today", "Tomorrow", "This Week", "Upcoming Bookings", "This Month", "Past Bookings"];
  const sortedGroups = [
    ...groupOrder.filter(g => groups[g]),
    ...Object.keys(groups).filter(g => !groupOrder.includes(g)),
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      <div className="mx-auto max-w-5xl px-4 py-4 lg:px-6 lg:py-6">

        {/* Page header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black text-[#0f172a]">My Bookings</h1>
            <p className="text-[12.5px] text-[#64748b]">
              {loading ? "Loading…" : `${allBookings.length} booking${allBookings.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-[12.5px] font-semibold text-[#64748b] shadow-sm hover:text-[#0e55d9] transition-colors">
              <RefreshCw size={13} /> Refresh
            </button>
            <Link href="/services"
              className="flex items-center gap-1.5 rounded-xl bg-[#0e55d9] px-4 py-2 text-[12.5px] font-black text-[#ffffff] shadow-sm hover:bg-[#0a46b8] transition-all">
              + Book
            </Link>
          </div>
        </div>

        {/* Stats row — compact */}
        {!loading && allBookings.length > 0 && (
          <div className="mb-4 grid grid-cols-4 gap-2">
            {([
              { label: "Total",     value: allBookings.length,                   color: "#0e55d9", bg: "#eef4ff", Icon: CalendarDays },
              { label: "Active",    value: activeCount,                          color: "#f59e0b", bg: "#fffbeb", Icon: Truck        },
              { label: "Completed", value: TAB_COUNTS["Completed"](allBookings), color: "#10b981", bg: "#f0fdf4", Icon: BadgeCheck   },
              { label: "Cancelled", value: TAB_COUNTS["Cancelled"](allBookings), color: "#ef4444", bg: "#fef2f2", Icon: CalendarX    },
            ] as const).map(({ label, value, color, bg, Icon }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 py-2.5 shadow-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: bg }}>
                  <Icon size={13} style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[15px] font-black text-[#0f172a] leading-none">{value}</p>
                  <p className="text-[10.5px] text-[#94a3b8]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2-col: sidebar + list */}
        <div className="grid grid-cols-[180px_1fr] gap-4 items-start max-lg:grid-cols-1">

          {/* Sidebar tabs */}
          <aside className="sticky top-[72px] rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-2 shadow-sm max-lg:static">
            <nav className="space-y-0.5">
              {TABS.map(tab => {
                const count  = TAB_COUNTS[tab](allBookings);
                const active = activeTab === tab;
                return (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all ${
                      active ? "bg-[#eef4ff]" : "hover:bg-[#f8fafc]"
                    }`}>
                    <span className={`text-[12.5px] font-semibold ${active ? "text-[#0e55d9]" : "text-[#374151]"}`}>{tab}</span>
                    <span className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${
                      active ? "bg-[#0e55d9] text-[#ffffff]" : "bg-[#f1f5f9] text-[#64748b]"
                    }`}>{count}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Booking list */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <BookingSkeleton key={i} />)}</div>
            ) : displayed.length === 0 ? (
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
                <EmptyState tab={activeTab} />
              </div>
            ) : (
              <>
                {sortedGroups.map(group => (
                  <div key={group}>
                    <p className="mb-2 text-[12px] font-black uppercase tracking-wide text-[#94a3b8]">{group}</p>
                    <div className="space-y-2">
                      {(groups[group] ?? []).map(b => (
                        <BookingCard key={b.booking_id} b={b} showExpanded={activeTab === "In Progress"} />
                      ))}
                    </div>
                  </div>
                ))}
                <TabBanner tab={activeTab} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
