"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, RefreshCw, User, Phone, Mail, MapPin, ShoppingBag,
  CheckCircle, XCircle, Calendar, Hash, Plus, X, Save, Loader2,
  Tag, Wrench, Zap, Droplets, Sparkles, Hammer, Brush, Wind,
  Settings, Cpu, Home, Shield, Monitor, Tv, Scissors, Leaf,
  ChevronLeft, Clock, IndianRupee, Layers, Activity, Search,
  Pencil, Trash2, Star,
} from "lucide-react";
import { adminAPI, customerAdminAPI, masterAPI } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api/coreClient";
import dynamic from "next/dynamic";
import type { ResolvedAddress } from "./_AddressMapPicker";
import ServiceCatalogCard, { type ServiceCatalogItem } from "./_ServiceCatalogCard";

// Leaflet requires no-SSR
const AddressMapPicker = dynamic(() => import("./_AddressMapPicker"), { ssr: false });

function apiFileUrl(path?: string | null) {
  if (!path) return null;
  return resolveUploadUrl(path) || null;
}

type Customer = {
  customer_id: number;
  customer_uid?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  mobile_number: string;
  email_verified: boolean;
  mobile_verified: boolean;
  is_active: boolean;
  profile_pitcher?: string;
  profilePitcher?: string;
  created_at?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: number | string;
  } | null;
};

type Address = {
  address_id: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number | string;
  latitude?: string;
  longitude?: string;
  is_active?: boolean;
  is_selected?: boolean;
  area_id?: number | null;
};

type Booking = {
  booking_id: number;
  booking_uid?: string;
  service?: string;
  status?: string;
  created_at?: string;
  scheduled_date?: string;
  total_amount?: number | string;
};

type Area = {
  area_id: number;
  area_name?: string;
  city_name?: string;
  latitude?: string | number;
  longitude?: string | number;
  radius_km?: string | number;
};

type Tab = "personal" | "address" | "bookings" | "offers" | "services" | "activity";

type ActivityLog = {
  log_id: number;
  http_method?: string;
  request_path?: string;
  status_code?: number;
  ip_address?: string;
  user_agent?: string;
  summary?: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

type Offer = {
  id?: number;
  title?: string;
  subtitle?: string;
  coupon_code?: string;
  discount_type?: string;
  discount_value?: number | string;
  minimum_order_amount?: number | string;
  max_discount?: number | string;
  background_color?: string;
  action?: { type?: string; value?: string };
  image?: string;
  expiry_date?: string;
};

type ServiceCategory = {
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  description?: string;
  order_seq?: number;
  service_count?: number;
};

type ServiceItem = ServiceCatalogItem & { area_id?: number | null; rating?: number; image?: string | null };

const ICON_MAP: Record<string, React.ElementType> = {
  Wrench, Zap, Droplets, Sparkles, Hammer, Brush, Wind, Settings,
  Cpu, Home, Shield, Monitor, Tv, Scissors, Leaf, ShoppingBag, Tag,
  Layers, User, Phone, MapPin, Clock,
};

const getIcon = (name?: string | null): React.ElementType =>
  (name ? ICON_MAP[name] : null) ?? Wrench;

const DEFAULT_CAT_COLOR = "#3b82f6";
const DEFAULT_SVC_COLOR = "#64748b";

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : "59, 130, 246";
};

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "personal", label: "Personal Details", icon: User },
  { key: "address", label: "Address", icon: MapPin },
  { key: "bookings", label: "Bookings", icon: ShoppingBag },
  { key: "offers", label: "Offers", icon: Tag },
  { key: "services", label: "Services", icon: Wrench },
  { key: "activity", label: "Activity Log", icon: Activity },
];

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const fmt = (val?: string | number | null) => (val != null && val !== "" ? String(val) : "-");

const StatusBadge = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]" : "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]"}`}>
    {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {active ? "Active" : "Inactive"}
  </span>
);

