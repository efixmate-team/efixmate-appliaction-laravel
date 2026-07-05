"use client";

import { useEffect, useState } from "react";
import { Plus, ExternalLink, CalendarDays, Package, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerAdminAPI } from "@/lib/api/userApi";
import { CreateBookingWizard } from "./CreateBookingWizard";

interface Booking {
  booking_id: number;
  booking_uid?: string;
  service?: string;
  service_category?: string;
  status?: string;
  booking_status?: string;
  final_price?: number;
  base_price?: number;
  scheduled_date?: string;
  created_at?: string;
  lifecycle_state?: string;
}

interface Props {
  customerId: number;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-[#d1fae5] text-[#047857]",
  completed: "bg-[#e0f2fe] text-[#0369a1]",
  cancelled: "bg-[#ffe4e6] text-[#be123c]",
  pending: "bg-[#fef3c7] text-[#b45309]",
  in_progress: "bg-[#ede9fe] text-[#6d28d9]",
  assigned: "bg-[#dbeafe] text-[#1d4ed8]",
};

function statusColor(s?: string) {
  if (!s) return "bg-[#f1f5f9] text-[#475569]";
  return STATUS_COLORS[s.toLowerCase().replace(/ /g, "_")] ?? "bg-[#f1f5f9] text-[#475569]";
}

function fmt(n?: number) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function BookingsPanel({ customerId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    const res = await customerAdminAPI.getUserBookings({ customerId });
    if (res?.status && res.data) {
      setBookings(
        Array.isArray(res.data)
          ? (res.data as Booking[])
          : (res.data as { bookings?: Booking[] }).bookings ?? []
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadBookings();
  }, [customerId]);

  return (
    <>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#334155]">Booking History</p>
            <p className="text-xs text-[#94a3b8]">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} found</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Booking
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-[#94a3b8] text-sm">
            Loading bookings…
          </div>
        )}

        {/* Empty */}
        {!loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#94a3b8]">
            <CalendarDays className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No bookings yet</p>
            <p className="text-xs text-center max-w-xs">
              This customer has no bookings. Click <strong>Create Booking</strong> to create one on their behalf.
            </p>
            <Button
              size="sm"
              onClick={() => setShowWizard(true)}
              className="mt-1 bg-[#0284c7] hover:bg-[#0369a1]"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create Booking
            </Button>
          </div>
        )}

        {/* Bookings list */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-2">
            {bookings.map((b) => {
              const label = b.booking_status || b.lifecycle_state || b.status || "—";
              return (
                <div
                  key={b.booking_id}
                  className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-3 hover:border-[#bae6fd] hover:bg-[#f0f9ff]/30 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e0f2fe]">
                    <Package className="h-5 w-5 text-[#0284c7]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#1e293b] truncate">
                        {b.service || b.service_category || `Booking #${b.booking_id}`}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(label)}`}>
                        {label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#53697e]">
                      {b.booking_uid && <span>ID: {b.booking_uid}</span>}
                      {b.service_category && b.service && (
                        <span>{b.service_category}</span>
                      )}
                      <span>
                        {b.scheduled_date
                          ? `Scheduled: ${fmtDate(b.scheduled_date)}`
                          : `Created: ${fmtDate(b.created_at)}`}
                      </span>
                    </div>
                  </div>

                  {/* Price + Link */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5 text-sm font-semibold text-[#334155]">
                      <IndianRupee className="h-3 w-3" />
                      {Number(b.final_price ?? b.base_price ?? 0).toLocaleString("en-IN")}
                    </div>
                    <a
                      href={`/admin/booking-management/bookings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[11px] text-[#0284c7] hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showWizard && (
        <CreateBookingWizard
          customerId={customerId}
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            void loadBookings();
          }}
        />
      )}
    </>
  );
}
