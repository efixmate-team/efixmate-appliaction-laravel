/** Types and parsers for user booking / cart API responses. */

import type { CartLine, PriceQuote } from "@/store/cart.store";

export type CartSlot = {
  slot_id: number;
  service_id: number | null;
  area_id: number;
  name: string;
  time: string;
  start_time: string;
  end_time: string;
  is_instant: boolean;
  available: boolean;
  price: number | null;
  /** Client-assigned booking date (YYYY-MM-DD) when user selects this slot. */
  scheduled_date?: string;
};

export type CartSummary = {
  cart_id: string;
  address_id: number | null;
  slot_id: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  instructions: string;
};

export type LockResult = {
  lock_ids: string[];
  expires_at?: string;
};

export type CheckoutResult = {
  booking_id: number;
  booking_uid?: string;
  amount_due?: number;
};

export type PaymentOrder = {
  order_id: number | string;
  gateway_order_id?: string;
  razorpay_key_id?: string;
  provider?: string;
  amount?: number;
  booking_id?: number;
  currency?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function parseCartLines(raw: unknown): CartLine[] {
  const o = asRecord(raw);
  if (!o) return [];
  const lines = o.lines ?? o.data;
  if (!Array.isArray(lines)) {
    const nested = asRecord(o.data);
    if (nested && Array.isArray(nested.lines)) return parseCartLineRows(nested.lines);
    return [];
  }
  return parseCartLineRows(lines);
}

function parseCartLineRows(rows: unknown[]): CartLine[] {
  return rows.map((row) => {
    const r = asRecord(row) ?? {};
    return {
      line_id: r.line_id as string | number,
      service_id: r.service_id as string | number,
      service_name: String(r.service_name ?? r.service ?? "Service"),
      booking_type_id: r.booking_type_id as string | number | undefined,
      unit_id: r.unit_id as string | number | undefined,
      quantity: Number(r.quantity ?? 1),
      unit_price: Number(r.unit_price ?? 0),
      line_total: Number(r.line_total ?? 0),
      photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
      service_icon: r.service_icon ? String(r.service_icon) : null,
      image: r.image ? String(r.image) : r.service_icon ? String(r.service_icon) : null,
    };
  });
}

/** Extract uploaded photo URLs for a cart line from add/remove photo API responses. */
export function photosForCartLine(raw: unknown, lineId: string | number): string[] {
  const { lines } = parseCartSummary(raw);
  const line = lines.find((l) => String(l.line_id) === String(lineId));
  return line?.photos ?? [];
}

export function parseCartSummary(raw: unknown): {
  summary: CartSummary | null;
  lines: CartLine[];
  quote: PriceQuote | null;
} {
  const o = asRecord(raw);
  if (!o) return { summary: null, lines: [], quote: null };

  const data = asRecord(o.data) ?? o;
  const cart = asRecord(data.cart) ?? data;
  const price = asRecord(data.price);

  const lines = parseCartLines(data);

  const summary: CartSummary | null = cart.cart_id
    ? {
        cart_id: String(cart.cart_id),
        address_id: cart.address_id != null ? Number(cart.address_id) : null,
        slot_id: cart.slot_id != null ? Number(cart.slot_id) : null,
        scheduled_date: cart.scheduled_date ? String(cart.scheduled_date).slice(0, 10) : null,
        scheduled_time: cart.scheduled_time ? String(cart.scheduled_time) : null,
        instructions: String(cart.instructions ?? ""),
      }
    : null;

  const quote: PriceQuote | null = price
    ? {
        subtotal: Number(price.subtotal ?? 0),
        platform_fee: Number(price.platform_fee ?? 0),
        tax: Number(price.tax_amount ?? price.tax ?? 0),
        coupon_discount: Number(price.coupon_discount ?? 0),
        total: Number(price.total ?? 0),
        currency: String(price.currency ?? "INR"),
      }
    : null;

  return { summary, lines, quote };
}

export function parseQuote(raw: unknown): PriceQuote | null {
  const o = asRecord(raw);
  if (!o) return null;
  const data = asRecord(o.data) ?? o;
  if (data.total == null && data.subtotal == null) return null;
  return {
    subtotal: Number(data.subtotal ?? 0),
    platform_fee: Number(data.charges_total ?? data.platform_fee ?? 0),
    tax: Number(data.tax_amount ?? data.tax ?? 0),
    coupon_discount: Number(data.coupon_discount ?? 0),
    total: Number(data.total ?? 0),
    currency: String(data.currency ?? "INR"),
  };
}

export function parseSlots(raw: unknown): CartSlot[] {
  const o = asRecord(raw);
  if (!o) return [];
  const data = o.data ?? o.result ?? o;
  let rows: unknown[] = [];
  if (Array.isArray(data)) rows = data;
  else {
    const d = asRecord(data);
    if (d && Array.isArray(d.slots)) rows = d.slots;
  }
  return rows.map((row) => {
    const r = asRecord(row) ?? {};
    return {
      slot_id: Number(r.slot_id),
      service_id: r.service_id != null ? Number(r.service_id) : null,
      area_id: Number(r.area_id ?? 0),
      name: String(r.name ?? ""),
      time: String(r.time ?? `${r.start_time ?? ""}${r.end_time ? ` - ${r.end_time}` : ""}`.trim()),
      start_time: String(r.start_time ?? ""),
      end_time: String(r.end_time ?? ""),
      is_instant: Boolean(r.is_instant),
      available: r.available !== false,
      price: r.price != null ? Number(r.price) : null,
      scheduled_date: r.scheduled_date ? String(r.scheduled_date).slice(0, 10) : undefined,
    };
  });
}

export function parseLockResult(raw: unknown): LockResult | null {
  const o = asRecord(raw);
  if (!o) return null;
  const data = asRecord(o.data) ?? o;
  const lockIds = (data.lock_ids ?? o.lock_ids) as unknown;
  if (!Array.isArray(lockIds) || !lockIds.length) return null;
  return {
    lock_ids: lockIds.map(String),
    expires_at: data.expires_at ? String(data.expires_at) : undefined,
  };
}

export function parseCheckoutResult(raw: unknown): CheckoutResult | null {
  const o = asRecord(raw);
  if (!o || o.status === false) return null;
  const data = asRecord(o.data) ?? o;
  const bookingId = data.booking_id ?? o.booking_id;
  if (bookingId == null) return null;
  return {
    booking_id: Number(bookingId),
    booking_uid: data.booking_uid ? String(data.booking_uid) : undefined,
    amount_due: data.amount_due != null ? Number(data.amount_due) : undefined,
  };
}

export function parsePaymentOrder(raw: unknown): PaymentOrder | null {
  const o = asRecord(raw);
  if (!o || o.status === false) return null;
  const data = asRecord(o.data) ?? o;
  const orderId = data.order_id ?? o.order_id;
  if (orderId == null) return null;
  const gatewayOrderId =
    data.gateway_order_id ?? data.gatewayOrderId ?? o.gateway_order_id;
  return {
    order_id: orderId as number | string,
    gateway_order_id: gatewayOrderId ? String(gatewayOrderId) : undefined,
    razorpay_key_id: data.razorpay_key_id ? String(data.razorpay_key_id) : undefined,
    provider: data.provider ? String(data.provider) : undefined,
    amount: data.amount != null ? Number(data.amount) : undefined,
    booking_id: data.booking_id != null ? Number(data.booking_id) : undefined,
    currency: data.currency ? String(data.currency) : "INR",
  };
}

/** Default booking date: today for instant slots, otherwise tomorrow. */
export function defaultScheduledDate(isInstant: boolean): string {
  const d = new Date();
  if (!isInstant) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function slotLabel(slot: CartSlot): string {
  return slot.name || slot.time || `Slot ${slot.slot_id}`;
}
