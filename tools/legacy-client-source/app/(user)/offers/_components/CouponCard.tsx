"use client";

import { useState } from "react";
import {
  ChevronDown,
  Clock,
  Crown,
  Flame,
  LayoutGrid,
  Star,
  Tag,
  Users,
} from "lucide-react";
import type { CategoryBadgeKind, OfferCoupon } from "../_lib/offersData";

const PAGE_BG = "#f0f4ff";

function CategoryIcon({ kind }: { kind: CategoryBadgeKind }) {
  const cls = "h-3 w-3 shrink-0";
  if (kind === "flame") return <Flame className={`${cls} text-[#ea580c]`} />;
  if (kind === "crown") return <Crown className={`${cls} text-[#d97706]`} />;
  if (kind === "first") return <Tag className={`${cls} text-[#16a34a]`} />;
  if (kind === "ac") return <Tag className={`${cls} text-[#0284c7]`} />;
  return <Tag className={`${cls} text-[#94a3b8]`} />;
}

const BADGE_CLS: Partial<Record<CategoryBadgeKind, string>> = {
  flame: "border-[#ffedd5] bg-[#fff7ed] text-[#c2410c]",
  crown: "border-[#fef3c7] bg-[#fffbeb] text-[#b45309]",
  first: "border-[#d1fae5] bg-[#ecfdf5] text-[#047857]",
  ac: "border-[#e0f2fe] bg-[#f0f9ff] text-[#0369a1]",
};

type Props = {
  coupon: OfferCoupon;
  onApply: (code: string, maxSavings: number) => void;
  applying?: boolean;
  highlighted?: boolean;
};

export function CouponCard({ coupon, onApply, applying, highlighted }: Props) {
  const [expanded, setExpanded] = useState(false);

  const badgeCls =
    BADGE_CLS[coupon.categoryBadge.kind] ??
    "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-[#ffffff] transition-all duration-200 hover:shadow-md ${
        highlighted
          ? "border-[#60a5fa] shadow-md ring-2 ring-[#dbeafe]"
          : "border-[#e5e7eb] shadow-sm"
      }`}
    >
      {/* ── Ticket notch — top ─────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-3 left-[90px] z-10 h-6 w-6 -translate-x-1/2 rounded-full sm:left-[100px]"
        style={{ backgroundColor: PAGE_BG }}
      />
      {/* ── Ticket notch — bottom ──────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-[90px] z-10 h-6 w-6 -translate-x-1/2 rounded-full sm:left-[100px]"
        style={{ backgroundColor: PAGE_BG }}
      />
      {/* ── Dashed separator line between notches ──────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-[90px] z-10 -translate-x-px border-l-2 border-dashed border-[#e5e7eb] sm:left-[100px]"
      />

      <div className="flex items-center">
        {/* Ticket stub */}
        <div
          className="flex w-[90px] shrink-0 self-stretch flex-col items-center justify-center gap-1 px-2 py-5 text-center text-[#ffffff] sm:w-[100px]"
          style={{ backgroundColor: coupon.stubColor }}
        >
          <p className="text-[15px] font-black leading-tight tracking-wide sm:text-[16px]">
            {coupon.code}
          </p>
          <p className="flex items-center justify-center gap-0.5 text-[8px] font-bold uppercase leading-tight tracking-widest opacity-90">
            {coupon.stubLabel.includes("BEST") && (
              <Star className="h-2 w-2 shrink-0 fill-[#ffffff]" />
            )}
            <span>{coupon.stubLabel}</span>
          </p>
        </div>

        {/* Info + Actions */}
        <div className="flex min-w-0 flex-1 items-center gap-3 p-4 sm:gap-5 sm:pr-5">
          {/* Info */}
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badgeCls}`}
            >
              <CategoryIcon kind={coupon.categoryBadge.kind} />
              {coupon.categoryBadge.label}
            </span>
            <h3 className="mt-1.5 text-[18px] font-black leading-tight text-[#111827] sm:text-[20px]">
              {coupon.title}
            </h3>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">{coupon.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#9ca3af]">
              <span className="inline-flex items-center gap-1.5">
                {coupon.plusOnly ? (
                  <Users className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                )}
                {coupon.scopeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Valid till {coupon.validUntil}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col items-end gap-2 sm:w-[136px] sm:items-stretch">
            <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-[11px] font-bold text-[#047857] sm:rounded-lg sm:text-center sm:text-[12px]">
              Save up to ₹{coupon.maxSavings}
            </span>
            <button
              type="button"
              disabled={applying}
              onClick={() => onApply(coupon.code, coupon.maxSavings)}
              className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-[12px] font-bold text-[#ffffff] transition-colors hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-60"
            >
              {applying ? "Copying…" : "Copy Coupon"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center justify-end gap-0.5 text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] sm:justify-center"
            >
              View Details
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {expanded && coupon.details && (
        <div className="border-t border-[#f3f4f6] bg-[#f9fafb] px-4 py-3.5 text-[12px] leading-relaxed text-[#6b7280] sm:pl-[112px]">
          {coupon.details}
        </div>
      )}
    </article>
  );
}
