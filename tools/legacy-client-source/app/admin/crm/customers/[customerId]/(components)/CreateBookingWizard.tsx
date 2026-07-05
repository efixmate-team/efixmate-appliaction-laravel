"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Search, Plus, Minus, ChevronRight, CheckCircle2, ArrowLeft, Calendar, MapPin, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerAdminAPI } from "@/lib/api/userApi";
import { lookupAPI, bookingAdminAPI } from "@/lib/api/adminApi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceCategory {
  category_id: number;
  category: string;
  description?: string;
  service_icon?: string;
  service_color?: string;
}

interface ServiceItem {
  service_id: number;
  service: string;
  description?: string;
  base_price?: number;
  service_icon?: string;
  service_color?: string;
  booking_types?: BookingType[];
  units?: Unit[];
}

interface BookingType {
  booking_type_id: number;
  booking_type: string;
}

interface Unit {
  unit_id: number;
  unit: string;
}

interface SelectedService {
  service: ServiceItem;
  category: ServiceCategory;
  bookingTypeId: number;
  bookingTypeName: string;
  unitId: number | null;
  unitName: string;
  quantity: number;
}

interface CustomerAddress {
  address_id: number;
  address_line1?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active?: boolean;
}

interface Props {
  customerId: number;
  onClose: () => void;
  onCreated: () => void;
}

const STEPS = ["Select Services", "Booking Details", "Confirm"];

// ── Icon helper ───────────────────────────────────────────────────────────────

