"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import type { AddressFormData } from "@/lib/userAddress";

type Props = {
  form: AddressFormData;
  onChange: (patch: Partial<AddressFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
};

export default function AddressFormStep({
  form,
  onChange,
  onSubmit,
  onBack,
  loading,
  error,
  title = "Save service address",
  subtitle = "We pre-filled location details. Add your house/flat number before saving.",
  submitLabel = "Save & use this address",
}: Props) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[12.5px] font-semibold text-[#64748b] hover:text-[#0e55d9]"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div>
        <p className="text-[15px] font-black text-[#111827]">{title}</p>
        <p className="text-[12px] text-[#344352] mt-0.5">{subtitle}</p>
      </div>

      {error && (
        <p className="rounded-xl bg-[#fef2f2] border border-[#fee2e2] px-4 py-2.5 text-[12.5px] text-[#dc2626]">
          {error}
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#344352]">
          House / Flat / Street <span className="text-[#7b5757]">*</span>
        </span>
        <input
          type="text"
          value={form.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="e.g. Flat 302, Green Valley Apartments, Shankar Nagar"
          className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[13px] outline-none focus:border-[#0e55d9] focus:bg-[#ffffff]"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#344352]">City</span>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[13px] outline-none focus:border-[#0e55d9] focus:bg-[#ffffff]"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#344352]">State</span>
          <input
            type="text"
            value={form.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[13px] outline-none focus:border-[#0e55d9] focus:bg-[#ffffff]"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#344352]">
            Pincode <span className="text-[#7b5757]">*</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => onChange({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="492001"
            className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[13px] outline-none focus:border-[#0e55d9] focus:bg-[#ffffff]"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#344352]">Country</span>
          <input
            type="text"
            value={form.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[13px] outline-none focus:border-[#0e55d9] focus:bg-[#ffffff]"
          />
        </label>
      </div>

      <p className="text-[11px] text-[#9ca3af]">
        Coordinates: {form.latitude}, {form.longitude}
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0e55d9] text-[14px] font-bold text-[#ffffff] hover:bg-[#0c4aBE] disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
      </button>
    </div>
  );
}