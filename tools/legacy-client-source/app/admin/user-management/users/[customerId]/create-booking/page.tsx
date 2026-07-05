"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, ChevronRight, Plus, Minus, Trash2,
  MapPin, Calendar, Clock, CheckCircle, Loader2, Search, X,
  IndianRupee, Tag, AlertCircle, Wrench,
} from "lucide-react";
import { adminAPI, customerAdminAPI } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api/coreClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  category_id: number;
  category_name: string;
  category_icon?: string | null;
  category_color?: string | null;
};

type BookingType = { id: number; name: string };
type UnitOption   = { unit_id: number; name: string; type?: string; price_per_unit?: number | null };
type SlotOption   = { slot_id: number; name: string; time?: string; start_time?: string; end_time?: string; available?: boolean; surge_multiplier?: number };

type ServiceItem = {
  service_id: number;
  title: string;
  image?: string | null;
  price?: number | null;
  base_price?: number | null;
  rating?: number;
  duration_minutes?: number | null;
  booking_types?: BookingType[];
  units?: UnitOption[];
  slots?: SlotOption[];
};

type CartItem = {
  serviceId: number;
  serviceCategoryId: number;
  serviceTitle: string;
  serviceImage?: string | null;
  bookingTypeId: number;
  bookingTypeName: string;
  unitId: number | null;
  unitName: string | null;
  quantity: number;
  price: number;
};

type Address = {
  address_id: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: number | string;
  latitude?: string;
  longitude?: string;
  is_selected?: boolean;
  area_id?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_MODES = [
  { id: 1, label: "Cash on Service",   desc: "Customer pays cash to technician" },
  { id: 2, label: "Online / UPI",       desc: "Customer pays via UPI or card"   },
  { id: 3, label: "Already Paid",       desc: "Mark as collected / admin override" },
];

function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return resolveUploadUrl(path) || null;
}

function calcPricing(cart: CartItem[]) {
  const subtotal   = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax        = Math.round(subtotal * 0.18);
  const total      = subtotal + tax;
  return { subtotal, tax, total };
}

const today = new Date().toISOString().split("T")[0];

