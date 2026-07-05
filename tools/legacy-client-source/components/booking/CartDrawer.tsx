"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Loader2,
  MapPin,
  ShoppingCart,
  Tag,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import { QuantityStepper } from "./QuantityStepper";
import { PriceBreakdown } from "./PriceBreakdown";
import { AnimatedAmount } from "./AnimatedAmount";
import {
  getAddresses,
  getCartSlotsByAddress,
  getCartQuote,
  patchCart,
  removeCartLine,
  updateCartLine,
  ensureCart,
  addCartLine,
} from "@/lib/api/userClient";
import UserLoginModal from "@/components/user/UserLoginModal";
import { checkCartLinesAvailability, type ServiceAvailability } from "@/lib/api/webappClient";
import { parseSlots, slotLabel as formatSlotLabel, defaultScheduledDate, parseCartSummary } from "@/lib/booking";
import type { CartSlot } from "@/lib/booking";

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = {
  address_id: number;
  label?: string;
  address?: string;
  address_type?: string;
  flat_no?: string;
  house_no?: string;
  building?: string;
  locality?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  is_primary?: boolean;
  is_selected?: boolean;
};

function addressOneliner(a: Address): string {
  const parts = [a.house_no ?? a.flat_no, a.building, a.address, a.locality, a.landmark, a.city, a.pincode].filter(Boolean);
  return parts.join(", ") || a.label || `Address #${a.address_id}`;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Main CartDrawer ──────────────────────────────────────────────────────────

export function CartDrawer({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { token } = useUserAuthStore();
  const {
    lines,
    cartId,
    slotId,
    scheduledDate,
    addressId,
    couponCode,
    couponSavings,
    quote,
    setLines,
    setSlot,
    setAddress,
    setCoupon,
    removeCoupon,
    setQuote,
    updateLine,
    removeLine,
  } = useCartStore();

  // ── Login modal for guest checkout ──
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = useCallback(async () => {
    setShowLogin(false);
    // Sync any locally-added guest lines to the backend
    const localLines = lines.filter((l) => String(l.line_id).startsWith("local-"));
    if (!localLines.length) return;
    try {
      await ensureCart();
      // Add lines sequentially; each response returns the full updated cart — use the last
      let finalLines: typeof lines = [];
      for (const localLine of localLines) {
        const res = await addCartLine({
          service_id: localLine.service_id,
          booking_type_id: localLine.booking_type_id,
          unit_id: localLine.unit_id,
          quantity: localLine.quantity,
        }) as { status: boolean };
        if (res.status) {
          const { lines: apiLines } = parseCartSummary(res);
          if (apiLines.length) finalLines = apiLines;
        }
      }
      if (finalLines.length) setLines(finalLines);
    } catch { /* best-effort */ }
  }, [lines, setLines]);

  // ── Availability ──
  const [availability, setAvailability] = useState<ServiceAvailability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  const checkAvail = useCallback(async () => {
    if (!token || !lines.length) { setAvailability([]); return; }
    setAvailLoading(true);
    try {
      const res = await checkCartLinesAvailability();
      setAvailability(res);
    } catch {
      setAvailability([]);
    } finally {
      setAvailLoading(false);
    }
  }, [token, lines.length]);

  useEffect(() => { checkAvail(); }, [checkAvail]);

  const serviceAvailMap = new Map(availability.map((a) => [Number(a.service_id), a.is_available]));
  const hasUnavailable = availability.some((a) => !a.is_available);

  // ── Addresses ──
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const autoSelectedRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(scheduledDate || todayDate());

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await getAddresses() as Record<string, unknown>;
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.result) ? res.result : [];
        setAddresses(rows as Address[]);
      } catch { /* no-op */ }
    })();
  }, [token]);

  // Auto-select primary/first address when loaded and none is in the cart store yet
  useEffect(() => {
    if (!addresses.length || addressId || autoSelectedRef.current) return;
    autoSelectedRef.current = true;
    const primary = addresses.find((a) => a.is_selected) ?? addresses.find((a) => a.is_primary) ?? addresses[0];
    (async () => {
      try {
        setAddress(primary.address_id);
        if (cartId) await patchCart({ address_id: primary.address_id });
        checkAvail();
      } catch { /* no-op */ }
    })();
  }, [addresses, addressId, cartId, checkAvail, setAddress]);

  const handleSelectAddress = async (addr: Address) => {
    setAddrLoading(true);
    try {
      setAddress(addr.address_id);
      if (cartId) await patchCart({ address_id: addr.address_id });
      setShowAddressList(false);
      setSlot("", "", selectedDate, "");
      setSlots([]);
      checkAvail();
    } catch { /* no-op */ } finally { setAddrLoading(false); }
  };

  const activeAddress = addresses.find((a) => a.address_id === addressId) ?? addresses.find((a) => a.is_selected) ?? addresses[0];

  useEffect(() => {
    if (scheduledDate) setSelectedDate(scheduledDate);
  }, [scheduledDate]);

  // ── Slots ──
  const [slots, setSlots] = useState<CartSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!token || !addressId || !selectedDate) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const res = await getCartSlotsByAddress(addressId, selectedDate);
        if (!cancelled) {
          const parsed = parseSlots(res);
          setSlots(parsed);
        }
      } catch { if (!cancelled) setSlots([]); }
      finally { if (!cancelled) setSlotsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token, addressId, selectedDate]);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSlot("", "", date, "");
    setSlots([]);
    if (cartId) {
      await patchCart({ scheduled_date: date }).catch(() => {});
    }
  };

  const handleSelectSlot = async (slot: CartSlot) => {
    const date = selectedDate || slot.scheduled_date || defaultScheduledDate(slot.is_instant);
    const label = formatSlotLabel(slot);
    setSlot(String(slot.slot_id), label, date, slot.start_time);
    if (cartId) {
      await patchCart({
        slot_id: slot.slot_id,
        scheduled_date: date,
        scheduled_time: slot.start_time,
      }).catch(() => {});
    }
    refreshQuote();
  };

  // ── Coupon ──
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await getCartQuote({ coupon_code: code.trim() }) as Record<string, unknown>;
      const q = res?.data as Record<string, unknown> | undefined;
      if (res?.status === false) {
        setCouponError(String(res?.message ?? "Invalid coupon"));
        return;
      }
      const discount = Number(q?.coupon_discount ?? q?.discount ?? 0);
      setCoupon(code.trim(), discount);
      setQuote({
        subtotal: Number(q?.subtotal ?? 0),
        platform_fee: Number(q?.platform_fee ?? 0),
        tax: Number(q?.tax ?? 0),
        coupon_discount: discount,
        total: Number(q?.total ?? 0),
        currency: String(q?.currency ?? "INR"),
      });
    } catch {
      setCouponError("Failed to apply coupon");
    } finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput("");
    setCouponError("");
    refreshQuote();
  };

  // ── Quote ──
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshQuote = useCallback(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(async () => {
      if (!token) return;
      setQuoteLoading(true);
      try {
        const res = await getCartQuote(couponCode ? { coupon_code: couponCode } : {}) as Record<string, unknown>;
        const q = res?.data as Record<string, unknown> | undefined;
        if (res?.status !== false && q) {
          setQuote({
            subtotal: Number(q.subtotal ?? 0),
            platform_fee: Number(q.platform_fee ?? 0),
            tax: Number(q.tax ?? 0),
            coupon_discount: Number(q.coupon_discount ?? 0),
            total: Number(q.total ?? 0),
            currency: String(q.currency ?? "INR"),
          });
        }
      } catch { /* keep stale */ } finally { setQuoteLoading(false); }
    }, 400);
  }, [token, couponCode, setQuote]);

  useEffect(() => { if (lines.length) refreshQuote(); }, [lines.length, slotId, refreshQuote]);

  // ── Line updates ──
  const handleQtyChange = async (lineId: string | number, qty: number) => {
    updateLine(lineId, qty);
    try {
      await updateCartLine(lineId, { quantity: qty });
      refreshQuote();
    } catch { /* best-effort */ }
  };

  const handleRemoveLine = async (lineId: string | number) => {
    removeLine(lineId);
    try {
      await removeCartLine(lineId);
      refreshQuote();
    } catch { /* best-effort */ }
  };

  // ── Proceed ──
  const [proceedError, setProceedError] = useState("");

  const handleProceed = () => {
    if (hasUnavailable) return;
    if (!token) { setShowLogin(true); return; }
    if (!slotId) {
      setProceedError("Please select a time slot before proceeding.");
      return;
    }
    if (!addressId) {
      setProceedError("Please select a service address before proceeding.");
      return;
    }
    setProceedError("");
    router.push("/payment");
  };

  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.line_total, 0);
  const total = quote?.total ?? subtotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]">
            <ShoppingCart size={16} className="text-[#0e55d9]" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e55d9] px-1 text-[9px] font-black text-white">
              {itemCount}
            </span>
          </div>
          <h2 className="text-[14px] font-black text-[#0f172a]">Your Cart</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Service lines */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-black text-[#0f172a]">Selected Services</span>
          <span className="text-[11px] font-bold text-[#64748b]">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        </div>
        {lines.map((line) => {
          const sid = Number(line.service_id);
          const isAvail = serviceAvailMap.get(sid);
          const unavailable = availability.length > 0 && isAvail === false;

          return (
            <div key={line.line_id} className="flex flex-col gap-1">
              <div
                className={`flex items-start gap-2.5 rounded-xl transition-opacity ${
                  unavailable ? "opacity-60" : ""
                } ${unavailable ? "border-l-2 border-red-400 pl-2" : ""}`}
              >
                {/* Thumbnail */}
                <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9]">
                  {line.image || line.service_icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image || line.service_icon || ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Wrench size={20} className="absolute inset-0 m-auto text-[#cbd5e1]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-[12.5px] font-bold text-[#0f172a]">
                    {line.service_name}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => handleQtyChange(line.line_id, q)}
                      size="sm"
                    />
                    <span className="text-[13px] font-black text-[#0f172a]">
                      ₹{line.line_total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line.line_id)}
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#fee2e2] hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Availability message */}
              {unavailable && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                  <AlertCircle size={11} />
                  Unfortunately this service is not available in your area.
                </p>
              )}
              {availLoading && isAvail === undefined && (
                <p className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
                  <Loader2 size={10} className="animate-spin" /> Checking availability…
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Address */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <MapPin size={13} className="text-[#0e55d9]" />
          <span className="text-[12px] font-black text-[#0f172a]">Service Address</span>
        </div>
        {activeAddress ? (
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] leading-relaxed text-[#475569]">
              {addressOneliner(activeAddress)}
            </p>
            <button
              type="button"
              onClick={() => setShowAddressList((v) => !v)}
              className="shrink-0 rounded-lg border border-[#e2e8f0] px-2 py-1 text-[11px] font-bold text-[#0e55d9] hover:bg-[#eef4ff]"
            >
              {showAddressList ? "Close" : "Change"}
            </button>
          </div>
        ) : token ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-[#94a3b8]">No saved address found.</p>
            <Link
              href="/profile?tab=addresses"
              className="shrink-0 rounded-lg bg-[#0e55d9] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e40af]"
            >
              + Add address
            </Link>
          </div>
        ) : (
          <p className="text-[12px] text-[#94a3b8]">Log in to load your saved addresses.</p>
        )}

        {showAddressList && addresses.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 border-t border-[#f1f5f9] pt-2">
            {addresses.map((a) => (
              <button
                key={a.address_id}
                type="button"
                disabled={addrLoading}
                onClick={() => handleSelectAddress(a)}
                className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] transition-colors ${
                  a.address_id === addressId
                    ? "border-[#0e55d9] bg-[#eef4ff]"
                    : "border-[#e2e8f0] hover:border-[#0e55d9]/40"
                }`}
              >
                {a.address_id === addressId && (
                  <CheckCircle size={13} className="mt-0.5 shrink-0 text-[#0e55d9]" />
                )}
                <span className="text-[#475569]">{addressOneliner(a)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Calendar size={13} className="text-[#0e55d9]" />
          <span className="text-[12px] font-black text-[#0f172a]">Select Date</span>
        </div>
        <input
          type="date"
          min={todayDate()}
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] font-semibold text-[#0f172a] outline-none focus:border-[#0e55d9]"
        />
      </div>

      {/* Slot picker */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Calendar size={13} className="text-[#0e55d9]" />
          <span className="text-[12px] font-black text-[#0f172a]">Select Time Slot</span>
        </div>
        {slotsLoading ? (
          <div className="flex items-center gap-2 py-2 text-[12px] text-[#94a3b8]">
            <Loader2 size={14} className="animate-spin" />
            Loading available slots…
          </div>
        ) : !addressId ? (
          <p className="text-[11.5px] text-[#94a3b8]">Select an address and date to see available slots.</p>
        ) : slots.length === 0 ? (
          <p className="text-[11.5px] text-[#94a3b8]">No slots available for your area. Try a different address.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {slots.slice(0, 6).map((slot) => {
              const selected = slotId === String(slot.slot_id);
              const date = slot.scheduled_date ?? defaultScheduledDate(slot.is_instant);
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={slot.slot_id}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => handleSelectSlot(slot)}
                  className={`rounded-lg border p-2 text-left transition-all ${
                    selected
                      ? "border-[#0e55d9] bg-[#eef4ff]"
                      : slot.available
                        ? "border-[#e2e8f0] hover:border-[#0e55d9]/40"
                        : "cursor-not-allowed border-[#f1f5f9] opacity-50"
                  }`}
                >
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-[#64748b]">
                    {isToday ? "Today" : date}
                  </p>
                  <p className="text-[11px] font-black text-[#0f172a]">{formatSlotLabel(slot)}</p>
                  <p className="text-[10px] font-semibold text-[#0e55d9]">{slot.time}</p>
                  {slot.is_instant && (
                    <span className="mt-0.5 inline-block rounded bg-[#ecfdf5] px-1 py-0.5 text-[8px] font-bold text-[#047857]">
                      Instant
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Coupon */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tag size={13} className="text-[#0e55d9]" />
            <span className="text-[12px] font-black text-[#0f172a]">Coupon</span>
          </div>
          <Link
            href="/offers"
            className="text-[11px] font-bold text-[#0e55d9] hover:underline"
          >
            More offers →
          </Link>
        </div>

        {couponCode ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-2">
            <div>
              <p className="text-[12px] font-black text-[#065f46]">{couponCode}</p>
              <p className="text-[10.5px] text-[#047857]">You save ₹{couponSavings}</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="rounded-lg border border-[#6ee7b7] px-2 py-1 text-[10px] font-bold text-[#047857] hover:bg-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
              placeholder="Enter coupon code"
              className="h-9 flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 text-[12px] outline-none focus:border-[#0e55d9]"
            />
            <button
              type="button"
              disabled={couponLoading || !couponInput.trim()}
              onClick={() => handleApplyCoupon(couponInput)}
              className="h-9 rounded-lg bg-[#0e55d9] px-3 text-[11.5px] font-black text-white disabled:opacity-50"
            >
              {couponLoading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
            </button>
          </div>
        )}
        {couponError && (
          <p className="mt-1.5 text-[11px] text-red-500">{couponError}</p>
        )}
      </div>

      {/* Price breakdown */}
      {quote && (
        <PriceBreakdown
          subtotal={quote.subtotal}
          platformFee={quote.platform_fee}
          tax={quote.tax}
          couponDiscount={quote.coupon_discount}
          couponCode={couponCode}
          total={quote.total}
          loading={quoteLoading}
          defaultOpen={false}
        />
      )}

      {/* Proceed */}
      <div className="flex flex-col gap-2">
        {hasUnavailable && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0 text-red-500" />
            <p className="text-[11.5px] font-semibold text-red-600">
              Remove unavailable services to proceed
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={hasUnavailable || !lines.length}
          onClick={handleProceed}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-black shadow transition-all active:scale-[0.98] ${
            hasUnavailable || !lines.length
              ? "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
              : "bg-[#0e55d9] text-white shadow-[0_4px_16px_rgba(14,85,217,0.3)] hover:bg-[#1e40af]"
          }`}
        >
          <span>Proceed to Payment</span>
          {!hasUnavailable && <AnimatedAmount value={total} className="font-black text-white" />}
          <ArrowRight size={16} />
        </button>
        {proceedError && (
          <p className="text-center text-[11px] text-red-500">{proceedError}</p>
        )}
      </div>

      {showLogin && (
        <UserLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
