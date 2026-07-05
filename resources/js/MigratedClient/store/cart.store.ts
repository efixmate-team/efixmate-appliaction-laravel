"use client";

import { create } from "zustand";
import type { CartSummary } from "@/lib/booking";

export type CartLine = {
  line_id: string | number;
  service_id: string | number;
  service_name: string;
  booking_type_id?: string | number;
  unit_id?: string | number;
  quantity: number;
  unit_price: number;
  line_total: number;
  photos?: string[];
  service_icon?: string | null;
  image?: string | null;
};

export type PriceQuote = {
  subtotal: number;
  platform_fee: number;
  tax: number;
  coupon_discount: number;
  total: number;
  currency: string;
};

type CartStore = {
  lines: CartLine[];
  cartId: string | null;
  slotId: string | null;
  slotLabel: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  addressId: number | null;
  couponCode: string | null;
  couponSavings: number;
  instructions: string;
  quote: PriceQuote | null;
  lockIds: string[];

  setLines: (lines: CartLine[]) => void;
  setCartId: (id: string) => void;
  setSlot: (id: string, label: string, scheduledDate?: string, scheduledTime?: string) => void;
  setAddress: (id: number) => void;
  setCoupon: (code: string, savings: number) => void;
  removeCoupon: () => void;
  setInstructions: (text: string) => void;
  setQuote: (q: PriceQuote | null) => void;
  setLockIds: (ids: string[]) => void;
  syncFromSummary: (summary: CartSummary | null) => void;
  addLocalLine: (line: Omit<CartLine, "line_id">) => void;
  updateLine: (lineId: string | number, qty: number) => void;
  removeLine: (lineId: string | number) => void;
  clearCart: () => void;
};

const initialState = {
  lines: [] as CartLine[],
  cartId: null as string | null,
  slotId: null as string | null,
  slotLabel: null as string | null,
  scheduledDate: null as string | null,
  scheduledTime: null as string | null,
  addressId: null as number | null,
  couponCode: null as string | null,
  couponSavings: 0,
  instructions: "",
  quote: null as PriceQuote | null,
  lockIds: [] as string[],
};

export const useCartStore = create<CartStore>((set) => ({
  ...initialState,

  setLines: (lines) => set({ lines }),
  setCartId: (cartId) => set({ cartId }),
  setSlot: (slotId, slotLabel, scheduledDate, scheduledTime) =>
    set({
      slotId,
      slotLabel,
      ...(scheduledDate ? { scheduledDate } : {}),
      ...(scheduledTime ? { scheduledTime } : {}),
    }),
  setAddress: (addressId) => set({ addressId }),
  setCoupon: (couponCode, couponSavings) => set({ couponCode, couponSavings }),
  removeCoupon: () => set({ couponCode: null, couponSavings: 0 }),
  setInstructions: (instructions) => set({ instructions }),
  setQuote: (quote) => set({ quote }),
  setLockIds: (lockIds) => set({ lockIds }),
  syncFromSummary: (summary) => {
    if (!summary) return;
    set({
      cartId: summary.cart_id,
      addressId: summary.address_id,
      slotId: summary.slot_id != null ? String(summary.slot_id) : null,
      scheduledDate: summary.scheduled_date,
      scheduledTime: summary.scheduled_time,
      instructions: summary.instructions || "",
    });
  },
  addLocalLine: (line) =>
    set((s) => ({
      lines: [
        ...s.lines,
        { ...line, line_id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    })),
  updateLine: (lineId, qty) =>
    set((s) => ({
      lines: s.lines.map((l) =>
        l.line_id === lineId ? { ...l, quantity: qty, line_total: l.unit_price * qty } : l
      ),
    })),
  removeLine: (lineId) =>
    set((s) => ({
      lines: s.lines.filter((l) => l.line_id !== lineId),
    })),
  clearCart: () => set({ ...initialState }),
}));
