"use client";

import Link from "next/link";
import { Headset, Percent, ShoppingBag, Smile, Tag } from "lucide-react";

const STEPS = [
  {
    icon: Tag,
    color: "#2563EB",
    bg: "#EFF6FF",
    text: "Choose a coupon you want to apply",
  },
  {
    icon: ShoppingBag,
    color: "#10B981",
    bg: "#ECFDF5",
    text: "Add it to your booking",
  },
  {
    icon: Percent,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    text: "Discount applied automatically",
  },
  {
    icon: Smile,
    color: "#F59E0B",
    bg: "#FFFBEB",
    text: "Enjoy your savings!",
  },
];

export function OffersSidebar() {
  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-[80px] lg:self-start">
      {/* How It Works */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-5 shadow-sm">
        <h2 className="text-[16px] font-black text-[#111827]">How It Works</h2>
        <p className="mt-1 text-[12px] text-[#9ca3af]">
          4 simple steps to unlock your discount
        </p>
        <ol className="mt-5 space-y-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.text} className="flex gap-3.5 pb-5 last:pb-0">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: step.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: step.color }} />
                  </div>
                  {!isLast && (
                    <div className="mt-1 flex-1 border-l border-dashed border-[#e5e7eb]" />
                  )}
                </div>
                {/* Text */}
                <div className="min-w-0 pt-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: step.color }}
                  >
                    Step {i + 1}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#4b5563]">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Help card */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-gradient-to-br from-[#eff6ff] to-[#ffffff] p-5 shadow-sm">
        <h2 className="text-[16px] font-black text-[#111827]">Need Help?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#344352]">
          Our support team is here to help with any coupon-related queries.
        </p>
        <Link
          href="/contact"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#ffffff] px-4 py-3 text-[13px] font-bold text-[#2563eb] shadow-sm transition-colors hover:bg-[#eff6ff]"
        >
          <Headset className="h-4 w-4" />
          Contact Support
        </Link>
      </div>
    </aside>
  );
}