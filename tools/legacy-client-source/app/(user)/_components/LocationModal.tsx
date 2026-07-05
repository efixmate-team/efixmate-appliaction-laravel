/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Navigation,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLocationStore } from "@/store/location.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import { reverseGeocodeCoords, requestGPS } from "@/lib/locationDetection";
import {
  getAddresses,
  upsertAddress,
  activateAddress,
  deleteAddress,
} from "@/lib/api/userClient";
import {
  type AddressFormData,
  type UserAddress,
  formFromLocation,
  formFromUserAddress,
  getAddressDisplayTitle,
  getAddressLabel,
  locationFromUserAddress,
  normalizeUserAddresses,
  resolveNearestSavedAddress,
  toUpsertAddressPayload,
  validateAddressForm,
} from "@/lib/userAddress";
import AddressFormStep from "@/components/user/AddressFormStep";

const RECENT_KEY = "efm_recent_locations";

function getRecentLocations() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentLocation(loc: { name: string; state: string }) {
  if (typeof window === "undefined") return;
  const recent = getRecentLocations();
  const filtered = recent.filter((r: { name: string }) => r.name !== loc.name);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([loc, ...filtered].slice(0, 5)),
  );
}

export default function LocationModal() {
  const { closeModal, setLocation, location, clearServiceability, checkServiceability } = useLocationStore();
  const { token } = useUserAuthStore();

  const [view, setView] = useState<"select" | "form">("select");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addrsLoading, setAddrsLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const [form, setForm] = useState<AddressFormData | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [nearbyId, setNearbyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserAddress | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === "select") setTimeout(() => inputRef.current?.focus(), 150);
  }, [view]);

  const loadAddresses = async () => {
    const res = (await getAddresses()) as { status?: boolean; data?: unknown };
    if (res.status === false) return;
    const list = normalizeUserAddresses(res.data);
    setAddresses(list);
    const match = await resolveNearestSavedAddress(list);
    if (match?.gpsUsed) setNearbyId(match.address.address_id);
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      setAddrsLoading(true);
      try {
        await loadAddresses();
      } catch {
        /* ignore */
      }
      setAddrsLoading(false);
    })();
  }, [token]);

  // Search filters saved addresses locally — no external API call

  const applyLocation = (loc: ReturnType<typeof locationFromUserAddress>) => {
    saveRecentLocation({ name: loc.city, state: loc.state });
    clearServiceability();
    setLocation(loc);
    closeModal();
    checkServiceability(loc.lat, loc.lng);
  };

  const selectSavedAddress = async (addr: UserAddress) => {
    setSelectingId(addr.address_id);
    setFormError("");
    try {
      if (!addr.is_selected) {
        const res = (await activateAddress(addr.address_id)) as {
          status?: boolean;
          message?: string;
        };
        if (res.status === false) {
          setFormError(res.message || "Could not select address.");
          return;
        }
      }
      applyLocation(locationFromUserAddress(addr));
    } catch {
      setFormError("Could not select address. Please try again.");
    } finally {
      setSelectingId(null);
    }
  };

  const openAddressForm = (
    loc: Parameters<typeof formFromLocation>[0],
    streetHint?: string,
  ) => {
    const next = formFromLocation(loc);
    if (streetHint && !next.address.trim()) {
      next.address = streetHint.split(",")[0]?.trim() ?? "";
    }
    setEditingId(null);
    setForm(next);
    setFormError("");
    setView("form");
  };

  const openEditAddress = (addr: UserAddress) => {
    setEditingId(addr.address_id);
    setForm(formFromUserAddress(addr));
    setFormError("");
    setPendingDelete(null);
    setDeleteError("");
    setView("form");
  };

  const confirmDeleteAddress = async () => {
    if (!pendingDelete) return;
    const addr = pendingDelete;
    setDeletingId(addr.address_id);
    setDeleteError("");
    try {
      const res = (await deleteAddress(addr.address_id)) as {
        status?: boolean;
        message?: string;
        data?: { selectedAddress?: UserAddress };
      };
      if (res.status === false) {
        setDeleteError(res.message || "Could not remove address.");
        return;
      }

      setPendingDelete(null);
      await loadAddresses();

      const selected = res.data?.selectedAddress
        ? normalizeUserAddresses([res.data.selectedAddress])[0]
        : null;
      if (selected) {
        setLocation(locationFromUserAddress(selected));
      } else if (location?.addressId === addr.address_id) {
        setLocation({
          lat: 21.2514,
          lng: 81.6296,
          area: "",
          city: "Raipur",
          state: "CG",
          displayName: "Raipur, CG",
          source: "default",
        });
      }
    } catch {
      setDeleteError("Could not remove address. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const useGPS = async () => {
    setGpsLoading(true);
    setGpsError("");
    const pos = await requestGPS();
    if (!pos) {
      setGpsError(
        "Location permission denied or unavailable. Pick a saved address or search manually.",
      );
      setGpsLoading(false);
      return;
    }
    const loc = await reverseGeocodeCoords(
      pos.coords.latitude,
      pos.coords.longitude,
      "gps",
    );
    if (token) {
      openAddressForm(loc);
      setGpsLoading(false);
      return;
    }
    applyLocation(loc);
    setGpsLoading(false);
  };

  const submitAddressForm = async () => {
    if (!form) return;
    const validation = validateAddressForm(form);
    if (validation) {
      setFormError(validation);
      return;
    }
    const editing =
      editingId != null
        ? addresses.find((a) => a.address_id === editingId)
        : null;
    setSaving(true);
    setFormError("");
    try {
      const res = (await upsertAddress(
        toUpsertAddressPayload(form, {
          addressId: editingId ?? undefined,
          isSelected: editing ? editing.is_selected : true,
        }),
      )) as { status?: boolean; message?: string; data?: UserAddress };

      if (res.status === false) {
        setFormError(res.message || "Could not save address.");
        return;
      }

      if (editingId != null) {
        await loadAddresses();
        const rows = normalizeUserAddresses(res.data ? [res.data] : []);
        if (rows[0] && (editing?.is_selected || rows[0].is_selected)) {
          setLocation(locationFromUserAddress(rows[0]));
        }
        setEditingId(null);
        setForm(null);
        setView("select");
        return;
      }

      const rows = normalizeUserAddresses(res.data ? [res.data] : []);
      const loc = rows[0]
        ? locationFromUserAddress(rows[0])
        : locationFromUserAddress({
            address_id: 0,
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            pincode: form.pincode,
            latitude: form.latitude,
            longitude: form.longitude,
            is_selected: true,
          });
      applyLocation(loc);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[300] flex items-start justify-center bg-[#000000]/50 backdrop-blur-sm pt-[8vh] px-4 pb-6'>
      <div className='relative w-full max-w-md max-h-[88vh] overflow-hidden rounded-xl bg-[#ffffff] shadow-2xl flex flex-col'>
        <div className='flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4 shrink-0'>
          <h2 className='text-[17px] font-black text-[#111827]'>
            {view === "form"
              ? editingId != null
                ? "Edit address"
                : "Add service address"
              : "Select your location"}
          </h2>
          <button
            type='button'
            onClick={closeModal}
            className='grid h-8 w-8 place-items-center rounded-full bg-[#f3f4f6] text-[#344352] hover:bg-[#e5e7eb] transition-colors'>
            <X size={16} />
          </button>
        </div>

        <div className='overflow-y-auto p-5 space-y-4'>
          {view === "form" && form ? (
            <AddressFormStep
              form={form}
              onChange={(patch) =>
                setForm((prev) => (prev ? { ...prev, ...patch } : prev))
              }
              onSubmit={submitAddressForm}
              onBack={() => {
                setView("select");
                setFormError("");
                setEditingId(null);
                setForm(null);
              }}
              loading={saving}
              error={formError}
              title={editingId != null ? "Update address details" : undefined}
              subtitle={
                editingId != null
                  ? "Edit your saved address. Changes apply to future bookings."
                  : undefined
              }
              submitLabel={editingId != null ? "Save changes" : undefined}
            />
          ) : (
            <>
              {/* ── 1. Search (filters saved addresses) ── */}
              <div className='relative'>
                <Search
                  size={15}
                  className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]'
                />
                <input
                  ref={inputRef}
                  type='text'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search your saved addresses…'
                  className='w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] py-3 pl-10 pr-10 text-[13.5px] text-[#1f2937] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#0e55d9] focus:ring-2 focus:ring-[#0e55d9]/10'
                />
                {query && (
                  <button
                    type='button'
                    onClick={() => setQuery("")}
                    className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]'>
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                type='button'
                onClick={useGPS}
                disabled={gpsLoading}
                className='group relative w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-lg hover:shadow-[#eff6ff]/5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70'>
                {/* Premium Interactive Background */}
                <div className='absolute inset-0 -z-10 bg-gradient-to-br from-[#eff6ff]/0 via-[#eff6ff]/0 to-[#eff6ff]/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                <div className='flex items-center gap-4'>
                  {/* Stable Icon / Loader Block */}
                  <div className='relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#eff6ff] text-[#ffffff] shadow-md shadow-[#eff6ff]/20 transition-all duration-300 group-hover:scale-105 group-hover:from-[#1d4ed8] group-hover:to-[#2563eb]'>
                    {gpsLoading ? (
                      <Loader2 size={18} className='animate-spin' />
                    ) : (
                      <Navigation
                        size={16}
                        className='transition-transform duration-300 group-hover:rotate-12'
                        fill='currentColor'
                      />
                    )}

                    {/* Tiny live indicator dot while detecting */}
                    {gpsLoading && (
                      <span className='absolute -right-0.5 -top-0.5 flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fbbf24] opacity-75'></span>
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-[#fffbeb]'></span>
                      </span>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='text-[14px] font-bold  text-[#1e293b] group-hover:text-[#1d4ed8] transition-colors'>
                        {gpsLoading
                          ? "Pinpointing your device..."
                          : token
                            ? "Use current location"
                            : "Detect my location"}
                      </p>

                      {/* Subtle status tag for logged-in states */}
                      {token && !gpsLoading && (
                        <span className='rounded bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#2563eb] border border-[#dbeafe]'>
                          Auto-Fill
                        </span>
                      )}
                    </div>

                    <p className='mt-0.5 text-[12px] leading-normal text-[#53697e]'>
                      {gpsLoading
                        ? "Securing satellite signal for accurate coordinates"
                        : token
                          ? "Fills city & pincode instantly — just add specific door number"
                          : "Enables fast address check via secure device telemetry"}
                    </p>
                  </div>
                </div>
              </button>

              {gpsError && (
                <p className='rounded-lg bg-[#fef2f2] border border-[#fee2e2] px-4 py-2.5 text-[12.5px] text-[#dc2626]'>
                  {gpsError}
                </p>
              )}

              {/* ── 3. Saved addresses (filtered by query) ── */}
              {token && (
                <div className='space-y-2'>
                  <p className='text-[11px] font-black uppercase tracking-widest text-[#9ca3af]'>
                    {query ? `Results for "${query}"` : "Saved addresses"}
                  </p>
                  {addrsLoading ? (
                    <div className='flex items-center gap-2 py-4 text-[13px] text-[#344352]'>
                      <Loader2
                        size={16}
                        className='animate-spin text-[#0e55d9]'
                      />
                      Loading addresses…
                    </div>
                  ) : (
                    (() => {
                      const q = query.trim().toLowerCase();
                      const filtered = q
                        ? addresses.filter((a) =>
                            [
                              a.address,
                              a.city,
                              a.state,
                              a.pincode,
                              getAddressLabel(a),
                            ].some(
                              (v) => v && String(v).toLowerCase().includes(q),
                            ),
                          )
                        : addresses;
                      if (filtered.length === 0) {
                        return (
                          <p className='rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-[12.5px] text-[#344352]'>
                            {q
                              ? `No saved address matches "${query}".`
                              : "No saved addresses yet. Use GPS or add one."}
                          </p>
                        );
                      }
                      return (
                        <div className='overflow-hidden rounded-xl border border-[#f3f4f6] divide-y divide-[#f9fafb]'>
                          {filtered.map((addr) => {
                            const label = getAddressLabel(addr);
                            const title = getAddressDisplayTitle(addr);
                            const isNearby = nearbyId === addr.address_id;
                            return (
                              <div
                                key={addr.address_id}
                                className='flex items-start gap-2 px-3 py-3 hover:bg-[#f8fafc] transition-colors'>
                                <button
                                  type='button'
                                  disabled={selectingId === addr.address_id}
                                  onClick={() => selectSavedAddress(addr)}
                                  className='flex min-w-0 flex-1 items-start gap-3 text-left disabled:opacity-60'>
                                  <div
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${addr.is_selected ? "border-[#0e55d9] bg-[#0e55d9]" : "border-[#d1d5db]"}`}>
                                    {addr.is_selected && (
                                      <Check
                                        size={11}
                                        className='text-[#ffffff]'
                                        strokeWidth={3}
                                      />
                                    )}
                                  </div>
                                  <div className='min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-center gap-1.5'>
                                      <p className='text-[13px] font-semibold text-[#111827]'>
                                        {title}
                                      </p>
                                      {label !== "Other" && (
                                        <span className='rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0e55d9]'>
                                          {label}
                                        </span>
                                      )}
                                      {isNearby && (
                                        <span className='rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#047857]'>
                                          Near you
                                        </span>
                                      )}
                                    </div>
                                    <p className='text-[11.5px] text-[#344352] truncate mt-0.5'>
                                      {addr.address}
                                    </p>
                                    <p className='text-[11px] text-[#9ca3af] truncate'>
                                      {[addr.city, addr.state, addr.pincode]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  </div>
                                  {selectingId === addr.address_id && (
                                    <Loader2
                                      size={14}
                                      className='shrink-0 animate-spin text-[#0e55d9]'
                                    />
                                  )}
                                </button>
                                <button
                                  type='button'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditAddress(addr);
                                  }}
                                  className='grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e5e7eb] text-[#344352] hover:border-[#0e55d9]/40 hover:text-[#0e55d9] hover:bg-[#eef4ff] transition-colors'>
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type='button'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteError("");
                                    setPendingDelete(addr);
                                  }}
                                  disabled={deletingId === addr.address_id}
                                  className='grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e5e7eb] text-[#344352] hover:border-[#fecaca] hover:text-[#7b5757] hover:bg-[#fef2f2] transition-colors disabled:opacity-60'>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {formError && (
                <p className='rounded-xl bg-[#fef2f2] border border-[#fee2e2] px-4 py-2.5 text-[12.5px] text-[#dc2626]'>
                  {formError}
                </p>
              )}
            </>
          )}
        </div>

        {pendingDelete && (
          <div className='absolute inset-0 z-[10] flex items-center justify-center bg-[#000000]/40 px-4 rounded-3xl'>
            <div className='w-full max-w-sm rounded-2xl bg-[#ffffff] p-5 shadow-2xl'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#fef2f2] mb-3'>
                <Trash2 size={18} className='text-[#7b5757]' />
              </div>
              <h3 className='text-[16px] font-black text-[#111827]'>
                Remove this address?
              </h3>
              <p className='mt-1.5 text-[13px] text-[#4b5563] leading-relaxed'>
                <span className='font-semibold text-[#1f2937]'>
                  {getAddressDisplayTitle(pendingDelete)}
                </span>
                {" — "}
                {pendingDelete.address}
              </p>
              <p className='mt-2 text-[11.5px] text-[#344352]'>
                Past bookings will still show this address. You can add it again
                anytime.
              </p>
              {deleteError && (
                <p className='mt-3 rounded-lg bg-[#fef2f2] border border-[#fee2e2] px-3 py-2 text-[12px] text-[#dc2626]'>
                  {deleteError}
                </p>
              )}
              <div className='mt-5 flex gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setPendingDelete(null);
                    setDeleteError("");
                  }}
                  disabled={deletingId != null}
                  className='flex-1 h-10 rounded-xl border border-[#e5e7eb] text-[13px] font-semibold text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60'>
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={confirmDeleteAddress}
                  disabled={deletingId != null}
                  className='flex-1 h-10 rounded-xl bg-[#dc2626] text-[13px] font-bold text-[#ffffff] hover:bg-[#b91c1c] disabled:opacity-60 flex items-center justify-center gap-2'>
                  {deletingId != null ? (
                    <Loader2 size={15} className='animate-spin' />
                  ) : (
                    "Remove"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
