"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Calendar, Clock,
  CheckCircle, Truck, Wrench, User, Star, Copy, ExternalLink,
  IndianRupee, Tag, AlertCircle, Loader2, RefreshCw,
  ShoppingBag, CreditCard, FileText, XCircle,
} from "lucide-react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { resolveUploadUrl } from "@/lib/api/coreClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingOverview = {
  booking: Record<string, any>;
  items: Array<{ item_id: number; service_name: string; quantity: number; unit_price: number; line_total: number; booking_type?: string }>;
  pricing: { subtotal: number; platform_fee: number; tax_amount: number; tax_rate: number; coupon_discount: number; surge_amount: number; final_amount: number } | null;
  payment: { payment_uid: string; gateway: string; gateway_txn_id: string; amount: number; status: string; payment_mode: string; completed_at: string } | null;
  timeline: Array<{ event_type: string; event_label: string; created_at: string; meta?: any }>;
};

// ─── Lifecycle progress stepper ───────────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { states: ["CONFIRMED", "BROADCASTED"],                label: "Confirmed",    Icon: CheckCircle },
  { states: ["TECHNICIAN_ASSIGNED", "TECHNICIAN_ACCEPTED"], label: "Assigned", Icon: User        },
  { states: ["ON_THE_WAY"],                              label: "On the Way",   Icon: Truck       },
  { states: ["ARRIVED", "JOB_STARTED"],                  label: "Started",      Icon: Wrench      },
  { states: ["JOB_COMPLETED", "PAYMENT_PENDING", "PAID", "CLOSED"], label: "Completed", Icon: CheckCircle },
];

function currentStepIndex(state: string): number {
  for (let i = LIFECYCLE_STEPS.length - 1; i >= 0; i--) {
    if (LIFECYCLE_STEPS[i].states.includes(state)) return i;
  }
  return -1;
}

function ProgressStepper({ state }: { state: string }) {
  const active = currentStepIndex(state);
  const isCancelled = ["CANCELLED", "NO_RESPONSE", "FAILED"].includes(state);

  return (
    <div className="flex items-center justify-between w-full">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done    = i < active;
        const current = i === active;
        const future  = i > active;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isCancelled ? "bg-[#fee2e2] border-2 border-[#fca5a5]"
                : done    ? "bg-[#2563eb] text-[#ffffff] shadow-sm shadow-[#bfdbfe]"
                : current ? "bg-[#ffffff] border-2 border-[#2563eb] shadow-md shadow-[#dbeafe]"
                : "bg-[#f1f5f9] border-2 border-[#e2e8f0]"
              }`}>
                {isCancelled && i === 0
                  ? <XCircle className="w-4 h-4 text-[#7b5757]" />
                  : done
                  ? <CheckCircle className="w-4 h-4" />
                  : <step.Icon className={`w-3.5 h-3.5 ${current ? "text-[#2563eb]" : "text-[#5c6a7f]"}`} />
                }
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${
                done || current ? "text-[#1e293b]" : "text-[#5c6a7f]"
              }`}>{step.label}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${done ? "bg-[#eff6ff]" : "bg-[#e2e8f0]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:            "bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]",
  BROADCASTED:          "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
  TECHNICIAN_ASSIGNED:  "bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]",
  TECHNICIAN_ACCEPTED:  "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]",
  ON_THE_WAY:           "bg-[#cffafe] text-[#0e7490] border-[#a5f3fc]",
  ARRIVED:              "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]",
  JOB_STARTED:          "bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]",
  JOB_COMPLETED:        "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]",
  PAYMENT_PENDING:      "bg-[#fef9c3] text-[#a16207] border-[#fef08a]",
  PAID:                 "bg-[#d1fae5] text-[#047857] border-[#a7f3d0]",
  CLOSED:               "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
  CANCELLED:            "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]",
  NO_RESPONSE:          "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]",
};