const VerifiedBadge = ({ verified, label }: { verified: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${verified ? "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]" : "bg-[#f8fafc] text-[#53697e] border border-[#e2e8f0]"}`}>
    {verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label} {verified ? "Verified" : "Unverified"}
  </span>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
    <p className="text-xs text-[#53697e] mb-1">{label}</p>
    <div className="text-sm font-medium text-[#0f172a]">{value}</div>
  </div>
);

const EMPTY_FORM = { street: "", city: "", state: "", country: "", pincode: "", lat: "", lng: "" };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = useMemo(() => {
    const raw = params?.customerId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [categoryServices, setCategoryServices] = useState<ServiceItem[]>([]);
  const [categoryServicesLoading, setCategoryServicesLoading] = useState(false);
  const [categoryServicesError, setCategoryServicesError] = useState("");
  const [categoryServicesAreaId, setCategoryServicesAreaId] = useState<number | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const ACTIVITY_LIMIT = 20;
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  const [matchedArea, setMatchedArea] = useState<Area | null>(null);

  // ── Add address modal ──────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Edit address modal ─────────────────────────────────────────────────────
  const [editAddressRow, setEditAddressRow] = useState<Address | null>(null);
  const [editForm, setEditAddrForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editSaveError, setEditSaveError] = useState("");

  // ── Delete confirmation ────────────────────────────────────────────────────
  const [deleteAddressRow, setDeleteAddressRow] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Activate (set selected) ────────────────────────────────────────────────
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const fetchCustomer = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError("");
      const res = await customerAdminAPI.getUserById({ customerId: Number(customerId) });
      if (res?.status) {
        const payload = res.data;
        setCustomer(Array.isArray(payload) ? payload[0] : payload);
      } else {
        setError(res?.message || "Failed to load customer.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load customer.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = useCallback(async () => {
    if (!customerId) return;
    try {
      setAddressesLoading(true);
      const res = await customerAdminAPI.getUserAddresses({ customerId: Number(customerId) });
      if (res?.status) {
        const addrList: Address[] = res.data || [];
        setAddresses(addrList);

        const selected = addrList.find((a) => a.is_selected);
        const addrLat = selected ? parseFloat(String(selected.latitude ?? "")) : NaN;
        const addrLon = selected ? parseFloat(String(selected.longitude ?? "")) : NaN;

        if (!isNaN(addrLat) && !isNaN(addrLon)) {
          try {
            const areasRes = await masterAPI.getAreas();
            const areaList: Area[] = areasRes?.data || areasRes?.result || [];
            let best: Area | null = null;
            let bestDist = Infinity;
            for (const area of areaList) {
              const aLat = parseFloat(String(area.latitude ?? ""));
              const aLon = parseFloat(String(area.longitude ?? ""));
              const radius = parseFloat(String(area.radius_km ?? "0"));
              if (isNaN(aLat) || isNaN(aLon)) continue;
              const dist = haversineKm(addrLat, addrLon, aLat, aLon);
              if (dist <= radius && dist < bestDist) {
                bestDist = dist;
                best = area;
              }
            }
            setMatchedArea(best);
          } catch { /* area matching is optional */ }
        } else {
          setMatchedArea(null);
        }
      }
    } catch { /* show empty */ } finally {
      setAddressesLoading(false);
    }
  }, [customerId]);

  const fetchBookings = useCallback(async () => {
    if (!customerId) return;
    try {
      setBookingsLoading(true);
      const res = await customerAdminAPI.getUserBookings({ customerId: Number(customerId) });
      if (res?.status) setBookings(res.data || []);
    } catch { /* show empty */ } finally {
      setBookingsLoading(false);
    }
  }, [customerId]);

  const fetchOffers = useCallback(async () => {
    if (!customerId) return;
    try {
      setOffersLoading(true);
      const res = await customerAdminAPI.getUserPromotionsHome({
        customerId: Number(customerId),
      });
      if (res?.status) {
        const list = Array.isArray(res.offers)
          ? res.offers
          : res.offer
            ? [res.offer]
            : res.data
              ? Array.isArray(res.data)
                ? res.data
                : [res.data]
              : [];
        setOffers(list);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  }, [customerId]);

  const fetchServices = useCallback(async () => {
    if (!customerId) return;
    try {
      setServicesLoading(true);
      setServicesError("");
      const res = await customerAdminAPI.getUserServiceCategories({
        customerId: Number(customerId),
      });
      if (res?.status) {
        const raw = res.result ?? res.data;
        const list = Array.isArray(raw) ? raw : [];
        setServices(list);
        if (list.length === 0) {
          setServicesError("No service categories are available for this customer's selected address area.");
        }
      } else {
        setServices([]);
        setServicesError(res?.message || "Failed to load service categories.");
      }
    } catch (err: unknown) {
      setServices([]);
      setServicesError(err instanceof Error ? err.message : "Failed to load service categories.");
    } finally {
      setServicesLoading(false);
    }
  }, [customerId]);

  const fetchCategoryServices = useCallback(async (categoryId: number) => {
    if (!customerId) return;
    try {
      setCategoryServicesLoading(true);
      setCategoryServices([]);
      setCategoryServicesError("");
      setCategoryServicesAreaId(null);
      const res = await customerAdminAPI.getUserServicesList({
        customerId: Number(customerId),
        category_id: categoryId,
      });
      if (res?.status) {
        setCategoryServices(Array.isArray(res.result) ? res.result : []);
        setCategoryServicesAreaId(res.area_id != null ? Number(res.area_id) : null);
        if (Array.isArray(res.result) && res.result.length === 0) {
          setCategoryServicesError(res.message || "No services available for this customer in the current time slot.");
        }
      } else {
        setCategoryServicesError(res?.message || "Failed to load services for this category.");
      }
    } catch (err: unknown) {
      setCategoryServicesError(err instanceof Error ? err.message : "Failed to load services for this category.");
    } finally {
      setCategoryServicesLoading(false);
    }
  }, [customerId]);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setCategoryServicesError("");
    void fetchCategoryServices(cat.category_id);
  };

  const fetchActivityLogs = useCallback(async (page: number, search: string) => {
    if (!customerId) return;
    try {
      setActivityLoading(true);
      const res = await customerAdminAPI.getUserActivityLogs({
        customerId: Number(customerId),
        page,
        limit: ACTIVITY_LIMIT,
        search: search || undefined,
      });
      if (res?.status) {
        setActivityLogs(res.data || []);
        setActivityTotal(res.pagination?.total ?? 0);
      }
    } catch { } finally {
      setActivityLoading(false);
    }
  }, [customerId]);

  // Fetch customer + addresses together on mount so Personal Details / Service Area is correct immediately
  useEffect(() => {
    void fetchCustomer();
    void fetchAddresses();
  }, [customerId]);

  useEffect(() => {
    // Address tab: already loaded on mount, re-fetch only if emptied by a delete
    if (activeTab === "address" && addresses.length === 0 && !addressesLoading) {
      void fetchAddresses();
    }
    if (activeTab === "bookings" && bookings.length === 0 && !bookingsLoading) {
      void fetchBookings();
    }
    if (activeTab === "offers" && offers.length === 0 && !offersLoading) {
      void fetchOffers();
    }
    if (activeTab === "services" && services.length === 0 && !servicesLoading) {
      void fetchServices();
    }
    if (activeTab === "activity" && activityLogs.length === 0 && !activityLoading) {
      void fetchActivityLogs(1, "");
    }
  }, [activeTab, customerId, fetchServices, fetchAddresses, fetchBookings, fetchOffers, fetchActivityLogs]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAddModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleMapResolve = (addr: ResolvedAddress) => {
    setAddForm(f => ({
      ...f,
      street: addr.street || f.street,
      city: addr.city || f.city,
      state: addr.state || f.state,
      country: addr.country || f.country,
      pincode: addr.pincode || f.pincode,
      lat: String(addr.lat),
      lng: String(addr.lng),
    }));
  };

  const handleSaveAddress = async () => {
    setSaveError("");
    if (!addForm.street || !addForm.city || !addForm.state || !addForm.country || !addForm.pincode || !addForm.lat || !addForm.lng) {
      setSaveError("Please fill all fields and pin a location on the map.");
      return;
    }
    try {
      setSaving(true);
      const res = await customerAdminAPI.addUserAddress({
        customerId: Number(customerId),
        address: addForm.street,
        city: addForm.city,
        state: addForm.state,
        country: addForm.country,
        pincode: addForm.pincode,
        latitude: addForm.lat,
        longitude: addForm.lng,
      });
      if (res?.status) {
        setShowAddModal(false);
        setAddForm(EMPTY_FORM);
        void fetchAddresses();
      } else {
        setSaveError(res?.message || "Failed to save address.");
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const openEditAddress = (addr: Address) => {
    setEditAddressRow(addr);
    setEditAddrForm({
      street: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "",
      pincode: String(addr.pincode || ""),
      lat: String(addr.latitude || ""),
      lng: String(addr.longitude || ""),
    });
    setEditSaveError("");
  };

  const handleEditAddress = async () => {
    if (!editAddressRow) return;
    setEditSaveError("");
    if (!editForm.street || !editForm.city || !editForm.state || !editForm.country || !editForm.pincode || !editForm.lat || !editForm.lng) {
      setEditSaveError("Please fill all fields.");
      return;
    }
    try {
      setEditSaving(true);
      const res = await customerAdminAPI.updateUserAddress({
        customerId: Number(customerId),
        addressId: editAddressRow.address_id,
        address: editForm.street,
        city: editForm.city,
        state: editForm.state,
        country: editForm.country,
        pincode: editForm.pincode,
        latitude: editForm.lat,
        longitude: editForm.lng,
      });
      if (res?.status) {
        setEditAddressRow(null);
        void fetchAddresses();
      } else {
        setEditSaveError(res?.message || "Failed to update address.");
      }
    } catch (err: any) {
      setEditSaveError(err?.message || "Failed to update address.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleActivateAddress = async (addr: Address) => {
    try {
      setActivatingId(addr.address_id);
      const res = await customerAdminAPI.activateUserAddress({
        customerId: Number(customerId),
        addressId: addr.address_id,
      });
      if (res?.status) void fetchAddresses();
    } catch { /* silent */ } finally {
      setActivatingId(null);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddressRow) return;
    try {
      setDeleting(true);
      const res = await customerAdminAPI.deleteUserAddress({
        customerId: Number(customerId),
        addressId: deleteAddressRow.address_id,
      });
      if (res?.status) {
        setDeleteAddressRow(null);
        void fetchAddresses();
      }
    } catch { /* silent */ } finally {
      setDeleting(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 rounded-xl bg-[#f1f5f9] animate-pulse" />
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-6">
          <div className="h-24 w-full rounded-xl bg-[#f1f5f9] animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-6 space-y-3">
        <p className="text-sm text-[#b91c1c]">{error || "Customer details unavailable."}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="px-3 py-2 text-sm rounded-lg bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc]">Go Back</button>
          <button type="button" onClick={() => void fetchCustomer()} className="px-3 py-2 text-sm rounded-lg bg-[#dc2626] text-[#ffffff] hover:bg-[#b91c1c] inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name || ""}`.trim();
  const profileImageUrl = apiFileUrl(customer.profile_pitcher ?? customer.profilePitcher);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button type="button" onClick={() => router.push("/admin/user-management/users")} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc]">
        <ArrowLeft className="w-4 h-4" />Back to Customers
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover border border-[#e2e8f0]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#334155] font-semibold text-lg">
              {getInitials(fullName) || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[#0f172a]">{fullName}</h1>
            {customer.address && (
              <p className="text-xs text-[#53697e] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0 text-[#5c6a7f]" />
                <span className="truncate">
                  {[customer.address.address, customer.address.city, customer.address.state, customer.address.pincode]
                    .filter(Boolean).join(", ")}
                </span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-1.5">
              <StatusBadge active={customer.is_active} />
              <VerifiedBadge verified={customer.email_verified} label="Email" />
              <VerifiedBadge verified={customer.mobile_verified} label="Mobile" />
            </div>
          </div>
          <button type="button" onClick={() => { void fetchCustomer(); if (activeTab === "address") void fetchAddresses(); if (activeTab === "bookings") void fetchBookings(); }} className="p-2 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#53697e]" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#e2e8f0] overflow-x-auto scrollbar-none">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === key ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-[#53697e] hover:text-[#334155] hover:border-[#cbd5e1]"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Personal Details ── */}
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Customer ID" value={<span className="inline-flex items-center gap-1"><Hash className="w-3 h-3 text-[#5c6a7f]" />{customer.customer_id}</span>} />
              <Field label="UID" value={<span className="text-xs font-mono break-all">{fmt(customer.customer_uid)}</span>} />
              <Field label="First Name" value={fmt(customer.first_name)} />
              <Field label="Last Name" value={fmt(customer.last_name)} />
              <Field label="Mobile Number" value={<span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#5c6a7f]" />{fmt(customer.mobile_number)}</span>} />
              <Field label="Email" value={<span className="inline-flex items-center gap-1.5 break-all"><Mail className="w-3.5 h-3.5 text-[#5c6a7f]" />{fmt(customer.email)}</span>} />
              <Field label="Account Status" value={<StatusBadge active={customer.is_active} />} />
              <Field label="Verification" value={<div className="flex flex-wrap gap-2"><VerifiedBadge verified={customer.email_verified} label="Email" /><VerifiedBadge verified={customer.mobile_verified} label="Mobile" /></div>} />
              {customer.created_at && (
                <Field label="Registered On" value={<span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#5c6a7f]" />{new Date(customer.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>} />
              )}
              {(() => {
                const selectedAddr = addresses.find(a => a.is_selected);
                return (
                  <Field
                    label="Service Area"
                    value={
                      matchedArea ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#ecfdf5]" />
                          <span className="text-[#047857] font-semibold">{matchedArea.area_name}</span>
                          {matchedArea.city_name && <span className="text-[#53697e] font-normal">, {matchedArea.city_name}</span>}
                        </span>
                      ) : selectedAddr?.area_id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#ecfdf5]" />
                          <span className="text-[#047857] font-semibold">Area #{selectedAddr.area_id}</span>
                        </span>
                      ) : (
                        <span className="text-[#5c6a7f] text-xs">Not within any service area</span>
                      )
                    }
                  />
                );
              })()}
            </div>
          )}

          {/* ── Address ── */}
          {activeTab === "address" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#334155]">
                  {addresses.length > 0 ? `${addresses.length} address${addresses.length > 1 ? "es" : ""} on record` : "No addresses on record"}
                </p>
                <button
                  type="button"
                  onClick={() => { setAddForm(EMPTY_FORM); setSaveError(""); setShowAddModal(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#2563eb] text-[#ffffff] rounded-xl hover:bg-[#1d4ed8] transition-colors"
                >
                  <Plus className="w-4 h-4" />Add New Address
                </button>
              </div>

              {addressesLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                  <MapPin className="w-8 h-8" />
                  <p className="text-sm">No addresses found. Use the button above to add one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.address_id} className={`rounded-xl border p-4 space-y-3 ${addr.is_selected ? "border-[#93c5fd] bg-[#eff6ff]" : "border-[#e2e8f0] bg-[#ffffff]"}`}>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <MapPin className="w-4 h-4 text-[#eff6ff] shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-[#0f172a]">{addr.address || "-"}</p>
                        </div>
                        {addr.is_selected && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#2563eb] text-[#ffffff] whitespace-nowrap shrink-0">
                            <Star className="w-3 h-3" />Selected
                          </span>
                        )}
                      </div>

                      {/* Address details */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#475569] pl-5">
                        <span><span className="text-[#5c6a7f]">City: </span>{addr.city || "-"}</span>
                        <span><span className="text-[#5c6a7f]">State: </span>{addr.state || "-"}</span>
                        <span><span className="text-[#5c6a7f]">Country: </span>{addr.country || "-"}</span>
                        <span><span className="text-[#5c6a7f]">Pincode: </span>{addr.pincode || "-"}</span>
                        {addr.latitude && addr.longitude && (
                          <span className="col-span-2 text-[#5c6a7f]">{addr.latitude}, {addr.longitude}</span>
                        )}
                      </div>

                      {/* Service area badge — shown on every address, not just selected */}
                      <div className="pl-5">
                        {addr.area_id ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] font-medium">
                            <MapPin className="w-3 h-3" />
                            {addr.is_selected && matchedArea
                              ? `${matchedArea.area_name}${matchedArea.city_name ? `, ${matchedArea.city_name}` : ""}`
                              : `Area #${addr.area_id}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#5c6a7f] border border-[#e2e8f0]">
                            <MapPin className="w-3 h-3" />
                            No service area
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                        {!addr.is_selected && (
                          <button
                            type="button"
                            disabled={activatingId === addr.address_id}
                            onClick={() => void handleActivateAddress(addr)}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-[#dbeafe] disabled:opacity-60 transition-colors"
                          >
                            {activatingId === addr.address_id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Star className="w-3 h-3" />}
                            Set as Selected
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditAddress(addr)}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors"
                        >
                          <Pencil className="w-3 h-3" />Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAddressRow(addr)}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] hover:bg-[#fee2e2] transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Offers ── */}
          {activeTab === "offers" && (
            offersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
              </div>
            ) : offers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                <Tag className="w-8 h-8" />
                <p className="text-sm">No active offers available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offers.map((offer, i) => (
                  <div
                    key={offer.id ?? i}
                    className="rounded-xl border border-[#e2e8f0] overflow-hidden"
                    style={{ borderLeftColor: offer.background_color || "#3b82f6", borderLeftWidth: 4 }}
                  >
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{offer.title || "-"}</p>
                          {offer.subtitle && <p className="text-xs text-[#53697e] truncate">{offer.subtitle}</p>}
                        </div>
                        {offer.coupon_code && (
                          <span className="shrink-0 text-xs font-mono font-medium px-2 py-0.5 rounded-lg bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                            {offer.coupon_code}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {offer.discount_value != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                            {offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `₹${offer.discount_value} off`}
                          </span>
                        )}
                        {offer.minimum_order_amount != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569]">
                            Min ₹{offer.minimum_order_amount}
                          </span>
                        )}
                        {offer.max_discount != null && Number(offer.max_discount) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569]">
                            Upto ₹{offer.max_discount}
                          </span>
                        )}
                        {offer.action?.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                            {offer.action.type}
                          </span>
                        )}
                        {offer.expiry_date && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#53697e]">
                            Expires {offer.expiry_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Services ── */}
          {activeTab === "services" && (
            servicesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                <Wrench className="w-8 h-8" />
                <p className="text-sm text-center max-w-md">{servicesError || "No services available."}</p>
              </div>
            ) : selectedCategory ? (
              /* ── Service Detail Panel ── */
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryServices([]);
                      setCategoryServicesError("");
                      setCategoryServicesAreaId(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#475569]"
                  >
                    <ChevronLeft className="w-4 h-4" />All Categories
                  </button>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const color = selectedCategory.category_color || DEFAULT_CAT_COLOR;
                      const CatIcon = getIcon(selectedCategory.category_icon);
                      return (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `rgba(${hexToRgb(color)}, 0.15)` }}>
                          <CatIcon className="w-4 h-4" style={{ color }} />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">{selectedCategory.category_name}</p>
                      {selectedCategory.description && <p className="text-xs text-[#53697e]">{selectedCategory.description}</p>}
                    </div>
                  </div>
                </div>

                {categoryServicesLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
                  </div>
                ) : categoryServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                    <Wrench className="w-7 h-7" />
                    <p className="text-sm text-center max-w-md">
                      {categoryServicesError || "No services found in this category."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryServicesAreaId != null && (
                      <p className="text-xs text-[#53697e]">
                        Showing services available in the customer's selected service area
                      </p>
                    )}
                    {categoryServices.map((svc) => (
                      <ServiceCatalogCard key={svc.service_id} svc={svc} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── Category Grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((cat) => {
                  const color = cat.category_color || DEFAULT_CAT_COLOR;
                  const CatIcon = getIcon(cat.category_icon);
                  return (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 flex items-start gap-3 hover:shadow-md hover:border-[#cbd5e1] transition-all text-left group"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: `rgba(${hexToRgb(color)}, 0.15)` }}
                      >
                        <CatIcon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{cat.category_name || "-"}</p>
                        {cat.description && <p className="text-xs text-[#53697e] line-clamp-2 mt-0.5">{cat.description}</p>}
                        {cat.service_count != null && (
                          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569]">
                            {cat.service_count} service{cat.service_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <ChevronLeft className="w-4 h-4 text-[#5c6a7f] rotate-180 shrink-0 mt-0.5 group-hover:text-[#475569] transition-colors" />
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* ── Bookings ── */}
          {activeTab === "bookings" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#53697e]">{bookings.length > 0 ? `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}` : "No bookings yet"}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/user-management/users/${customerId}/create-booking`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-sm font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Booking
                </button>
              </div>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                <ShoppingBag className="w-8 h-8" />
                <p className="text-sm">No bookings yet. Click &quot;Create Booking&quot; to add one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0]">
                      {["#", "Booking ID", "Service", "Status", "Date", "Amount"].map((h, i) => (
                        <th key={h} className={`py-2.5 px-3 text-xs font-medium text-[#53697e] uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {bookings.map((b, i) => (
                      <tr
                        key={b.booking_id}
                        className="hover:bg-[#eff6ff]/40 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/admin/user-management/users/${customerId}/bookings/${b.booking_id}`)}
                      >
                        <td className="py-3 px-3 text-[#53697e]">{i + 1}</td>
                        <td className="py-3 px-3 font-medium text-[#0f172a]">
                          <span className="group-hover:text-[#2563eb] transition-colors">#{b.booking_id}</span>
                          {b.booking_uid && <span className="block text-xs font-normal text-[#5c6a7f] font-mono">{b.booking_uid}</span>}
                        </td>
                        <td className="py-3 px-3 text-[#334155]">{fmt(b.service)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#334155]">{fmt(b.status)}</span>
                        </td>
                        <td className="py-3 px-3 text-[#53697e]">
                          {b.scheduled_date
                            ? new Date(b.scheduled_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : b.created_at
                            ? new Date(b.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-[#0f172a]">
                          {b.total_amount != null ? `₹${b.total_amount}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            }
            </>
          )}

          {/* ── Activity Log ── */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {/* Search + controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm focus-within:border-[#60a5fa] focus-within:ring-2 focus-within:ring-[#eff6ff] transition-all">
                  <Search className="w-4 h-4 text-[#5c6a7f] shrink-0" />
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={e => setActivitySearch(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { setActivityPage(1); void fetchActivityLogs(1, activitySearch); } }}
                    placeholder="Search by path or summary…"
                    className="flex-1 text-sm bg-transparent outline-none text-[#334155] placeholder:text-[#5c6a7f]"
                  />
                  {activitySearch && (
                    <button type="button" onClick={() => { setActivitySearch(""); setActivityPage(1); void fetchActivityLogs(1, ""); }}>
                      <X className="w-3.5 h-3.5 text-[#5c6a7f] hover:text-[#475569]" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setActivityPage(1); void fetchActivityLogs(1, activitySearch); }}
                  className="px-3 py-2 text-sm rounded-xl bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8] transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => void fetchActivityLogs(activityPage, activitySearch)}
                  className="p-2 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#53697e]"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {activityLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#f1f5f9] animate-pulse" />)}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#5c6a7f] gap-2">
                  <Activity className="w-8 h-8" />
                  <p className="text-sm">No activity logs found.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f8fafc]">
                        <tr className="border-b border-[#e2e8f0]">
                          {["Method", "Path", "Status", "IP", "Time"].map((h) => (
                            <th key={h} className="py-2.5 px-3 text-xs font-medium text-[#53697e] uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {activityLogs.map((log) => {
                          const ok = (log.status_code ?? 0) < 400;
                          return (
                            <tr key={log.log_id} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="py-2.5 px-3">
                                <span className={`inline-block text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                                  log.http_method === "GET" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                                  log.http_method === "POST" ? "bg-[#f0fdf4] text-[#15803d]" :
                                  log.http_method === "PUT" ? "bg-[#fffbeb] text-[#b45309]" :
                                  log.http_method === "DELETE" ? "bg-[#fef2f2] text-[#b91c1c]" :
                                  "bg-[#f1f5f9] text-[#475569]"
                                }`}>
                                  {log.http_method || "-"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 max-w-xs">
                                <p className="text-xs font-mono text-[#334155] truncate" title={log.request_path}>{log.request_path || "-"}</p>
                                {log.summary && log.summary !== log.request_path && (
                                  <p className="text-xs text-[#5c6a7f] truncate mt-0.5" title={log.summary}>{log.summary}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${ok ? "bg-[#f0fdf4] text-[#15803d]" : "bg-[#fef2f2] text-[#dc2626]"}`}>
                                  {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {log.status_code ?? "-"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-[#53697e] font-mono whitespace-nowrap">{log.ip_address || "-"}</td>
                              <td className="py-2.5 px-3 text-xs text-[#53697e] whitespace-nowrap">
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {activityTotal > ACTIVITY_LIMIT && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-[#53697e]">
                        Showing {(activityPage - 1) * ACTIVITY_LIMIT + 1}–{Math.min(activityPage * ACTIVITY_LIMIT, activityTotal)} of {activityTotal}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activityPage <= 1}
                          onClick={() => { const p = activityPage - 1; setActivityPage(p); void fetchActivityLogs(p, activitySearch); }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-[#475569] font-medium">Page {activityPage} / {Math.ceil(activityTotal / ACTIVITY_LIMIT)}</span>
                        <button
                          type="button"
                          disabled={activityPage >= Math.ceil(activityTotal / ACTIVITY_LIMIT)}
                          onClick={() => { const p = activityPage + 1; setActivityPage(p); void fetchActivityLogs(p, activitySearch); }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Address Modal ── */}
      {editAddressRow && (
        <div className="fixed inset-0 z-50 bg-[#000000]/50 flex items-center justify-center p-4" onClick={() => setEditAddressRow(null)}>
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-base font-semibold text-[#0f172a]">Edit Address</h2>
                <p className="text-xs text-[#53697e] mt-0.5">Update the address details below</p>
              </div>
              <button type="button" onClick={() => setEditAddressRow(null)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#5c6a7f] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: "street", label: "Street / Locality", placeholder: "e.g. 123, MG Road", span: 2 },
                { key: "city", label: "City", placeholder: "e.g. Raipur" },
                { key: "state", label: "State", placeholder: "e.g. Chhattisgarh" },
                { key: "country", label: "Country", placeholder: "e.g. India" },
                { key: "pincode", label: "Pincode", placeholder: "e.g. 492001" },
              ].map(({ key, label, placeholder, span }) => (
                <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>
                  <input
                    type="text"
                    value={(editForm as any)[key]}
                    onChange={e => setEditAddrForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff] bg-[#ffffff] transition-all placeholder:text-[#5c6a7f]"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Latitude</label>
                  <input type="text" value={editForm.lat} onChange={e => setEditAddrForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 21.2514" className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff] bg-[#ffffff] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Longitude</label>
                  <input type="text" value={editForm.lng} onChange={e => setEditAddrForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g. 81.6296" className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff] bg-[#ffffff] transition-all" />
                </div>
              </div>
              {editSaveError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#b91c1c]">
                  <XCircle className="w-4 h-4 shrink-0" />{editSaveError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button type="button" onClick={() => setEditAddressRow(null)} className="px-4 py-2 text-sm rounded-xl border border-[#e2e8f0] bg-[#ffffff] hover:bg-[#f8fafc] text-[#334155]">Cancel</button>
              <button type="button" onClick={handleEditAddress} disabled={editSaving} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8] disabled:opacity-60 transition-colors">
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Address Confirmation ── */}
      {deleteAddressRow && (
        <div className="fixed inset-0 z-50 bg-[#000000]/50 flex items-center justify-center p-4" onClick={() => setDeleteAddressRow(null)}>
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Delete Address</h2>
                  <p className="text-xs text-[#53697e] mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-3 text-sm text-[#334155]">
                {deleteAddressRow.address || "-"}
                {(deleteAddressRow.city || deleteAddressRow.state) && (
                  <span className="text-[#5c6a7f]">, {[deleteAddressRow.city, deleteAddressRow.state].filter(Boolean).join(", ")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button type="button" onClick={() => setDeleteAddressRow(null)} className="px-4 py-2 text-sm rounded-xl border border-[#e2e8f0] bg-[#ffffff] hover:bg-[#f8fafc] text-[#334155]">Cancel</button>
              <button type="button" onClick={handleDeleteAddress} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#dc2626] text-[#ffffff] hover:bg-[#b91c1c] disabled:opacity-60 transition-colors">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Address Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-base font-semibold text-[#0f172a]">Add New Address</h2>
                <p className="text-xs text-[#53697e] mt-0.5">Pin a location on the map — fields will auto-fill</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#5c6a7f] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Map */}
              <AddressMapPicker onResolve={handleMapResolve} />

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "street", label: "Street / Locality", placeholder: "e.g. 123, MG Road, Near Park", span: 2 },
                  { key: "city", label: "City", placeholder: "e.g. Raipur" },
                  { key: "state", label: "State", placeholder: "e.g. Chhattisgarh" },
                  { key: "country", label: "Country", placeholder: "e.g. India" },
                  { key: "pincode", label: "Pincode", placeholder: "e.g. 492001" },
                ].map(({ key, label, placeholder, span }) => (
                  <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>
                    <input
                      type="text"
                      value={(addForm as any)[key]}
                      onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-xl outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[#eff6ff] bg-[#ffffff] transition-all placeholder:text-[#5c6a7f]"
                    />
                  </div>
                ))}

                {/* Coordinates (read-only) */}
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Latitude</label>
                  <input type="text" readOnly value={addForm.lat} placeholder="Auto-filled from map" className="w-full px-3 py-2 text-sm border border-[#f1f5f9] rounded-xl bg-[#f8fafc] text-[#53697e] outline-none cursor-default" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Longitude</label>
                  <input type="text" readOnly value={addForm.lng} placeholder="Auto-filled from map" className="w-full px-3 py-2 text-sm border border-[#f1f5f9] rounded-xl bg-[#f8fafc] text-[#53697e] outline-none cursor-default" />
                </div>
              </div>

              {/* Error */}
              {saveError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#b91c1c]">
                  <XCircle className="w-4 h-4 shrink-0" />{saveError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm rounded-xl border border-[#e2e8f0] bg-[#ffffff] hover:bg-[#f8fafc] text-[#334155]">Cancel</button>
              <button type="button" onClick={handleSaveAddress} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
