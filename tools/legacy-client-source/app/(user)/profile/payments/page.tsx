"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";

export default function PaymentMethodsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-[17px] font-semibold text-[#0f172a]">Payment Methods</h1>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff]">
          <CreditCard size={26} className="text-[#2563eb]" />
        </div>
        <p className="text-[14px] font-semibold text-[#0f172a]">No saved payment methods</p>
        <p className="mt-1 text-[12px] text-[#64748b]">
          Save your cards or UPI IDs for faster checkout.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
        >
          <Plus size={14} />
          Add Payment Method
        </button>
        <p className="mt-3 text-[11px] text-[#94a3b8]">
          Payment method management coming soon.
        </p>
      </div>
    </div>
  );
}
