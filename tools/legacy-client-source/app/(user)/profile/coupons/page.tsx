"use client";

import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";

export default function MyCouponsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-[17px] font-semibold text-[#0f172a]">My Coupons</h1>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fdf4]">
          <Tag size={26} className="text-[#16a34a]" />
        </div>
        <p className="text-[14px] font-semibold text-[#0f172a]">No coupons saved</p>
        <p className="mt-1 text-[12px] text-[#64748b]">
          Coupons you copy or claim will appear here.
        </p>
        <Link
          href="/offers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#15803d]"
        >
          Browse Offers
        </Link>
      </div>
    </div>
  );
}
