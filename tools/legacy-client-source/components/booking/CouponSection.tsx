"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Tag } from "lucide-react";
import { getCoupons } from "@/lib/api/userClient";

type Coupon = {
  code: string;
  title?: string;
  discount_label?: string;
  valid_until?: string;
};

type Props = {
  appliedCode: string | null;
  savings: number;
  couponInput: string;
  onInputChange: (v: string) => void;
  onApply: (code: string) => void;
  onRemove: () => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
};

function parseCoupons(raw: unknown): Coupon[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const rows = Array.isArray(o.data) ? o.data : Array.isArray(o.result) ? o.result : [];
  return rows
    .map((row): Coupon | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const code = String(r.coupon_code ?? r.code ?? "").trim();
      if (!code) return null;
      return {
        code,
        title: r.title ? String(r.title) : undefined,
        discount_label: r.discount_label
          ? String(r.discount_label)
          : r.discount_value
            ? `${r.discount_value}${r.discount_type === "PERCENT" ? "% off" : " off"}`
            : undefined,
        valid_until: r.valid_until ? String(r.valid_until) : undefined,
      };
    })
    .filter((c): c is Coupon => c != null);
}

export function CouponSection({
  appliedCode,
  savings,
  couponInput,
  onInputChange,
  onApply,
  onRemove,
  loading,
  error,
  disabled,
}: Props) {
  const [suggestions, setSuggestions] = useState<Coupon[]>([]);

  useEffect(() => {
    if (appliedCode) return;
    (async () => {
      try {
        const res = await getCoupons();
        setSuggestions(parseCoupons(res).slice(0, 6));
      } catch {
        setSuggestions([
          { code: "WELCOME20", discount_label: "20% off first booking" },
          { code: "SAVE100", discount_label: "â‚¹100 off" },
          { code: "ELEC10", discount_label: "10% off electrical" },
        ]);
      }
    })();
  }, [appliedCode]);

  if (appliedCode && savings > 0) {
    return (
      <div className="rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d1fae5]">
            <CheckCircle size={20} className="text-[#059669]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-black text-[#065f46]">Coupon applied successfully</p>
            <p className="mt-0.5 text-[12px] text-[#047857]">
              <span className="font-bold">{appliedCode}</span> - You save â‚¹{savings}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-lg border border-[#6ee7b7] px-2.5 py-1 text-[11px] font-bold text-[#047857] hover:bg-[#ffffff]"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tag size={16} className="text-[#0e55d9]" />
        <h2 className="text-[14px] font-black text-[#0f172a]">Apply coupon & save more</h2>
      </div>

      {suggestions.length > 0 && (
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestions.map((c) => (
            <div
              key={c.code}
              className="min-w-[160px] shrink-0 rounded-xl border border-dashed border-[#0e55d9]/40 bg-[#f0f6ff] p-3"
            >
              <p className="text-[13px] font-black text-[#0e55d9]">{c.code}</p>
              {c.discount_label && (
                <p className="mt-0.5 text-[11px] text-[#64748b]">{c.discount_label}</p>
              )}
              <button
                type="button"
                disabled={disabled || loading}
                onClick={() => onApply(c.code)}
                className="mt-2 rounded-lg bg-[#0e55d9] px-2.5 py-1 text-[10px] font-black text-[#ffffff] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponInput}
          disabled={disabled}
          onChange={(e) => onInputChange(e.target.value.toUpperCase())}
          className="h-11 flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#0e55d9] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => onApply(couponInput.trim())}
          disabled={loading || !couponInput.trim() || disabled}
          className="h-11 rounded-xl bg-[#0e55d9] px-4 text-[12.5px] font-black text-[#ffffff] disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="mt-2 text-[11.5px] text-[#7b5757]">{error}</p>}
    </div>
  );
}