function StatusBadge({ state, label }: { state: string; label?: string }) {
  const cls = STATUS_COLORS[state] ?? "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label || state.replace(/_/g, " ")}
    </span>
  );
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function TimelineItem({ event, isLast }: { event: BookingOverview["timeline"][0]; isLast: boolean }) {
  const d = new Date(event.created_at);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const dotColor =
    event.event_type === "lifecycle" ? "bg-[#eff6ff]"
    : event.event_type === "status"  ? "bg-[#818cf8]"
    : event.event_type === "escalation" ? "bg-[#fef2f2]"
    : "bg-[#94a3b8]";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 bg-[#e2e8f0] mt-1" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0f172a] leading-snug">{event.event_label}</p>
        <p className="text-[11px] text-[#5c6a7f] mt-0.5">{date} · {time}</p>
        {event.meta?.note && <p className="text-xs text-[#53697e] mt-0.5 italic">&quot;{event.meta.note}&quot;</p>}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatar(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return resolveUploadUrl(path) || null;
}

function fmt(v: any, fallback = "—") {
  return v != null && v !== "" ? String(v) : fallback;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n: any) {
  const v = parseFloat(n);
  return isNaN(v) ? "—" : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[#5c6a7f] shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] text-[#5c6a7f]">{label}</p>
        <p className={`text-sm font-medium text-[#0f172a] ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = useMemo(() => { const r = params?.customerId; return Array.isArray(r) ? r[0] : r; }, [params]);
  const bookingId  = useMemo(() => { const r = params?.bookingId;  return Array.isArray(r) ? r[0] : r; }, [params]);

  const [data,    setData]    = useState<BookingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  const load = async () => {
    if (!bookingId) return;
    setLoading(true); setError("");
    try {
      const res = await adminOperationalAPI.bookings.overview(Number(bookingId));
      if (res?.status) setData(res.data);
      else setError(res?.message || "Failed to load booking");
    } catch { setError("Could not load booking overview"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [bookingId]);

  const copyUid = () => {
    if (!data?.booking?.booking_uid) return;
    navigator.clipboard.writeText(data.booking.booking_uid).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#eff6ff]" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
      <AlertCircle className="w-8 h-8 text-[#f87171]" />
      <p className="text-[#475569] text-sm">{error || "Booking not found"}</p>
      <button type="button" onClick={load} className="text-[#2563eb] text-sm hover:underline">Try again</button>
    </div>
  );

  const { booking, items, pricing, payment, timeline } = data;
  const state  = booking.lifecycle_state as string || "";
  const isCancelled = ["CANCELLED", "NO_RESPONSE", "FAILED"].includes(state);

  // Derive services: prefer items array (multi-service), fall back to primary service
  const services = items.length > 0
    ? items
    : booking.service_name
    ? [{ item_id: 0, service_name: booking.service_name, quantity: booking.quantity || 1, unit_price: booking.final_price, line_total: booking.final_price, booking_type: booking.booking_type_name }]
    : [];

  const totalAmount = pricing?.final_amount ?? booking.final_price ?? booking.unit_price;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#ffffff] border-b border-[#e2e8f0] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/user-management/users/${customerId}?tab=bookings`)}
            className="p-2 rounded-xl hover:bg-[#f1f5f9] text-[#475569] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#0f172a]">Booking Overview</h1>
            <p className="text-xs text-[#5c6a7f]">{booking.customer_name || `Customer #${booking.customer_id}`}</p>
          </div>
          <button type="button" onClick={load} className="p-2 rounded-xl hover:bg-[#f1f5f9] text-[#53697e] transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href={`/admin/booking-management/workflow/${bookingId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e8f0] text-[#334155] text-xs font-medium hover:bg-[#f8fafc] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Full Operations
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── Booking ID card ────────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 ${isCancelled ? "bg-[#fef2f2] border-[#fecaca]" : "bg-[#ffffff] border-[#e2e8f0]"}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-[#53697e] font-medium uppercase tracking-wide">Booking ID</p>
                <button type="button" onClick={copyUid} className="text-[#5c6a7f] hover:text-[#eff6ff] transition-colors" title="Copy ID">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copied && <span className="text-[10px] text-[#16a34a] font-medium">Copied!</span>}
              </div>
              <p className="font-mono text-lg font-bold text-[#2563eb] tracking-wide">{booking.booking_uid || `#${booking.booking_id}`}</p>
              <p className="text-xs text-[#5c6a7f] mt-0.5">
                {fmtDate(booking.created_at)}
                {booking.is_emergency && <span className="ml-2 px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] text-[10px] font-bold">EMERGENCY</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#53697e] mb-1">Total Amount</p>
              <p className="text-xl font-bold text-[#0f172a]">{fmtCurrency(totalAmount)}</p>
              <StatusBadge state={state} label={booking.status_name} />
            </div>
          </div>
        </div>

        {/* ── Progress stepper ──────────────────────────────────────────────── */}
        {!isCancelled && (
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
            <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide">Current Status</p>
            <ProgressStepper state={state} />
            {state === "BROADCASTED" && (
              <p className="text-xs text-[#d97706] font-medium mt-3 text-center animate-pulse">
                Searching for nearby technicians…
              </p>
            )}
            {state === "NO_RESPONSE" && (
              <p className="text-xs text-[#dc2626] font-medium mt-3 text-center">
                No technician responded. Assign manually or re-broadcast.
              </p>
            )}
          </div>
        )}
        {isCancelled && (
          <div className="bg-[#fef2f2] rounded-2xl border border-[#fecaca] p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-[#7b5757] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#991b1b]">Booking {state.replace(/_/g, " ").toLowerCase()}</p>
              {booking.cancellation_reason && <p className="text-xs text-[#dc2626] mt-0.5">{booking.cancellation_reason}</p>}
            </div>
          </div>
        )}

        {/* ── Technician ────────────────────────────────────────────────────── */}
        {booking.technician_id ? (
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
            <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide">Technician</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#f1f5f9] flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#e2e8f0]">
                {avatar(booking.tech_avatar)
                  ? <img src={avatar(booking.tech_avatar)!} alt="" className="w-full h-full object-cover" />
                  : <User className="w-6 h-6 text-[#5c6a7f]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#0f172a]">{fmt(booking.technician_name)}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {booking.tech_rating && (
                    <span className="flex items-center gap-1 text-xs text-[#d97706] font-semibold">
                      <Star className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                      {parseFloat(booking.tech_rating).toFixed(1)}
                    </span>
                  )}
                  {booking.tech_jobs != null && (
                    <span className="text-xs text-[#53697e]">{booking.tech_jobs}+ jobs</span>
                  )}
                </div>
              </div>
              {booking.tech_mobile && (
                <div className="flex gap-2">
                  <a
                    href={`tel:${booking.tech_mobile}`}
                    className="w-9 h-9 rounded-xl border border-[#e2e8f0] flex items-center justify-center text-[#53697e] hover:bg-[#eff6ff] hover:text-[#2563eb] hover:border-[#bfdbfe] transition-colors"
                    title="Call technician"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/91${booking.tech_mobile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl border border-[#e2e8f0] flex items-center justify-center text-[#53697e] hover:bg-[#f0fdf4] hover:text-[#16a34a] hover:border-[#bbf7d0] transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : !isCancelled ? (
          <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#fffbeb] shrink-0" />
              <p className="text-sm text-[#92400e] font-medium">
                {state === "BROADCASTED" ? "Waiting for technician response…" : "No technician assigned yet"}
              </p>
            </div>
            <Link
              href={`/admin/booking-management/workflow/${bookingId}`}
              className="text-xs font-semibold text-[#b45309] hover:underline"
            >
              Assign →
            </Link>
          </div>
        ) : null}

        {/* ── Appointment details ───────────────────────────────────────────── */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
          <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide">Appointment Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Calendar} label="Scheduled Date" value={fmtDate(booking.scheduled_date)} />
            <InfoRow icon={Clock}    label="Time Slot"      value={
              booking.slot_start && booking.slot_end
                ? `${booking.slot_start} – ${booking.slot_end}`
                : fmt(booking.scheduled_time)
            } />
            <InfoRow icon={MapPin}   label="Service Area"   value={fmt(booking.area_name)} />
            <InfoRow icon={Tag}      label="Booking Type"   value={fmt(booking.booking_type_name, "General Service")} />
            {(booking.service_address || booking.service_city) && (
              <div className="sm:col-span-2 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3 flex gap-2">
                <MapPin className="w-4 h-4 text-[#eff6ff] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-[#5c6a7f]">Service Address</p>
                  <p className="text-sm font-medium text-[#0f172a]">{fmt(booking.service_address)}</p>
                  <p className="text-xs text-[#53697e]">
                    {[booking.service_city, booking.service_state].filter(Boolean).join(", ")}
                    {booking.service_pincode ? ` – ${booking.service_pincode}` : ""}
                  </p>
                </div>
              </div>
            )}
            {booking.problem_description && (() => {
              try {
                const pd = typeof booking.problem_description === "string"
                  ? JSON.parse(booking.problem_description)
                  : booking.problem_description;
                const notes = pd?.notes;
                return notes ? (
                  <div className="sm:col-span-2 rounded-xl bg-[#fffbeb] border border-[#fef3c7] p-3">
                    <p className="text-[11px] text-[#d97706] font-medium mb-0.5">Technician Notes</p>
                    <p className="text-sm text-[#78350f]">{notes}</p>
                  </div>
                ) : null;
              } catch { return null; }
            })()}
          </div>
        </div>

        {/* ── Services booked ───────────────────────────────────────────────── */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
          <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5" /> Services Booked ({services.length})
          </p>
          <div className="divide-y divide-[#f1f5f9]">
            {services.map((item, i) => (
              <div key={item.item_id || i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold text-[#0f172a]">{item.service_name}</p>
                  <p className="text-xs text-[#53697e] mt-0.5">
                    {item.booking_type && <span>{item.booking_type} · </span>}
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#0f172a]">{fmtCurrency(item.line_total || item.unit_price)}</p>
                  {item.line_total === 0 && (
                    <p className="text-[10px] text-[#16a34a] font-medium">Included</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing breakdown ─────────────────────────────────────────────── */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
          <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5" /> Price Details
          </p>
          {pricing ? (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-[#475569]">
                <span>Subtotal</span><span>{fmtCurrency(pricing.subtotal)}</span>
              </div>
              {pricing.platform_fee > 0 && (
                <div className="flex justify-between text-[#475569]">
                  <span>Platform Fee</span><span>{fmtCurrency(pricing.platform_fee)}</span>
                </div>
              )}
              {pricing.surge_amount > 0 && (
                <div className="flex justify-between text-[#475569]">
                  <span>Surge Charge</span><span>{fmtCurrency(pricing.surge_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#475569]">
                <span>GST ({pricing.tax_rate ?? 18}%)</span><span>{fmtCurrency(pricing.tax_amount)}</span>
              </div>
              {pricing.coupon_discount > 0 && (
                <div className="flex justify-between text-[#16a34a] font-medium">
                  <span>Coupon Discount</span><span>−{fmtCurrency(pricing.coupon_discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#0f172a] text-base border-t border-[#e2e8f0] pt-2.5 mt-1">
                <span>Total Amount</span><span>{fmtCurrency(pricing.final_amount)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between font-bold text-[#0f172a] text-base">
                <span>Total Amount</span><span>{fmtCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Payment info ──────────────────────────────────────────────────── */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
          <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Payment
          </p>
          {payment ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3">
                <p className="text-[11px] text-[#5c6a7f] mb-0.5">Method</p>
                <p className="font-semibold text-[#0f172a] capitalize">{payment.payment_mode || payment.gateway || "—"}</p>
              </div>
              <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3">
                <p className="text-[11px] text-[#5c6a7f] mb-0.5">Status</p>
                <p className={`font-semibold text-sm ${payment.status === "success" ? "text-[#16a34a]" : payment.status === "failed" ? "text-[#7b5757]" : "text-[#d97706]"}`}>
                  {payment.status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "—"}
                </p>
              </div>
              {payment.gateway_txn_id && (
                <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3 col-span-2">
                  <p className="text-[11px] text-[#5c6a7f] mb-0.5">Transaction ID</p>
                  <p className="font-mono text-xs text-[#334155] break-all">{payment.gateway_txn_id}</p>
                </div>
              )}
              {payment.completed_at && (
                <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3 col-span-2">
                  <p className="text-[11px] text-[#5c6a7f] mb-0.5">Paid On</p>
                  <p className="text-sm font-medium text-[#0f172a]">
                    {new Date(payment.completed_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#53697e]">
              <CreditCard className="w-4 h-4" />
              <span>
                {booking.payment_mode_name
                  ? `Payment mode: ${booking.payment_mode_name}`
                  : "Payment details not yet available"}
              </span>
            </div>
          )}
        </div>

        {/* ── Timeline ──────────────────────────────────────────────────────── */}
        {timeline.length > 0 && (
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
            <p className="text-xs font-semibold text-[#53697e] mb-4 uppercase tracking-wide">Timeline</p>
            <div>
              {timeline.map((ev, i) => (
                <TimelineItem key={i} event={ev} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          <Link
            href={`/admin/booking-management/workflow/${bookingId}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#bfdbfe] text-[#1d4ed8] text-sm font-semibold hover:bg-[#eff6ff] transition-colors"
          >
            <FileText className="w-4 h-4" /> Full Operations
          </Link>
          {!isCancelled && (
            <Link
              href={`/admin/booking-management/workflow/${bookingId}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-semibold transition-colors"
            >
              <Truck className="w-4 h-4" /> Manage Dispatch
            </Link>
          )}
          {isCancelled && (
            <button
              type="button"
              onClick={() => router.push(`/admin/user-management/users/${customerId}/create-booking`)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> New Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
