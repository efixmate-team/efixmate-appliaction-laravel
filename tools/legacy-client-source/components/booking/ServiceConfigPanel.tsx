/** @format */

"use client";

import { ChevronDown, Info, ShoppingCart } from "lucide-react";
import {
  bookingTypeMeta,
  resolveUnitPrice,
  type CatalogBookingType,
  type CatalogUnit,
} from "./bookingTypes";
import { QuantityStepper } from "./QuantityStepper";
import { AnimatedAmount } from "./AnimatedAmount";

export type ServiceConfig = {
  bookingTypeId: number;
  bookingTypeName: string;
  unitId: number | null;
  unitName: string | null;
  quantity: number;
  lineTotal: number;
};

type Props = {
  bookingTypes: CatalogBookingType[];
  units: CatalogUnit[];
  basePrice: number;
  value: ServiceConfig;
  onChange: (next: ServiceConfig) => void;
  compact?: boolean;
};

function defaultConfig(
  bookingTypes: CatalogBookingType[],
  units: CatalogUnit[],
  basePrice: number,
): ServiceConfig {
  const bt = bookingTypes[0] ?? { id: 1, name: "Fixed" };
  const unit = units[0];
  const qty = 1;
  return {
    bookingTypeId: bt.id,
    bookingTypeName: bt.name,
    unitId: unit?.unit_id ?? null,
    unitName: unit?.name ?? null,
    quantity: qty,
    lineTotal: resolveUnitPrice(basePrice, unit, qty),
  };
}

export function ServiceConfigPanel({
  bookingTypes,
  units,
  basePrice,
  value,
  onChange,
  compact = false,
}: Props) {
  const types = bookingTypes.length ? bookingTypes : [{ id: 1, name: "Fixed" }];

  const update = (patch: Partial<ServiceConfig>) => {
    const next = { ...value, ...patch };
    const unit = units.find((u) => u.unit_id === next.unitId);
    next.lineTotal = resolveUnitPrice(basePrice, unit, next.quantity);
    onChange(next);
  };

  return (
    <div
      className={`flex flex-col gap-5 ${compact ? "" : "rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm"}`}>
      {/* Plan Selection - Segmented Control */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='text-[11px] font-bold uppercase tracking-widest text-[#53697e]'>
            Select Plan
          </label>
          <Info size={12} className='text-[#cbd5e1]' />
        </div>

        <div className='flex p-1 bg-[#f1f5f9]/80 rounded-xl gap-1 border border-[#e2e8f0]/50'>
          {types.map((bt) => {
            const selected = value.bookingTypeId === bt.id;
            return (
              <button
                key={bt.id}
                type='button'
                onClick={() =>
                  update({ bookingTypeId: bt.id, bookingTypeName: bt.name })
                }
                className={`flex-1 relative py-2 px-3 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                  selected
                    ? "bg-[#ffffff] text-[#2563eb] shadow-sm ring-1 ring-[#000000]/[0.02]"
                    : "text-[#53697e] hover:text-[#334155] hover:bg-[#e2e8f0]/50"
                }`}>
                {bookingTypeMeta(bt.name).title}
                {selected && (
                  <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2563eb]' />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Details - Select Input */}
      {units.length > 0 && (
        <div className='space-y-3'>
          <label className='text-[11px] font-bold uppercase tracking-widest text-[#53697e] px-0.5'>
            Property Size
          </label>
          <div className='group relative'>
            <select
              value={value.unitId ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const unit = units.find((u) => u.unit_id === id);
                update({ unitId: id, unitName: unit?.name ?? null });
              }}
              className='appearance-none h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/30 pl-4 pr-10 text-[13px] font-bold text-[#0f172a] focus:bg-[#ffffff] focus:border-[#eff6ff] focus:ring-4 focus:ring-[#eff6ff]/10 outline-none transition-all cursor-pointer'>
              {units.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.name} -{" "}
                  {u.price_per_unit != null
                    ? `â‚¹${u.price_per_unit}`
                    : "Base Price"}
                </option>
              ))}
            </select>
            <div className='absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-[#ffffff] rounded-md border border-[#f1f5f9] shadow-sm pointer-events-none group-focus-within:rotate-180 transition-transform'>
              <ChevronDown size={12} className='text-[#53697e]' />
            </div>
          </div>
        </div>
      )}

      {/* Footer: Quantity & Dynamic Pricing */}
      <div className='flex items-center justify-between mt-2 pt-5 border-t border-[#f1f5f9]'>
        <div className='flex flex-col gap-2'>
          <span className='text-[10px] font-bold uppercase tracking-wider text-[#5c6a7f] px-0.5'>
            Quantity
          </span>
          <div className='bg-[#f8fafc] p-1 rounded-xl border border-[#f1f5f9]'>
            <QuantityStepper
              value={value.quantity}
              onChange={(quantity) => update({ quantity })}
            />
          </div>
        </div>

        <div className='text-right'>
          <p className='text-[10px] font-bold uppercase er text-[#5c6a7f] mb-1'>
            Total Estimate
          </p>
          <div className='flex items-center gap-2 justify-end'>
            <div className='h-8 w-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb]'>
              <ShoppingCart size={14} strokeWidth={3} />
            </div>
            <AnimatedAmount
              value={value.lineTotal}
              className='text-[22px] font-black text-[#0f172a] '
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { defaultConfig as defaultServiceConfig };