// ─── Step indicator ───────────────────────────────────────────────────────────

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Select Services", "Booking Details", "Confirm"];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const num   = i + 1;
        const done  = step > num;
        const active = step === num;
        return (
          <div key={num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-[#f0fdf4] text-[#ffffff]" : active ? "bg-[#2563eb] text-[#ffffff]" : "bg-[#e2e8f0] text-[#53697e]"}`}>
                {done ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? "text-[#0f172a]" : "text-[#5c6a7f]"}`}>{label}</span>
            </div>
            {i < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > num ? "bg-[#4ade80]" : "bg-[#e2e8f0]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Service card with inline "Add" expansion ─────────────────────────────────

function ServiceCard({
  svc,
  categoryId,
  inCart,
  onAdd,
}: {
  svc: ServiceItem;
  categoryId: number;
  inCart: boolean;
  onAdd: (item: Omit<CartItem, "quantity"> & { quantity: number }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [btId,  setBtId]  = useState<number>(svc.booking_types?.[0]?.id ?? 1);
  const [btName,setBtName]= useState<string>(svc.booking_types?.[0]?.name ?? "Standard");
  const [unitId, setUnitId] = useState<number | null>(svc.units?.[0]?.unit_id ?? null);
  const [qty, setQty] = useState(1);

  const price = svc.price ?? svc.base_price ?? 0;
  const units = svc.units ?? [];
  const bookingTypes = svc.booking_types ?? [{ id: 1, name: "Standard" }];

  function handleAdd() {
    const selUnit = units.find(u => u.unit_id === unitId);
    onAdd({
      serviceId: svc.service_id,
      serviceCategoryId: categoryId,
      serviceTitle: svc.title,
      serviceImage: svc.image,
      bookingTypeId: btId,
      bookingTypeName: btName,
      unitId: selUnit?.unit_id ?? null,
      unitName: selUnit?.name ?? null,
      quantity: qty,
      price: typeof selUnit?.price_per_unit === "number" ? selUnit.price_per_unit : price,
    });
    setExpanded(false);
    setQty(1);
  }

  const thumb = imgUrl(svc.image);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#f1f5f9] shrink-0 flex items-center justify-center">
          {thumb
            ? <img src={thumb} alt={svc.title} className="w-full h-full object-cover" />
            : <Wrench className="w-6 h-6 text-[#5c6a7f]" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{svc.title}</p>
          {svc.duration_minutes && (
            <p className="text-xs text-[#5c6a7f] mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />{svc.duration_minutes} mins
            </p>
          )}
          <p className="text-sm font-bold text-[#2563eb] mt-0.5">
            {price > 0 ? `₹${price} Onwards` : "Price on Inspection"}
          </p>
        </div>

        {inCart ? (
          <span className="px-2.5 py-1 rounded-lg bg-[#f0fdf4] text-[#15803d] text-xs font-semibold border border-[#bbf7d0]">Added ✓</span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="px-3 py-1.5 rounded-lg border border-[#eff6ff] text-[#2563eb] text-sm font-semibold hover:bg-[#eff6ff] transition-colors"
          >
            {expanded ? "Cancel" : "Add"}
          </button>
        )}
      </div>

      {/* Inline expansion */}
      {expanded && !inCart && (
        <div className="border-t border-[#f1f5f9] bg-[#f8fafc]/60 p-4 space-y-4">
          {/* Booking Type */}
          {bookingTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#53697e] mb-2 uppercase tracking-wide">Booking Type</p>
              <div className="flex flex-wrap gap-2">
                {bookingTypes.map(bt => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => { setBtId(bt.id); setBtName(bt.name); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${btId === bt.id ? "bg-[#2563eb] text-[#ffffff] border-[#2563eb]" : "bg-[#ffffff] text-[#334155] border-[#e2e8f0] hover:border-[#93c5fd]"}`}
                  >
                    {bt.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unit */}
          {units.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#53697e] mb-2 uppercase tracking-wide">Unit</p>
              <select
                value={unitId ?? ""}
                onChange={e => setUnitId(e.target.value ? Number(e.target.value) : null)}
                className="w-full sm:w-56 rounded-lg border border-[#e2e8f0] bg-[#ffffff] text-sm px-3 py-2 focus:outline-none focus:border-[#60a5fa]"
              >
                {units.map(u => (
                  <option key={u.unit_id} value={u.unit_id}>{u.name}{u.price_per_unit ? ` — ₹${u.price_per_unit}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-[#53697e] mb-2 uppercase tracking-wide">Quantity</p>
              <div className="flex items-center gap-3 border border-[#e2e8f0] rounded-lg bg-[#ffffff] px-3 py-1.5 w-fit">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="text-[#53697e] hover:text-[#0f172a] transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold w-6 text-center">{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(10, q + 1))} className="text-[#53697e] hover:text-[#0f172a] transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="pt-5">
              <p className="text-xs text-[#5c6a7f]">Total</p>
              <p className="text-base font-bold text-[#0f172a]">
                ₹{(price * qty).toFixed(0)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-semibold transition-colors"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateBookingPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = useMemo(() => {
    const raw = params?.customerId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  // Navigation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: services
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [catServices,   setCatServices]   = useState<ServiceItem[]>([]);
  const [catLoading,    setCatLoading]    = useState(false);
  const [svcLoading,    setSvcLoading]    = useState(false);
  const [search,        setSearch]        = useState("");
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [allSlots,      setAllSlots]      = useState<SlotOption[]>([]);
  const loadedCats     = useRef(new Set<number>());
  const svcCache       = useRef<Record<number, ServiceItem[]>>({});

  // Step 2: details
  const [addresses,     setAddresses]     = useState<Address[]>([]);
  const [selectedAddr,  setSelectedAddr]  = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState(today);
  const [selectedSlot,  setSelectedSlot]  = useState<number | null>(null);
  const [notes,         setNotes]         = useState("");

  // Step 3: confirm
  const [paymentModeId, setPaymentModeId] = useState(1);
  const [creating,      setCreating]      = useState(false);
  const [createdUid,    setCreatedUid]    = useState<string | null>(null);
  const [createError,   setCreateError]   = useState("");

  // Load categories + addresses on mount
  useEffect(() => {
    if (!customerId) return;

    (async () => {
      setCatLoading(true);
      try {
        const res = await customerAdminAPI.getUserServiceCategories({ customerId: Number(customerId) });
        const cats: Category[] = res?.result || res?.data || [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCatId(cats[0].category_id);
      } catch { /* ignore */ } finally {
        setCatLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await customerAdminAPI.getUserAddresses({ customerId: Number(customerId) });
        const addrs: Address[] = res?.data || [];
        setAddresses(addrs);
        const sel = addrs.find(a => a.is_selected) ?? addrs[0];
        if (sel) setSelectedAddr(sel.address_id);
      } catch { /* ignore */ }
    })();
  }, [customerId]);

  // Load services when category changes
  useEffect(() => {
    if (!selectedCatId || !customerId) return;
    if (svcCache.current[selectedCatId]) {
      setCatServices(svcCache.current[selectedCatId]);
      return;
    }
    setSvcLoading(true);
    customerAdminAPI
      .getUserServicesList({ customerId: Number(customerId), category_id: selectedCatId })
      .then((res: any) => {
        const svcs: ServiceItem[] = res?.result || res?.data || [];
        svcCache.current[selectedCatId] = svcs;
        setCatServices(svcs);
      })
      .catch(() => setCatServices([]))
      .finally(() => setSvcLoading(false));
  }, [selectedCatId, customerId]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.serviceId === item.serviceId && c.bookingTypeId === item.bookingTypeId && c.unitId === item.unitId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const updateQty = (idx: number, delta: number) =>
    setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));

  const cartIds = useMemo(() => new Set(cart.map(c => c.serviceId)), [cart]);

  const filteredSvcs = useMemo(() => {
    if (!search.trim()) return catServices;
    const q = search.toLowerCase();
    return catServices.filter(s => s.title.toLowerCase().includes(q));
  }, [catServices, search]);

  const { subtotal, tax, total } = useMemo(() => calcPricing(cart), [cart]);

  const selectedAddress = addresses.find(a => a.address_id === selectedAddr);
  const areaId = selectedAddress?.area_id ?? null;

  async function handleCreate() {
    setCreateError("");
    if (!cart.length) { setCreateError("Please add at least one service."); return; }
    if (!selectedAddr) { setCreateError("Please select an address."); return; }
    if (!scheduledDate) { setCreateError("Please select a date."); return; }

    setCreating(true);
    try {
      const res = await adminAPI.createBooking({
        customerId: Number(customerId),
        addressId: selectedAddr,
        areaId,
        slotId: selectedSlot,
        scheduledDate,
        scheduledTime: allSlots.find(s => s.slot_id === selectedSlot)?.time || null,
        paymentModeId,
        notes: notes.trim() || null,
        services: cart.map(c => ({
          serviceId: c.serviceId,
          serviceCategoryId: c.serviceCategoryId,
          serviceTitle: c.serviceTitle,
          bookingTypeId: c.bookingTypeId,
          bookingTypeName: c.bookingTypeName,
          unitId: c.unitId,
          unitName: c.unitName,
          quantity: c.quantity,
          price: c.price,
        })),
      });
      if (res?.status && res?.data?.booking_uid) {
        setCreatedUid(res.data.booking_uid);
      } else {
        setCreateError(res?.message || "Failed to create booking. Please try again.");
      }
    } catch (err: any) {
      setCreateError(err?.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (createdUid) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#e2e8f0] p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#16a34a]" />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-1">Booking Created!</h2>
          <p className="text-[#53697e] text-sm mb-4">The booking has been placed and dispatch has been initiated.</p>
          <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] px-4 py-3 mb-6 inline-block">
            <p className="text-xs text-[#53697e] mb-0.5">Booking ID</p>
            <p className="font-mono font-bold text-[#2563eb] text-lg">{createdUid}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push(`/admin/user-management/users/${customerId}?tab=bookings`)}
              className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-semibold transition-colors"
            >
              View Customer Bookings
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/bookings`)}
              className="w-full py-2.5 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#334155] text-sm font-medium transition-colors"
            >
              Go to All Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#e2e8f0] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button type="button" onClick={() => step === 1 ? router.back() : setStep(s => (s - 1) as 1 | 2 | 3)} className="p-2 rounded-xl hover:bg-[#f1f5f9] text-[#475569] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-[#0f172a]">Create Booking</h1>
            <p className="text-xs text-[#53697e]">Customer #{customerId}</p>
          </div>
          <Stepper step={step} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ═══════════════ STEP 1: SELECT SERVICES ═══════════════ */}
        {step === 1 && (
          <div className="flex gap-4 h-[calc(100vh-160px)]">

            {/* Category sidebar */}
            <div className="w-52 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1">
              {catLoading ? (
                [...Array(6)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-[#e2e8f0] animate-pulse" />)
              ) : categories.map(cat => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => { setSelectedCatId(cat.category_id); setSearch(""); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${selectedCatId === cat.category_id ? "bg-[#2563eb] text-[#ffffff] shadow-sm" : "hover:bg-[#f1f5f9] text-[#334155]"}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat.category_name}</span>
                </button>
              ))}
            </div>

            {/* Services area */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm">
                <Search className="w-4 h-4 text-[#5c6a7f] shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search services…"
                  className="flex-1 text-sm bg-transparent outline-none text-[#334155] placeholder:text-[#5c6a7f]"
                />
                {search && <button type="button" onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-[#5c6a7f]" /></button>}
              </div>

              {/* Service cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {svcLoading ? (
                  [...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[#e2e8f0] animate-pulse" />)
                ) : filteredSvcs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#5c6a7f] gap-2">
                    <Wrench className="w-8 h-8" />
                    <p className="text-sm">No services found</p>
                  </div>
                ) : filteredSvcs.map(svc => (
                  <ServiceCard
                    key={svc.service_id}
                    svc={svc}
                    categoryId={selectedCatId!}
                    inCart={cartIds.has(svc.service_id)}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            </div>

            {/* Cart panel */}
            {cart.length > 0 && (
              <div className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
                <div className="bg-[#ffffff] rounded-xl border border-[#e2e8f0] flex-1 overflow-y-auto flex flex-col">
                  <div className="p-4 border-b border-[#f1f5f9]">
                    <p className="text-sm font-semibold text-[#0f172a]">Cart ({cart.length})</p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#f1f5f9]">
                    {cart.map((item, i) => (
                      <div key={i} className="p-3 flex gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0f172a] truncate">{item.serviceTitle}</p>
                          <p className="text-[11px] text-[#53697e]">{item.bookingTypeName}{item.unitName ? ` · ${item.unitName}` : ""}</p>
                          <p className="text-xs font-bold text-[#2563eb] mt-0.5">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1 border border-[#e2e8f0] rounded-lg">
                            <button type="button" onClick={() => updateQty(i, -1)} className="p-1 text-[#53697e] hover:text-[#0f172a]"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQty(i, 1)} className="p-1 text-[#53697e] hover:text-[#0f172a]"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(i)} className="text-[#f87171] hover:text-[#dc2626] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-[#f1f5f9] bg-[#f8fafc] rounded-b-xl">
                    <div className="flex justify-between text-xs text-[#53697e] mb-0.5">
                      <span>Subtotal</span><span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#53697e] mb-2">
                      <span>GST (18%)</span><span>₹{tax}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#0f172a]">
                      <span>Total</span><span>₹{total}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Next: Booking Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ STEP 2: BOOKING DETAILS ═══════════════ */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* Address */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#eff6ff]" /> Service Address
                </h3>
                {addresses.length === 0 ? (
                  <p className="text-sm text-[#5c6a7f]">No addresses found for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {addresses.map(addr => (
                      <button
                        key={addr.address_id}
                        type="button"
                        onClick={() => setSelectedAddr(addr.address_id)}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${selectedAddr === addr.address_id ? "border-[#60a5fa] bg-[#eff6ff]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${selectedAddr === addr.address_id ? "border-[#eff6ff] bg-[#eff6ff]" : "border-[#cbd5e1]"}`} />
                          <div>
                            <p className="text-sm font-medium text-[#0f172a]">{addr.address || "—"}</p>
                            <p className="text-xs text-[#53697e]">{[addr.city, addr.state].filter(Boolean).join(", ")}{addr.pincode ? ` - ${addr.pincode}` : ""}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date & Slot */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#eff6ff]" /> Schedule
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#53697e] mb-1.5 block">Service Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      min={today}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff]"
                    />
                  </div>

                  {allSlots.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-[#53697e] mb-1.5 block">Time Slot</label>
                      <div className="flex flex-wrap gap-2">
                        {allSlots.map(slot => (
                          <button
                            key={slot.slot_id}
                            type="button"
                            onClick={() => setSelectedSlot(slot.slot_id)}
                            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${selectedSlot === slot.slot_id ? "border-[#eff6ff] bg-[#2563eb] text-[#ffffff]" : "border-[#e2e8f0] bg-[#ffffff] text-[#334155] hover:border-[#93c5fd]"}`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {slot.time || `${slot.start_time} - ${slot.end_time}` || slot.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Technician Notes <span className="text-[#5c6a7f] font-normal">(Optional)</span></h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions for the technician…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#334155] focus:outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff] resize-none placeholder:text-[#5c6a7f]"
                />
                <p className="text-[11px] text-[#5c6a7f] text-right mt-1">{notes.length}/500</p>
              </div>
            </div>

            {/* Cart summary sidebar */}
            <div className="space-y-4">
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5 sticky top-24">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Selected Services</h3>
                <div className="space-y-2 mb-4">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#334155] truncate pr-2">{item.serviceTitle} × {item.quantity}</span>
                      <span className="font-medium text-[#0f172a] shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#f1f5f9] pt-3 space-y-1 text-xs text-[#53697e]">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                  <div className="flex justify-between"><span>GST (18%)</span><span>₹{tax}</span></div>
                  <div className="flex justify-between font-bold text-[#0f172a] text-sm pt-1 border-t border-[#f1f5f9] mt-1">
                    <span>Total</span><span>₹{total}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedAddr || !scheduledDate}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 text-[#ffffff] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Next: Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 3: CONFIRM ═══════════════ */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* Services summary */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#eff6ff]" /> Services ({cart.length})
                </h3>
                <div className="divide-y divide-[#f1f5f9]">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
                        {item.serviceImage
                          ? <img src={imgUrl(item.serviceImage) ?? ""} alt="" className="w-full h-full object-cover rounded-lg" />
                          : <Wrench className="w-4 h-4 text-[#5c6a7f]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{item.serviceTitle}</p>
                        <p className="text-xs text-[#53697e]">{item.bookingTypeName}{item.unitName ? ` · ${item.unitName}` : ""} · Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-[#0f172a] shrink-0">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking info */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#eff6ff]" /> Booking Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3">
                    <p className="text-xs text-[#53697e] mb-0.5">Date</p>
                    <p className="font-semibold text-[#0f172a]">{scheduledDate ? new Date(scheduledDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3">
                    <p className="text-xs text-[#53697e] mb-0.5">Time Slot</p>
                    <p className="font-semibold text-[#0f172a]">{selectedSlot ? (allSlots.find(s => s.slot_id === selectedSlot)?.time || allSlots.find(s => s.slot_id === selectedSlot)?.name || "—") : "Not selected"}</p>
                  </div>
                  <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-3 col-span-2">
                    <p className="text-xs text-[#53697e] mb-0.5">Address</p>
                    <p className="font-semibold text-[#0f172a]">{selectedAddress?.address || "—"}</p>
                    <p className="text-xs text-[#5c6a7f]">{[selectedAddress?.city, selectedAddress?.state].filter(Boolean).join(", ")}{selectedAddress?.pincode ? ` - ${selectedAddress.pincode}` : ""}</p>
                  </div>
                  {notes && (
                    <div className="rounded-xl bg-[#fffbeb] border border-[#fef3c7] p-3 col-span-2">
                      <p className="text-xs text-[#b45309] font-medium mb-0.5">Technician Notes</p>
                      <p className="text-sm text-[#78350f]">{notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment mode */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-[#eff6ff]" /> Payment Mode
                </h3>
                <div className="space-y-2">
                  {PAYMENT_MODES.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentModeId(pm.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors flex items-center gap-3 ${paymentModeId === pm.id ? "border-[#60a5fa] bg-[#eff6ff]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${paymentModeId === pm.id ? "border-[#eff6ff] bg-[#eff6ff]" : "border-[#cbd5e1]"}`} />
                      <div>
                        <p className="text-sm font-semibold text-[#0f172a]">{pm.label}</p>
                        <p className="text-xs text-[#53697e]">{pm.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {createError}
                </div>
              )}
            </div>

            {/* Price & submit */}
            <div className="space-y-4">
              <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-5 sticky top-24">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#eff6ff]" /> Price Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-[#475569]">
                      <span className="truncate pr-2">{item.serviceTitle} × {item.quantity}</span>
                      <span className="shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#f1f5f9] pt-2 space-y-1.5 text-xs text-[#53697e]">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                    <div className="flex justify-between"><span>GST (18%)</span><span>₹{tax}</span></div>
                  </div>
                  <div className="flex justify-between font-bold text-[#0f172a] text-base border-t border-[#e2e8f0] pt-2 mt-1">
                    <span>Total Amount</span><span>₹{total}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full mt-5 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-[#ffffff] text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    : <><CheckCircle className="w-4 h-4" /> Confirm & Create Booking</>}
                </button>

                <p className="text-[11px] text-[#5c6a7f] text-center mt-3 flex items-center justify-center gap-1">
                  Booking will be dispatched immediately to nearby technicians.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