function ServiceIcon({ icon, color, size = 40 }: { icon?: string; color?: string; size?: number }) {
  const bg = color || "#3b82f6";
  return (
    <div
      className="flex items-center justify-center rounded-xl text-[#ffffff] font-bold shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.45 }}
    >
      {icon ? icon.slice(0, 2) : "S"}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CreateBookingWizard({ customerId, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);

  // Step 0 data
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [globalBookingTypes, setGlobalBookingTypes] = useState<BookingType[]>([]);
  const [globalUnits, setGlobalUnits] = useState<Unit[]>([]);
  const [cart, setCart] = useState<SelectedService[]>([]);
  const [configuring, setConfiguring] = useState<number | null>(null); // service_id being configured

  // temp config state for inline configurator
  const [tempBtId, setTempBtId] = useState<number>(0);
  const [tempBtName, setTempBtName] = useState("");
  const [tempUnitId, setTempUnitId] = useState<number | null>(null);
  const [tempUnitName, setTempUnitName] = useState("");
  const [tempQty, setTempQty] = useState(1);

  // Step 1 data
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [instructions, setInstructions] = useState("");

  // Step 2 / create
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const [catRes, btRes, unitRes] = await Promise.all([
        customerAdminAPI.getUserServiceCategories({ customerId }),
        lookupAPI.getBookingTypes(),
        lookupAPI.getUnits(),
      ]);
      if (catRes?.status && catRes.data) setCategories(catRes.data as ServiceCategory[]);
      if (btRes?.status && btRes.data) setGlobalBookingTypes(btRes.data as BookingType[]);
      if (unitRes?.status && unitRes.data) setGlobalUnits(unitRes.data as Unit[]);
    })();
  }, [customerId]);

  useEffect(() => {
    if (step === 1) {
      void customerAdminAPI.getUserAddresses({ customerId }).then((res: any) => {
        if (res?.status && res.data) {
          const addrs = res.data as CustomerAddress[];
          setAddresses(addrs);
          const active = addrs.find((a) => a.is_active);
          if (active && !selectedAddressId) setSelectedAddressId(active.address_id);
          else if (addrs.length && !selectedAddressId) setSelectedAddressId(addrs[0].address_id);
        }
      });
    }
  }, [step, customerId, selectedAddressId]);

  const loadServices = useCallback(
    async (cat: ServiceCategory) => {
      setServicesLoading(true);
      setServices([]);
      const res = await customerAdminAPI.getUserServicesList({
        customerId,
        category_id: cat.category_id,
      });
      if (res?.status && res.data) setServices(res.data as ServiceItem[]);
      setServicesLoading(false);
    },
    [customerId]
  );

  // ── Cart helpers ──────────────────────────────────────────────────────────

  function openConfigurator(svc: ServiceItem) {
    const existing = cart.find((c) => c.service.service_id === svc.service_id);
    if (existing) {
      setTempBtId(existing.bookingTypeId);
      setTempBtName(existing.bookingTypeName);
      setTempUnitId(existing.unitId);
      setTempUnitName(existing.unitName);
      setTempQty(existing.quantity);
    } else {
      const bt = globalBookingTypes[0];
      setTempBtId(bt?.booking_type_id ?? 0);
      setTempBtName(bt?.booking_type ?? "");
      setTempUnitId(null);
      setTempUnitName("");
      setTempQty(1);
    }
    setConfiguring(svc.service_id);
  }

  function confirmAdd(svc: ServiceItem) {
    if (!selectedCategory) return;
    setCart((prev) => {
      const filtered = prev.filter((c) => c.service.service_id !== svc.service_id);
      return [
        ...filtered,
        {
          service: svc,
          category: selectedCategory,
          bookingTypeId: tempBtId,
          bookingTypeName: tempBtName,
          unitId: tempUnitId,
          unitName: tempUnitName,
          quantity: tempQty,
        },
      ];
    });
    setConfiguring(null);
  }

  function removeFromCart(serviceId: number) {
    setCart((prev) => prev.filter((c) => c.service.service_id !== serviceId));
    if (configuring === serviceId) setConfiguring(null);
  }

  // ── Create Booking ────────────────────────────────────────────────────────

  async function createBooking() {
    if (!cart.length || !selectedAddressId) return;
    setCreating(true);
    setError("");

    // Create one booking per service (matches backend model – one service per booking record)
    const results: boolean[] = [];
    for (const item of cart) {
      const price = item.service.base_price ?? 0;
      const total = price * item.quantity;
      const res = await bookingAdminAPI.createBookingForCustomer({
        customer_id: customerId,
        address_id: selectedAddressId,
        service_category_id: item.category.category_id,
        service_id: item.service.service_id,
        booking_type_id: item.bookingTypeId || 1,
        quantity: item.quantity,
        base_price: price,
        unit_price: price,
        final_price: total,
        booking_status_id: 1,
        payment_status_id: 1,
        problem_description: instructions || null,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        is_active: true,
      });
      results.push(!!res?.status);
    }

    setCreating(false);
    if (results.every(Boolean)) {
      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1800);
    } else {
      setError("Some bookings could not be created. Please check and try again.");
    }
  }

  // ── Filtered categories ───────────────────────────────────────────────────

  const filteredCats = categories.filter((c) =>
    c.category.toLowerCase().includes(catSearch.toLowerCase())
  );

  // ── Price summary ─────────────────────────────────────────────────────────

  const subtotal = cart.reduce(
    (sum, c) => sum + (c.service.base_price ?? 0) * c.quantity,
    0
  );
  const platformFee = Math.round(subtotal * 0.05);
  const taxes = Math.round(subtotal * 0.18);
  const total = subtotal + platformFee + taxes;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-[#ffffff] shadow-2xl overflow-hidden">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-6 py-4">
          {step > 0 && !success && (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  setStep((s) => s - 1);
                }
              }}
              className="rounded-lg p-1 hover:bg-[#f1f5f9]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[#1e293b]">Create Booking</h2>
            <div className="mt-1 flex gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`h-1.5 w-10 rounded-full transition-colors ${
                      i <= step ? "bg-[#0284c7]" : "bg-[#e2e8f0]"
                    }`}
                  />
                  <span className={`text-xs ${i === step ? "text-[#0369a1] font-medium" : "text-[#94a3b8]"}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-[#f1f5f9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Success ───────────────────────────────────────────────────── */}
          {success && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
              <CheckCircle2 className="h-16 w-16 text-[#ecfdf5]" />
              <p className="text-xl font-semibold text-[#1e293b]">Booking Created!</p>
              <p className="text-sm text-[#53697e] text-center">
                {cart.length} service{cart.length > 1 ? "s" : ""} booked successfully.
              </p>
            </div>
          )}

          {/* ── Step 0: Service Categories ────────────────────────────────── */}
          {!success && step === 0 && !selectedCategory && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search for a service (e.g. Electrical, Plumbing)"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0f9ff]"
                />
              </div>
              <p className="text-xs font-medium text-[#53697e] px-1">All Services</p>
              {filteredCats.length === 0 && (
                <p className="py-8 text-center text-sm text-[#94a3b8]">No services found.</p>
              )}
              {filteredCats.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    void loadServices(cat);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-3 text-left hover:border-[#7dd3fc] hover:bg-[#f0f9ff] transition-colors"
                >
                  <ServiceIcon icon={cat.service_icon} color={cat.service_color} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1e293b] text-sm">{cat.category}</p>
                    {cat.description && (
                      <p className="text-xs text-[#53697e] truncate">{cat.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                </button>
              ))}
            </div>
          )}

          {/* ── Step 0: Service List (category selected) ─────────────────── */}
          {!success && step === 0 && selectedCategory && (
            <div className="pb-24">
              {/* Category header */}
              <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] p-3">
                <ServiceIcon icon={selectedCategory.service_icon} color={selectedCategory.service_color} size={48} />
                <div>
                  <p className="font-semibold text-[#1e293b]">{selectedCategory.category}</p>
                  {selectedCategory.description && (
                    <p className="text-xs text-[#53697e]">{selectedCategory.description}</p>
                  )}
                </div>
              </div>

              <p className="px-4 pt-4 pb-2 text-sm font-semibold text-[#334155]">
                Our {selectedCategory.category} Services
              </p>

              {servicesLoading && (
                <div className="flex items-center justify-center py-12 text-[#94a3b8] text-sm">
                  Loading services…
                </div>
              )}

              {!servicesLoading && services.length === 0 && (
                <p className="py-8 text-center text-sm text-[#94a3b8]">
                  No services available in this category for this customer.
                </p>
              )}

              {!servicesLoading &&
                services.map((svc) => {
                  const inCart = cart.find((c) => c.service.service_id === svc.service_id);
                  const isConfiguring = configuring === svc.service_id;
                  const btOptions = svc.booking_types?.length ? svc.booking_types : globalBookingTypes;
                  const unitOptions = svc.units?.length ? svc.units : globalUnits;

                  return (
                    <div key={svc.service_id} className="mx-4 mb-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        <ServiceIcon icon={svc.service_icon} color={svc.service_color || selectedCategory.service_color} size={48} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1e293b] text-sm">{svc.service}</p>
                          {svc.description && (
                            <p className="text-xs text-[#53697e] line-clamp-2">{svc.description}</p>
                          )}
                          {svc.base_price != null && (
                            <p className="text-xs font-semibold text-[#334155] mt-0.5">
                              {fmt(svc.base_price)}{" "}
                              <span className="font-normal text-[#94a3b8]">Onwards</span>
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => (isConfiguring ? setConfiguring(null) : openConfigurator(svc))}
                          className={`shrink-0 rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
                            inCart
                              ? "border-[#f0f9ff] bg-[#f0f9ff] text-[#0369a1]"
                              : "border-[#f0f9ff] text-[#0284c7] hover:bg-[#f0f9ff]"
                          }`}
                        >
                          {inCart ? "Added" : "Add"}
                        </button>
                      </div>

                      {/* Inline configurator */}
                      {isConfiguring && (
                        <div className="border-t border-[#f1f5f9] bg-[#f8fafc] p-3 space-y-3">
                          {/* Booking Type */}
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-[#475569]">
                              1. Booking Type
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {btOptions.map((bt) => (
                                <button
                                  key={bt.booking_type_id}
                                  type="button"
                                  onClick={() => {
                                    setTempBtId(bt.booking_type_id);
                                    setTempBtName(bt.booking_type);
                                  }}
                                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                                    tempBtId === bt.booking_type_id
                                      ? "border-[#f0f9ff] bg-[#0284c7] text-[#ffffff]"
                                      : "border-[#cbd5e1] bg-[#ffffff] text-[#475569] hover:border-[#38bdf8]"
                                  }`}
                                >
                                  {bt.booking_type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {/* Unit */}
                            {unitOptions.length > 0 && (
                              <div className="flex-1">
                                <p className="mb-1.5 text-xs font-medium text-[#475569]">2. Unit</p>
                                <select
                                  value={tempUnitId ?? ""}
                                  onChange={(e) => {
                                    const id = Number(e.target.value) || null;
                                    setTempUnitId(id);
                                    setTempUnitName(
                                      unitOptions.find((u) => u.unit_id === id)?.unit ?? ""
                                    );
                                  }}
                                  className="w-full rounded-lg border border-[#cbd5e1] bg-[#ffffff] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#f0f9ff]"
                                >
                                  <option value="">Select unit</option>
                                  {unitOptions.map((u) => (
                                    <option key={u.unit_id} value={u.unit_id}>
                                      {u.unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Quantity */}
                            <div className="flex-1">
                              <p className="mb-1.5 text-xs font-medium text-[#475569]">
                                {unitOptions.length > 0 ? "3." : "2."} Quantity
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTempQty((q) => Math.max(1, q - 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#ffffff] text-[#334155] hover:bg-[#f8fafc]"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-medium">{tempQty}</span>
                                <button
                                  type="button"
                                  onClick={() => setTempQty((q) => q + 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#ffffff] text-[#334155] hover:bg-[#f8fafc]"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => confirmAdd(svc)} className="flex-1 bg-[#0284c7] hover:bg-[#0369a1]">
                              {inCart ? "Update" : "Add to Booking"}
                            </Button>
                            {inCart && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFromCart(svc.service_id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── Step 1: Booking Details ───────────────────────────────────── */}
          {!success && step === 1 && (
            <div className="p-4 space-y-5">
              {/* Selected services summary */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#334155]">
                    Selected Services ({cart.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs text-[#0284c7] hover:underline"
                  >
                    + Add More
                  </button>
                </div>
                {cart.map((item) => (
                  <div
                    key={item.service.service_id}
                    className="flex items-start gap-3 border-t border-[#f1f5f9] pt-3"
                  >
                    <ServiceIcon
                      icon={item.service.service_icon}
                      color={item.service.service_color || item.category.service_color}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1e293b]">{item.service.service}</p>
                      <p className="text-xs text-[#53697e]">
                        {item.bookingTypeName}
                        {item.unitName ? ` • ${item.unitName}` : ""}
                        {" • "}Qty {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1e293b]">
                        {fmt((item.service.base_price ?? 0) * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.service.service_id)}
                        className="text-xs text-[#374151] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0284c7]" />
                  <p className="text-sm font-semibold text-[#334155]">Service Address</p>
                </div>
                {addresses.length === 0 && (
                  <p className="text-xs text-[#94a3b8]">No addresses found for this customer.</p>
                )}
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.address_id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors ${
                        selectedAddressId === addr.address_id
                          ? "border-[#38bdf8] bg-[#f0f9ff]"
                          : "border-[#e2e8f0] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.address_id}
                        checked={selectedAddressId === addr.address_id}
                        onChange={() => setSelectedAddressId(addr.address_id)}
                        className="mt-0.5 accent-[#0284c7]"
                      />
                      <div className="text-xs text-[#334155]">
                        <p>{addr.address_line1 || addr.address || "Address"}</p>
                        {(addr.city || addr.state || addr.pincode) && (
                          <p className="text-[#94a3b8]">
                            {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {addr.is_active && (
                          <span className="inline-block rounded-full bg-[#d1fae5] px-1.5 py-0.5 text-[10px] text-[#047857] font-medium mt-0.5">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#0284c7]" />
                  <p className="text-sm font-semibold text-[#334155]">Schedule (Optional)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[#53697e]">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0f9ff]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#53697e]">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0f9ff]"
                    />
                  </div>
                </div>
              </div>

              {/* Technician Instructions */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#0284c7]" />
                  <p className="text-sm font-semibold text-[#334155]">
                    Technician Instructions{" "}
                    <span className="font-normal text-[#94a3b8]">(Optional)</span>
                  </p>
                </div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={250}
                  rows={3}
                  placeholder="Write any special instructions for the technician…"
                  className="w-full resize-none rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0f9ff]"
                />
                <p className="text-right text-xs text-[#94a3b8]">{instructions.length}/250</p>
              </div>

              {/* Price Details */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-2">
                <p className="text-sm font-semibold text-[#334155]">Price Details</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#475569]">
                    <span>Subtotal ({cart.length} service{cart.length > 1 ? "s" : ""})</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>Platform Fee</span>
                    <span>{fmt(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>Taxes (18% GST)</span>
                    <span>{fmt(taxes)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#f1f5f9] pt-2 font-semibold text-[#1e293b]">
                    <span>Total Amount</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Confirm ───────────────────────────────────────────── */}
          {!success && step === 2 && (
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#065f46]">
                Review the booking details below and click <strong>Create Booking</strong> to confirm.
              </div>

              {/* Services */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-2">
                <p className="text-sm font-semibold text-[#334155]">Services ({cart.length})</p>
                {cart.map((item) => (
                  <div key={item.service.service_id} className="flex items-center gap-3 border-t border-[#f1f5f9] pt-2">
                    <ServiceIcon
                      icon={item.service.service_icon}
                      color={item.service.service_color || item.category.service_color}
                      size={32}
                    />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{item.service.service}</span>
                      <span className="text-[#94a3b8] text-xs">
                        {" "}— {item.bookingTypeName}
                        {item.unitName ? `, ${item.unitName}` : ""}
                        , Qty {item.quantity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {fmt((item.service.base_price ?? 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address & Schedule */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-[#94a3b8] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-[#334155]">Address</p>
                    {(() => {
                      const addr = addresses.find((a) => a.address_id === selectedAddressId);
                      return addr ? (
                        <p className="text-[#53697e] text-xs">
                          {addr.address_line1 || addr.address}
                          {addr.city ? `, ${addr.city}` : ""}
                          {addr.pincode ? ` - ${addr.pincode}` : ""}
                        </p>
                      ) : <p className="text-[#94a3b8] text-xs">No address selected</p>;
                    })()}
                  </div>
                </div>
                {(scheduledDate || scheduledTime) && (
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4 text-[#94a3b8] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-[#334155]">Scheduled</p>
                      <p className="text-[#53697e] text-xs">
                        {scheduledDate} {scheduledTime}
                      </p>
                    </div>
                  </div>
                )}
                {instructions && (
                  <div className="flex gap-2">
                    <Wrench className="h-4 w-4 text-[#94a3b8] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-[#334155]">Instructions</p>
                      <p className="text-[#53697e] text-xs">{instructions}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#475569]">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>Platform Fee</span><span>{fmt(platformFee)}</span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>Taxes (18% GST)</span><span>{fmt(taxes)}</span>
                </div>
                <div className="flex justify-between border-t border-[#f1f5f9] pt-2 font-semibold text-[#1e293b] text-base">
                  <span>Total Amount</span><span>{fmt(total)}</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-3 text-sm text-[#be123c]">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {!success && (
          <div className="border-t border-[#f1f5f9] px-6 py-4">
            {step === 0 && selectedCategory && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#475569]">
                  {cart.length > 0 ? (
                    <span>
                      <strong>{cart.length}</strong> service{cart.length > 1 ? "s" : ""} added
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">No services selected yet</span>
                  )}
                </div>
                <Button
                  onClick={() => setStep(1)}
                  disabled={cart.length === 0}
                  className="bg-[#0284c7] hover:bg-[#0369a1]"
                >
                  Proceed →
                </Button>
              </div>
            )}

            {step === 0 && !selectedCategory && (
              <p className="text-center text-xs text-[#94a3b8]">
                Select a service category to begin
              </p>
            )}

            {step === 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[#1e293b]">
                  Total: {fmt(total)}
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddressId || cart.length === 0}
                  className="bg-[#0284c7] hover:bg-[#0369a1]"
                >
                  Review Booking →
                </Button>
              </div>
            )}

            {step === 2 && (
              <Button
                onClick={() => void createBooking()}
                disabled={creating || !selectedAddressId}
                className="w-full bg-[#0284c7] hover:bg-[#0369a1]"
              >
                {creating ? "Creating Booking…" : "Create Booking"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
