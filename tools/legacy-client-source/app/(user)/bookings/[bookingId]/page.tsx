"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Calendar, CalendarDays, Check, ChevronLeft, ChevronRight,
  Clock, Copy, Download, FileX, Headphones, MapPin, RotateCcw, Shield, Star,
  Tag, Truck, User, Wrench, X,
} from "lucide-react";
import { getBookingDetail } from "@/lib/api/userClient";
import { resolveServiceImageUrl } from "@/lib/serviceImage";

type Address = { address?: string; city?: string; state?: string; pincode?: string; latitude?: string; longitude?: string };
type Slot = { slot_id?: number; name?: string; start_time?: string; end_time?: string };
type BookingLine = {
  service_id?: number; service_name?: string; service_icon?: string;
  image?: string;
  quantity?: number; line_total?: number; booking_type_label?: string; photos?: string[];
};
type PriceBreakup = {
  subtotal?: number; platform_fee?: number; tax_percent?: number; tax_amount?: number; total?: number;
};
type Payment = { transaction_id?: string; amount?: number; paid_at?: string; payment_mode?: string };
type TimelineStep = { key: string; title: string; subtitle?: string; timestamp?: string; at?: string; done?: boolean; active?: boolean; pending?: boolean };
type TimelinePayload = TimelineStep[] | { steps?: TimelineStep[]; raw_logs?: unknown[] } | null | undefined;

type BookingDetail = {
  booking: {
    booking_id: number; booking_uid?: string;
    booking_status_id?: number; booking_status_label?: string;
    payment_status_id?: number;
    lifecycle_state?: string;
    scheduled_date?: string; scheduled_time?: string;
    slot?: Slot; slot_summary?: string;
    address?: Address;
    category_name?: string; booking_type_id?: number;
    customer_instructions?: string;
  };
  lines: BookingLine[];
  price_breakup?: PriceBreakup;
  payment?: Payment | null;
  timeline?: TimelinePayload;
};

const NEXT_STEPS = [
  { key: "confirmed",  label: "Booking Confirmed",    Icon: CalendarDays, color: "#0e55d9" },
  { key: "assigned",   label: "Technician Assigned",  Icon: User,         color: "#8b5cf6" },
  { key: "on_the_way", label: "On The Way",           Icon: Truck,        color: "#f59e0b" },
  { key: "completed",  label: "Job Completed",        Icon: Wrench,       color: "#10b981" },
] as const;

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />;
}

function fmt(date?: string) {
  if (!date) return "";
  const d = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", weekday: "long" });
}

