"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Clock4, Loader2, Minus, Plus, RefreshCw, SearchX, ShieldCheck, ShoppingCart, Star, Wrench } from "lucide-react";
import { getServiceDetails, ensureCart, addCartLine, getCart } from "@/lib/api/userClient";
import { resolveServiceImageUrl } from "@/lib/serviceImage";
import { parseCartSummary } from "@/lib/booking";
import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";

type BookingType = { booking_type_id: number; booking_type: string };
type Unit        = { unit_id: number; unit_name: string; unit_symbol?: string };
type ServiceDetail = {
  service_id: number;
  service?: string; title?: string; description?: string;
  base_price?: number; price?: number;
  rating?: number; rating_count?: number;
  booking_types?: BookingType[];
  units?: Unit[];
  category_name?: string;
  duration_minutes?: number;
  service_icon?: string | null;
  image_url?: string | null;
  image?: string | null;
};

function Skeleton() {
  return (
    <div className="pb-32 lg:pb-6">
      <div className="mx-auto max-w-3xl lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-6 lg:py-6 animate-pulse">
        {/* Left */}
        <div>
          {/* Banner */}
          <div className="h-52 bg-[#f1f5f9] rounded-none lg:rounded-2xl" />
          <div className="px-4 py-5 lg:px-0 space-y-4">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="h-6 w-2/3 rounded bg-[#e2e8f0]" />
              <div className="h-7 w-16 rounded-full bg-[#f1f5f9]" />
            </div>
            {/* Meta pills */}
            <div className="flex gap-3">
              <div className="h-4 w-20 rounded bg-[#f1f5f9]" />
              <div className="h-4 w-24 rounded bg-[#f1f5f9]" />
              <div className="h-4 w-20 rounded bg-[#f1f5f9]" />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-[#f1f5f9]" />
              <div className="h-3.5 w-full rounded bg-[#f1f5f9]" />
              <div className="h-3.5 w-4/5 rounded bg-[#f1f5f9]" />
            </div>
            {/* Booking type chips */}
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-24 rounded-lg bg-[#f1f5f9]" />
              <div className="h-8 w-24 rounded-lg bg-[#f1f5f9]" />
            </div>
            {/* Qty stepper */}
            <div className="flex items-center gap-4 pt-1">
              <div className="h-3 w-16 rounded bg-[#f1f5f9]" />
              <div className="h-10 w-28 rounded-xl bg-[#f1f5f9]" />
            </div>
          </div>
        </div>
        {/* Right sticky panel */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 space-y-4">
            <div className="h-3 w-24 rounded bg-[#f1f5f9]" />
            <div className="h-9 w-32 rounded bg-[#e2e8f0]" />
            <div className="h-px bg-[#f1f5f9]" />
            <div className="space-y-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#f1f5f9]" />
                  <div className="h-3 w-32 rounded bg-[#f1f5f9]" />
                </div>
              ))}
            </div>
            <div className="h-12 w-full rounded-xl bg-[#e2e8f0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router        = useRouter();
  const { token }     = useUserAuthStore();
  const { setCartId, setLines, syncFromSummary, lines } = useCartStore();

  const [svc,       setSvc]      = useState<ServiceDetail | null>(null);
  const [loading,   setLoading]  = useState(true);
  const [btId,      setBtId]     = useState<number | null>(null);
  const [unitId,    setUnitId]   = useState<number | null>(null);
  const [qty,       setQty]      = useState(1);
  const [adding,    setAdding]   = useState(false);
  const [added,     setAdded]    = useState(false);
  const [error,     setError]    = useState("");

  const inCart = lines.some((l) => l.service_id === Number(serviceId));

  useEffect(() => {
    (async () => {
      const res = await getServiceDetails(serviceId) as { status: boolean; data?: ServiceDetail; result?: ServiceDetail };
      const detail = res.data ?? res.result;
      if (detail) {
        setSvc(detail);
        if (detail.booking_types?.length) setBtId(detail.booking_types[0].booking_type_id);
        if (detail.units?.length) setUnitId(detail.units[0].unit_id);
      }
      setLoading(false);
    })();
  }, [serviceId]);

  const price = svc?.price ?? svc?.base_price ?? 0;
  const total = price * qty;

  const handleAddToCart = async () => {
    if (!token) { router.push(`/login?redirect=/service/${serviceId}`); return; }
    setAdding(true);
    setError("");
    try {
      // Get or create cart (never wipes existing lines)
      const cartRes = await ensureCart() as { status: boolean; code?: string; message?: string; data?: { cart?: { cart_id?: string }; cart_id?: string }; cart_id?: string };
      if (cartRes.status === false) {
        if ((cartRes.code as string) === 'NO_ADDRESS') {
          setError("Please add a service address in your profile before booking.");
        } else {
          setError(cartRes.message || "Could not create cart. Please try again.");
        }
        return;
      }
      const cartId  = (cartRes.data as any)?.cart?.cart_id ?? (cartRes.data as any)?.cart_id ?? (cartRes as any).cart_id;
      if (cartId) setCartId(cartId);

      const lineRes = await addCartLine({
        service_id:      Number(serviceId),
        booking_type_id: btId,
        unit_id:         unitId,
        quantity:        qty,
      }) as { status: boolean; data?: unknown; message?: string };

      if (lineRes.status !== false) {
        const { summary, lines: apiLines } = parseCartSummary(lineRes.data ?? lineRes);
        if (summary) {
          setCartId(summary.cart_id);
          syncFromSummary(summary);
        }
        if (apiLines.length) {
          setLines(apiLines);
        } else {
          const cartRes = await getCart();
          const parsed = parseCartSummary(cartRes);
          if (parsed.lines.length) setLines(parsed.lines);
        }
        setAdded(true);
        setTimeout(() => router.push("/cart"), 700);
      } else {
        setError(lineRes.message || "Could not add to cart.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="px-4 py-6 max-w-3xl mx-auto"><Skeleton /></div>;
  if (!svc) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <SearchX size={40} className="text-[#cbd5e1] mb-3" />
      <p className="text-[15px] font-semibold text-[#64748b]">Service not found</p>
    </div>
  );

  const name = svc.title ?? svc.service ?? "Service";
  const heroImage = resolveServiceImageUrl(svc.image_url ?? svc.service_icon ?? svc.image);

  return (
    <div className="pb-32 lg:pb-6">
      <div className="mx-auto max-w-3xl lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-6 lg:py-6">

        {/* ── Left: service info ── */}
        <div>
          {/* Banner */}
          <div className="relative h-52 rounded-none lg:rounded-2xl overflow-hidden bg-gradient-to-br from-[#eef4ff] to-[#dbeafe] flex items-center justify-center">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt={name} className="h-36 w-36 object-contain drop-shadow-md" />
            ) : (
              <Wrench size={72} className="text-[#0e55d9]/15" />
            )}
            {/* Back button (mobile) */}
            <button type="button" onClick={() => router.back()}
              className="absolute left-3 top-3 lg:hidden flex h-8 w-8 items-center justify-center rounded-full bg-[#ffffff]/90 shadow-sm backdrop-blur-sm">
              <ChevronLeft size={18} className="text-[#0f172a]" />
            </button>
            {svc.category_name && (
              <span className="absolute top-3 right-3 rounded-full bg-[#ffffff]/90 px-3 py-1 text-[11px] font-bold text-[#0e55d9] backdrop-blur-sm">
                {svc.category_name}
              </span>
            )}
          </div>

          <div className="px-4 py-5 lg:px-0">
            {/* Title + rating */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[20px] font-black leading-tight text-[#0f172a]">{name}</h1>
              {svc.rating && (
                <div className="shrink-0 flex items-center gap-1 rounded-full bg-[#fffbeb] border border-[#fde68a] px-2.5 py-1">
                  <Star size={12} className="text-[#f59e0b]" fill="currentColor" />
                  <span className="text-[12px] font-black text-[#92400e]">{svc.rating.toFixed(1)}</span>
                  {svc.rating_count && <span className="text-[10px] text-[#a16207]">({svc.rating_count})</span>}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="mt-2 flex flex-wrap gap-3">
              {svc.duration_minutes && (
                <span className="flex items-center gap-1 text-[12px] text-[#64748b]">
                  <Clock4 size={13} /> {svc.duration_minutes} mins
                </span>
              )}
              <span className="flex items-center gap-1 text-[12px] text-[#64748b]">
                <ShieldCheck size={13} className="text-[#ecfdf5]" /> Verified technicians
              </span>
              <span className="flex items-center gap-1 text-[12px] text-[#64748b]">
                <RefreshCw size={13} className="text-[#0e55d9]" /> 30-day warranty
              </span>
            </div>

            {/* Description */}
            {svc.description && (
              <p className="mt-4 text-[13.5px] leading-relaxed text-[#374151]">{svc.description}</p>
            )}

            {/* Booking type */}
            {svc.booking_types && svc.booking_types.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">Booking Type</p>
                <div className="flex flex-wrap gap-2">
                  {svc.booking_types.map((bt) => (
                    <button key={bt.booking_type_id} type="button"
                      onClick={() => setBtId(bt.booking_type_id)}
                      className={`rounded-lg border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                        btId === bt.booking_type_id
                          ? "border-[#0e55d9] bg-[#0e55d9] text-[#ffffff]"
                          : "border-[#e2e8f0] bg-[#ffffff] text-[#374151] hover:border-[#0e55d9]/40"
                      }`}>
                      {bt.booking_type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unit selector */}
            {svc.units && svc.units.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">Unit</p>
                <select
                  value={unitId ?? ""}
                  onChange={(e) => setUnitId(Number(e.target.value))}
                  className="h-10 w-full max-w-xs rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 text-[13px] outline-none focus:border-[#0e55d9]">
                  {svc.units.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name} {u.unit_symbol ? `(${u.unit_symbol})` : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-5 flex items-center gap-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">Quantity</p>
              <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 py-1.5">
                <button type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-[14px] font-black text-[#0f172a]">{qty}</span>
                <button type="button"
                  onClick={() => setQty(qty + 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 text-[12.5px] text-[#7b5757]">{error}</p>
            )}
          </div>
        </div>

        {/* ── Right: Sticky booking panel (desktop) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-[0_4px_20px_rgba(14,85,217,0.08)]">
            <p className="text-[13px] font-semibold text-[#64748b]">Starting price</p>
            <p className="mt-1 text-[28px] font-black text-[#0e55d9]">
              ₹{total.toLocaleString("en-IN")}
            </p>
            {qty > 1 && (
              <p className="text-[12px] text-[#94a3b8]">₹{price} × {qty} units</p>
            )}
            <div className="my-4 h-px bg-[#f1f5f9]" />
            <ul className="space-y-2 mb-5">
              {["Verified professional","30-day service warranty","Transparent pricing","On-time guarantee"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[12px] text-[#374151]">
                  <CheckCircle size={14} className="shrink-0 text-[#ecfdf5]" /> {t}
                </li>
              ))}
            </ul>
            <button type="button" onClick={handleAddToCart} disabled={adding || inCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[14px] font-black text-[#ffffff] shadow-[0_6px_20px_rgba(14,85,217,0.28)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:translate-y-0">
              {adding ? <Loader2 size={18} className="animate-spin" />
                : added ? <><CheckCircle size={16} /> Added! Going to cart…</>
                : inCart ? <><ShoppingCart size={16} /> Already in cart</>
                : <><Plus size={16} /> Add to Cart · ₹{total.toLocaleString("en-IN")}</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden">
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-3.5 shadow-[0_-4px_20px_rgba(14,85,217,0.10)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] text-[#64748b]">Total price</p>
              <p className="text-[20px] font-black text-[#0e55d9]">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <button type="button" onClick={handleAddToCart} disabled={adding || inCart}
              className="flex items-center gap-2 rounded-xl bg-[#0e55d9] px-5 py-3 text-[13px] font-black text-[#ffffff] shadow-[0_4px_16px_rgba(14,85,217,0.28)] transition-all active:scale-95 disabled:opacity-60">
              {adding ? <Loader2 size={16} className="animate-spin" />
                : added ? <CheckCircle size={15} />
                : <ShoppingCart size={15} />}
              {inCart ? "In Cart" : added ? "Added!" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
