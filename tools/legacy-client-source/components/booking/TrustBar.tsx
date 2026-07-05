"use client";

import { ShieldCheck } from "lucide-react";

export function TrustBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-[#d1fae5] bg-[#ecfdf5]/80 px-4 py-3 ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d1fae5]">
        <ShieldCheck size={18} className="text-[#059669]" />
      </div>
      <div>
        <p className="text-[12.5px] font-black text-[#065f46]">Safe & secure booking</p>
        <p className="text-[11px] text-[#047857]/80">
          Your payment is encrypted and protected
        </p>
      </div>
    </div>
  );
}
