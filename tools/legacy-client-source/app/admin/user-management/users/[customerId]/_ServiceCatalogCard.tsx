"use client";

import { Clock, IndianRupee } from "lucide-react";

export type ServiceSlot = {
  slot_id: number;
  name: string;
  time: string;
  price: number | null;
  available: boolean;
  charges?: { id: number; name: string; type: string; value: string | null }[];
  discounts?: { id: number; name: string; type?: string | null; value?: string | null }[];
  coupons?: { id: number; code: string; type?: string | null; value?: string | null; min_order_amount?: string | null }[];
};

export type ServiceCatalogItem = {
  service_id: number;
  title?: string;
  service?: string;
  duration_minutes?: number | null;
  price?: number | null;
  base_price?: number | null;
  booking_types?: { id: number; name: string }[];
  units?: { unit_id: number; name: string; type: string; price_per_unit?: number | string }[];
  slots?: ServiceSlot[];
  charges?: { id: number; name: string; type: string; value: string | null }[];
  discounts?: { id: number; name: string; type?: string | null; value?: string | null }[];
  coupons?: { id: number; code: string; type?: string | null; value?: string | null; min_order_amount?: string | null }[];
};

function formatPricingValue(type?: string | null, value?: string | null) {
  if (value == null || value === "") return "—";
  if (String(type || "").toUpperCase() === "PERCENTAGE") return `${value}%`;
  return `₹${value}`;
}

function DetailChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc]/80 p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c6a7f]">{label}</p>
      {children}
    </div>
  );
}

export default function ServiceCatalogCard({ svc }: { svc: ServiceCatalogItem }) {
  const displayPrice = svc.price ?? svc.base_price;

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[#f1f5f9] pb-3">
        <div>
          <p className="text-base font-semibold text-[#0f172a]">{svc.title || svc.service || "—"}</p>
          <p className="text-xs text-[#53697e] mt-0.5">Service ID {svc.service_id}</p>
          {svc.duration_minutes != null && (
            <p className="text-xs text-[#53697e] mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {svc.duration_minutes} min
            </p>
          )}
        </div>
        {displayPrice != null && (
          <span className="inline-flex items-center gap-1 text-base font-bold px-3 py-1.5 rounded-lg bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] shrink-0">
            <IndianRupee className="w-4 h-4" />
            {displayPrice}
          </span>
        )}
      </div>

      <p className="text-xs text-[#53697e]">
        Slots, charges, and coupons are loaded at checkout via cart APIs (not on the catalog list).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(svc.booking_types?.length ?? 0) > 0 && (
          <DetailChip label="Booking types">
            <div className="flex flex-wrap gap-1">
              {svc.booking_types!.map((bt) => (
                <span key={bt.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f3ff] text-[#6d28d9]">
                  {bt.name}
                </span>
              ))}
            </div>
          </DetailChip>
        )}

        {(svc.units?.length ?? 0) > 0 && (
          <DetailChip label="Units">
            <ul className="space-y-1">
              {svc.units!.map((u) => (
                <li key={u.unit_id} className="text-xs text-[#334155]">
                  {u.name} ({u.type}){u.price_per_unit != null ? ` · ₹${u.price_per_unit}/unit` : ""}
                </li>
              ))}
            </ul>
          </DetailChip>
        )}
      </div>
    </div>
  );
}
