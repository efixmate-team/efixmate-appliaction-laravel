"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { AnimatedAmount } from "./AnimatedAmount";

type Row = { label: string; value: number; highlight?: boolean; negative?: boolean };

type Props = {
  subtotal: number;
  platformFee: number;
  tax: number;
  couponDiscount: number;
  couponCode?: string | null;
  total: number;
  loading?: boolean;
  defaultOpen?: boolean;
};

export function PriceBreakdown({
  subtotal,
  platformFee,
  tax,
  couponDiscount,
  couponCode,
  total,
  loading,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const rows: Row[] = [
    { label: "Subtotal", value: subtotal },
    { label: "Platform fee", value: platformFee },
    { label: "Taxes (GST)", value: tax },
  ];
  if (couponDiscount > 0) {
    rows.push({
      label: couponCode ? `Coupon (${couponCode})` : "Coupon discount",
      value: couponDiscount,
      negative: true,
    });
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[13px] font-black text-[#0f172a]">Price details</span>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin text-[#64748b]" />}
          <AnimatedAmount value={total} className="text-[15px] font-black text-[#0e55d9]" />
          <ChevronDown
            size={16}
            className={`text-[#64748b] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2.5 border-t border-[#f1f5f9] px-4 pb-4 pt-3">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-[13px]">
                <span className="text-[#64748b]">{row.label}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    row.negative ? "text-[#059669]" : "text-[#0f172a]"
                  }`}
                >
                  {row.negative ? "−" : ""}₹{row.value.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div className="h-px bg-[#f1f5f9]" />
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-black text-[#0f172a]">Final total</span>
              <AnimatedAmount
                value={total}
                className="text-[16px] font-black text-[#0e55d9]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