function normalizeTimeline(timeline: TimelinePayload): TimelineStep[] {
  const steps = Array.isArray(timeline) ? timeline : timeline?.steps;
  if (!Array.isArray(steps)) return [];

  return steps.map((step) => ({
    ...step,
    done: step.done ?? step.pending === false,
    timestamp: step.timestamp ?? step.at,
  }));
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [data,    setData]    = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getBookingDetail(bookingId) as { status: boolean; data?: BookingDetail };
      if (res.data) setData(res.data);
      setLoading(false);
    })();
  }, [bookingId]);

  const copyUid = async (uid: string) => {
    await navigator.clipboard.writeText(uid).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 animate-pulse">
        {/* Back nav */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-[#e2e8f0]" />
          <div className="h-4 w-32 rounded bg-[#e2e8f0]" />
          <div className="h-4 w-16 rounded bg-[#e2e8f0]" />
        </div>
        {/* Confirmed banner */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-[#e2e8f0]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 rounded bg-[#e2e8f0]" />
              <div className="h-3 w-full rounded bg-[#f1f5f9]" />
              <div className="h-3 w-3/4 rounded bg-[#f1f5f9]" />
              <div className="h-8 w-48 rounded-lg bg-[#f1f5f9] mt-2" />
            </div>
          </div>
        </div>
        {/* Overview grid */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f8fafc] px-5 py-3">
            <div className="h-4 w-36 rounded bg-[#e2e8f0]" />
            <div className="h-5 w-24 rounded-full bg-[#f1f5f9]" />
          </div>
          <div className="grid grid-cols-2 gap-0">
            <div className="space-y-4 p-5 border-r border-[#f8fafc]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-[#f1f5f9]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2.5 w-16 rounded bg-[#f1f5f9]" />
                    <div className="h-3.5 w-32 rounded bg-[#e2e8f0]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 p-5">
              <div className="h-3 w-24 rounded bg-[#f1f5f9]" />
              <div className="h-8 w-28 rounded bg-[#e2e8f0]" />
              <div className="h-4 w-32 rounded bg-[#f1f5f9]" />
              <div className="h-3 w-24 rounded bg-[#f1f5f9]" />
            </div>
          </div>
        </div>
        {/* Services */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] overflow-hidden">
          <div className="border-b border-[#f8fafc] px-5 py-3">
            <div className="h-4 w-36 rounded bg-[#e2e8f0]" />
          </div>
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 border-b border-[#f8fafc] px-5 py-4 last:border-0">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-[#f1f5f9]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-[#e2e8f0]" />
                <div className="h-3 w-1/3 rounded bg-[#f1f5f9]" />
                <div className="h-3 w-1/4 rounded bg-[#f1f5f9]" />
              </div>
              <div className="h-4 w-16 rounded bg-[#f1f5f9]" />
            </div>
          ))}
        </div>
        {/* Payment + stepper */}
        {[1, 2].map(i => (
          <div key={i} className="h-40 rounded-2xl border border-[#f1f5f9] bg-[#ffffff]" />
        ))}
      </div>
    </div>
  );
  if (!data) return (
    <div className="flex flex-col items-center py-24 text-center">
      <FileX size={48} className="text-[#e2e8f0] mb-3" />
      <p className="text-[15px] font-semibold text-[#64748b]">Booking not found</p>
      <Link href="/bookings" className="mt-4 text-[13px] font-semibold text-[#0e55d9]">← Back to bookings</Link>
    </div>
  );

  const { booking, lines: rawLines, price_breakup: pb, payment, timeline } = data;
  const timelineSteps = normalizeTimeline(timeline);
  const lines = rawLines ?? [];
  const uid      = booking.booking_uid ?? String(booking.booking_id);
  const isPaid   = Number(booking.payment_status_id) === 2;
  const addr     = booking.address;
  const addrStr  = [addr?.address, addr?.city, addr?.pincode].filter(Boolean).join(", ");
  const total    = pb?.total ?? payment?.amount ?? 0;
  const isActive = ["TECHNICIAN_ASSIGNED","ON_THE_WAY","JOB_STARTED"].includes(booking.lifecycle_state ?? "");

  // Which next-step is "done" based on timeline
  const doneKeys = new Set(timelineSteps.filter(s => s.done).map(s => s.key));

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">

        {/* ── Header nav ── */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#0e55d9] transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="text-[16px] font-black text-[#0f172a]">Booking Details</h1>
          <Link href="/contact" className="flex flex-col items-center text-[#64748b] hover:text-[#0e55d9]">
            <Headphones size={18} />
            <span className="text-[10px] font-semibold mt-0.5">Support</span>
          </Link>
        </div>

        {/* ── Booking Confirmed banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm">
          {/* Confetti dots */}
          {[["#0e55d9","top-3 left-8"],["#10b981","top-5 left-16"],["#f59e0b","top-2 left-24"],
            ["#ec4899","top-8 left-32"],["#8b5cf6","top-3 right-16"],["#0e55d9","top-6 right-8"],
            ["#10b981","top-10 right-24"],["#f59e0b","bottom-4 left-12"],["#ec4899","bottom-3 right-12"],
          ].map(([color, pos], i) => (
            <span key={i} className={`pointer-events-none absolute h-2 w-2 rounded-full opacity-70 ${pos}`}
              style={{ background: color }} />
          ))}

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] shadow-lg shadow-[#a7f3d0]">
              <Check size={28} className="text-[#ffffff]" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-black text-[#059669]">Booking Confirmed!</p>
              <p className="mt-0.5 text-[12.5px] text-[#64748b] leading-relaxed">
                Thank you! Your booking has been placed successfully.<br />
                We&apos;ll connect you with the best technician.
              </p>
              <div className="mt-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#94a3b8]">Booking ID</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-mono text-[17px] font-black text-[#0e55d9]">{uid}</p>
                  <button type="button" onClick={() => copyUid(uid)}
                    className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-bold text-[#64748b] hover:border-[#0e55d9]/30 hover:text-[#0e55d9] transition-all">
                    {copied ? <Check size={11} className="text-[#ecfdf5]" /> : <Copy size={11} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Booking Overview ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3">
            <h2 className="text-[14px] font-black text-[#0f172a]">Booking Overview</h2>
            {isPaid && (
              <span className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1 text-[11px] font-bold text-[#047857]">
                Payment Paid
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-0">
            {/* Left: booking meta */}
            <div className="space-y-4 p-5 border-b sm:border-b-0 sm:border-r border-[#f1f5f9]">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                  <Calendar size={15} className="text-[#0e55d9]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#94a3b8]">Scheduled On</p>
                  <p className="text-[13px] font-bold text-[#0f172a]">{fmt(booking.scheduled_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                  <Clock size={15} className="text-[#0e55d9]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#94a3b8]">Time Slot</p>
                  <p className="text-[13px] font-bold text-[#0f172a]">
                    {booking.slot_summary ?? booking.slot?.name ?? booking.scheduled_time ?? "—"}
                  </p>
                </div>
              </div>
              {addrStr && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                    <MapPin size={15} className="text-[#0e55d9]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#94a3b8]">Address</p>
                    <p className="text-[13px] font-bold text-[#0f172a]">{addrStr}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                  <Tag size={15} className="text-[#0e55d9]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#94a3b8]">Booking Type</p>
                  <p className="text-[13px] font-bold text-[#0f172a]">{booking.category_name ?? "General Service"}</p>
                </div>
              </div>
            </div>

            {/* Right: summary + payment */}
            <div className="flex flex-col justify-between p-5">
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8]">Total Services</p>
                <p className="text-[15px] font-black text-[#0f172a]">{lines.length} Service{lines.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-[#94a3b8]">Total Amount</p>
                <p className="text-[28px] font-black text-[#0f172a] leading-none mt-1">₹{total.toLocaleString("en-IN")}</p>
              </div>
              {isPaid && (
                <div className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-[#059669]">
                  <BadgeCheck size={15} /> Paid Successfully
                </div>
              )}
              <button type="button" className="mt-3 flex items-center gap-1 text-[12px] font-bold text-[#0e55d9] hover:underline w-fit">
                View Price Breakup <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Services Booked ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
          <div className="border-b border-[#f1f5f9] px-5 py-3">
            <h2 className="text-[14px] font-black text-[#0f172a]">Services Booked ({lines.length})</h2>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {lines.map((line, i) => {
              const serviceIcon = resolveServiceImageUrl(line.service_icon ?? line.image);
              return (
              <div key={i} className="p-4">
                <div className="flex items-center gap-3">
                  {/* Service icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                    {serviceIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={serviceIcon} alt="" className="h-10 w-10 object-contain" />
                    ) : (
                      <Wrench size={22} className="text-[#94a3b8]" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#0f172a]">{line.service_name ?? "Service"}</p>
                    <p className="text-[12px] text-[#64748b]">{line.booking_type_label ?? "General Service"}</p>
                    <p className="text-[11px] text-[#94a3b8]">Qty: {line.quantity ?? 1} Unit</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-[15px] font-black text-[#0f172a]">
                      {line.line_total ? `₹${line.line_total.toLocaleString("en-IN")}` : <span className="text-[#94a3b8] text-[12px]">Included</span>}
                    </p>
                    <ChevronRight size={14} className="text-[#94a3b8]" />
                  </div>
                </div>

                {/* Attached photos */}
                {Array.isArray(line.photos) && line.photos.length > 0 && (
                  <div className="mt-3 pl-[68px]">
                    <p className="mb-2 text-[11px] font-semibold text-[#64748b]">Attached Photos ({line.photos.length})</p>
                    <div className="flex gap-2">
                      {line.photos.slice(0, 3).map((url, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={j} src={url} alt="" className="h-16 w-16 rounded-xl object-cover border border-[#e2e8f0]" />
                      ))}
                      {line.photos.length > 3 && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[12px] font-bold text-[#64748b]">
                          +{line.photos.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* ── Payment Details ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
          <div className="border-b border-[#f1f5f9] px-5 py-3">
            <h2 className="text-[14px] font-black text-[#0f172a]">Payment Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-0">
            {/* Left: price rows */}
            <div className="p-5 space-y-2.5 border-b sm:border-b-0 sm:border-r border-[#f1f5f9]">
              {pb?.subtotal != null && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-[#64748b]">Subtotal ({lines.length} Services)</span>
                  <span className="font-semibold text-[#374151]">₹{pb.subtotal.toLocaleString("en-IN")}</span>
                </div>
              )}
              {pb?.platform_fee != null && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="flex items-center gap-1 text-[#64748b]">Platform Fee</span>
                  <span className="font-semibold text-[#374151]">₹{pb.platform_fee}</span>
                </div>
              )}
              {pb?.tax_amount != null && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-[#64748b]">Taxes ({pb.tax_percent ?? 18}% GST)</span>
                  <span className="font-semibold text-[#374151]">₹{pb.tax_amount}</span>
                </div>
              )}
              <div className="h-px bg-[#f1f5f9]" />
              <div className="flex justify-between">
                <span className="text-[13px] font-black text-[#0f172a]">Total Amount</span>
                <span className="text-[16px] font-black text-[#0f172a]">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Right: transaction details */}
            <div className="p-5 space-y-3">
              {payment?.payment_mode && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-[#94a3b8]">Payment Method</span>
                  <span className="font-semibold text-[#374151]">{payment.payment_mode}</span>
                </div>
              )}
              {payment?.transaction_id && (
                <div className="flex justify-between text-[12.5px] gap-2">
                  <span className="text-[#94a3b8] shrink-0">Transaction ID</span>
                  <span className="font-mono text-[11.5px] font-semibold text-[#374151] text-right truncate max-w-[160px]">{payment.transaction_id}</span>
                </div>
              )}
              {payment?.paid_at && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-[#94a3b8]">Paid On</span>
                  <span className="font-semibold text-[#374151]">
                    {new Date(payment.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              <button type="button" className="flex items-center gap-1.5 text-[12px] font-bold text-[#0e55d9] hover:underline mt-2">
                <Download size={13} /> Download Invoice
              </button>
            </div>
          </div>
        </div>

        {/* ── What happens next ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm">
          <h2 className="mb-5 text-[14px] font-black text-[#0f172a]">What happens next?</h2>
          <div className="relative flex items-start justify-between">
            {/* Dashed connector line */}
            <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-px border-t-2 border-dashed border-[#e2e8f0]" />
            {NEXT_STEPS.map(({ key, label, Icon, color }, i) => {
              const done = doneKeys.has(key) || i === 0; // first step always done after confirm
              return (
                <div key={key} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    done ? "border-transparent text-[#ffffff]" : "border-[#e2e8f0] bg-[#ffffff] text-[#cbd5e1]"
                  }`} style={done ? { background: color } : {}}>
                    <Icon size={17} strokeWidth={done ? 2 : 1.8} />
                  </div>
                  <p className={`text-[10.5px] font-bold leading-tight max-w-[64px] ${done ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                    {label}
                  </p>
                  {(() => {
                    const tStep = timelineSteps.find(s => s.key === key);
                    return tStep?.timestamp ? (
                      <p className="text-[9.5px] text-[#94a3b8]">
                        {new Date(tStep.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                    ) : !done ? (
                      <p className="text-[9.5px] text-[#cbd5e1]">Upcoming</p>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Need help ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
          <div className="border-b border-[#f1f5f9] px-5 py-3">
            <h2 className="text-[14px] font-black text-[#0f172a]">Need help or change something?</h2>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {[
              { Icon: RotateCcw, label: "Reschedule", sub: "Change date or time",   color: "#0e55d9" },
              { Icon: MapPin,    label: "Change Address", sub: "Update your address", color: "#0e55d9" },
              { Icon: X,         label: "Cancel Booking", sub: "Cancel this booking", color: "#ef4444" },
            ].map(({ Icon, label, sub, color }) => (
              <button key={label} type="button"
                className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[#f8fafc] transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#0f172a]">{label}</p>
                  <p className="text-[11px] text-[#94a3b8]">{sub}</p>
                </div>
                <ChevronRight size={16} className="text-[#cbd5e1]" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Support banner ── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0e55d9] to-[#312e81] p-4 text-[#ffffff]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffffff]/10">
              <User size={28} className="text-[#ffffff]/80" />
            </div>
            <div>
              <p className="text-[13px] font-black">We&apos;re here to help!</p>
              <p className="text-[11px] text-[#ffffff]/70 mt-0.5">Our support team is available 24/7 for you.</p>
              <Link href="/contact"
                className="mt-2 flex w-fit items-center gap-1.5 rounded-lg bg-[#ffffff]/15 px-3 py-1.5 text-[11px] font-bold hover:bg-[#ffffff]/25 transition-colors">
                <Headphones size={12} /> Contact Support
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
              <Shield size={28} className="text-[#0e55d9]" />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a]">Your booking is safe with us</p>
              <p className="text-[11px] text-[#64748b] mt-0.5">We use industry-standard security to protect your data.</p>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA spacer ── */}
        <div className="h-2" />
      </div>

      {/* ── Sticky bottom actions ── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[#e2e8f0] bg-[#ffffff]/95 px-4 py-3 backdrop-blur-md lg:bottom-0">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Link href="/bookings"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#ffffff] py-3.5 text-[13px] font-bold text-[#374151] hover:border-[#0e55d9]/30 hover:text-[#0e55d9] transition-all">
            Go to My Bookings
          </Link>
          <Link href={`/bookings/${bookingId}/track`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[13px] font-black text-[#ffffff] shadow-[0_4px_16px_rgba(14,85,217,0.28)] hover:bg-[#0a46b8] transition-all">
            <MapPin size={15} /> Track Booking <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
