"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeId } from "@/lib/idEncoder";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { loadGoogleMaps } from "@/lib/gmapsLoader";
import { publicAPI } from "@/lib/publicApi";
import {
  getRegistrationServices,
  getRequiredDocuments,
  saveBasicDetails,
  saveSkills,
  submitRegistration,
  uploadDocument,
  uploadSelfie,
  saveBankDetails,
  getRegistrationStatus,
  resubmitCorrections,
  verifyUpiId,
} from "@/lib/api/technicianClient";
import { useTechnicianAuthStore } from "@/store/technicianAuth.store";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const STEP_META = [
  { label: "Basic Details", icon: User },
  { label: "Skills", icon: Wrench },
  { label: "Documents", icon: FileText },
  { label: "Bank / UPI", icon: Banknote },
  { label: "Review", icon: ClipboardList },
];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const MANDATORY_DOCS = ["Aadhaar Card Front", "Aadhaar Card Back", "PAN Card", "Selfie Photo"];
const OPTIONAL_DOCS = ["Driving License", "Experience Certificate", "GST Certificate"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // Hard safety ceiling.

// ─── Types ─────────────────────────────────────────────────────────────────────

type BasicDetails = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
};

type SkillItem = { id: number; name: string; categoryId?: number; categoryName: string };

type RegistrationServiceRow = {
  service_id?: number;
  id?: number;
  service?: string;
  service_name?: string;
  name?: string;
  category_id?: number;
  categoryId?: number;
  category_name?: string;
  categoryName?: string;
};

type UploadedDoc = {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
  documentTypeId?: number;
  documentNumber?: string;
};

type DocumentType = { document_type_id: number; document_type: string; is_mandatory: boolean };
type UploadPolicy = {
  images: { maxUploadMb: number; targetMb: number; acceptedFormats: string[] };
  documents: { maxUploadMb: number; targetMb: number; acceptedFormats: string[] };
};

const DEFAULT_UPLOAD_POLICY: UploadPolicy = {
  images: { maxUploadMb: 10, targetMb: 1, acceptedFormats: ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "bmp", "tiff"] },
  documents: { maxUploadMb: 10, targetMb: 1, acceptedFormats: ["pdf", "jpg", "jpeg", "png", "webp"] },
};

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function uploadAccept(policy: UploadPolicy) {
  const imageAccept = policy.images.acceptedFormats.map((f) => `.${f}`).join(",");
  const documentAccept = policy.documents.acceptedFormats.map((f) => `.${f}`).join(",");
  return [imageAccept, documentAccept].filter(Boolean).join(",");
}

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

type BankDetails = {
  method: "BANK" | "UPI";
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  upiId: string;
};

// ─── Step 1: Basic Details ─────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
  loading,
  mobileNumber,
  onChangeMobile,
}: {
  data: BasicDetails;
  onChange: (d: Partial<BasicDetails>) => void;
  onNext: () => void;
  loading: boolean;
  mobileNumber?: string;
  onChangeMobile?: () => void;
}) {
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<BasicDetails>>({});
  const [locating, setLocating] = useState(false);
  const [mapStatus, setMapStatus] = useState("Use current location, search a city, or tap the map.");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialLocationRef = useRef({ latitude: data.latitude, longitude: data.longitude });

  // City search state (Nominatim — no API key needed)
  type NominatimResult = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: { city?: string; town?: string; village?: string; county?: string; state?: string; postcode?: string };
  };
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<NominatimResult[]>([]);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const citySearchRef = useRef<HTMLDivElement>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setPickedLocation = useCallback((lat: number, lng: number, center = true) => {
    const latitude = lat.toFixed(6);
    const longitude = lng.toFixed(6);
    onChangeRef.current({ latitude, longitude });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      return next;
    });
    setMapStatus(`Selected: ${latitude}, ${longitude}`);

    const position = { lat, lng };
    if (markerRef.current) markerRef.current.setPosition(position);
    if (mapRef.current && center) {
      mapRef.current.panTo(position);
      mapRef.current.setZoom(16);
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCitySearch = (value: string) => {
    setCityQuery(value);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (!value.trim()) { setCitySuggestions([]); setShowSuggestions(false); return; }

    cityDebounceRef.current = setTimeout(async () => {
      setCitySearchLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&countrycodes=in&format=json&addressdetails=1&limit=5&featuretype=city`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data: NominatimResult[] = await res.json();
        setCitySuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setCitySuggestions([]);
        setShowSuggestions(false);
      } finally {
        setCitySearchLoading(false);
      }
    }, 300);
  };

  const handleSelectCity = (result: NominatimResult) => {
    const city = result.address.city ?? result.address.town ?? result.address.village ?? result.address.county ?? "";
    const label = city || result.display_name.split(",")[0];
    setCityQuery(label);
    setShowSuggestions(false);
    setCitySuggestions([]);
    setPickedLocation(Number(result.lat), Number(result.lon));
    const update: Partial<{ city: string; state: string; pincode: string }> = {};
    if (city) update.city = city;
    if (result.address.state) update.state = result.address.state;
    if (result.address.postcode && result.address.postcode.length === 6) update.pincode = result.address.postcode;
    if (Object.keys(update).length) onChange(update);
  };

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || mapRef.current) return;

        const lat = Number(initialLocationRef.current.latitude);
        const lng = Number(initialLocationRef.current.longitude);
        const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
        const center = hasLocation ? { lat, lng } : { lat: 21.2514, lng: 81.6296 };

        const map = new google.maps.Map(container, {
          center,
          zoom: hasLocation ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new google.maps.Marker({
          position: center,
          map,
          draggable: true,
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) setPickedLocation(pos.lat(), pos.lng(), false);
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setPickedLocation(e.latLng.lat(), e.latLng.lng());
        });

        mapRef.current = map;
        markerRef.current = marker;
        if (hasLocation) {
          setMapStatus(`Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      })
      .catch(() => {
        setMapStatus("Map could not load. Use current location to capture coordinates.");
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [setPickedLocation]);

  const fetchPincode = useCallback(async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      if (json?.[0]?.Status === "Success") {
        const po = json[0].PostOffice?.[0];
        if (po) {
          onChange({ city: po.District || po.Block || "", state: po.State || "" });
        }
      }
    } catch {
      // silently ignore
    } finally {
      setPincodeLoading(false);
    }
  }, [onChange]);

  const handlePinChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    onChange({ pincode: digits });
    if (digits.length === 6) fetchPincode(digits);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapStatus("Location permission is not available in this browser.");
      return;
    }
    setLocating(true);
    setMapStatus("Fetching your current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPickedLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setMapStatus("Unable to fetch current location. Please allow permission or pick on the map.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const validate = (): boolean => {
    const e: Partial<BasicDetails> = {};
    if (!data.fullName.trim()) e.fullName = "Full name is required";
    if (!data.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = "Enter a valid email address";
    if (!data.address.trim()) e.address = "Address is required";
    if (!data.city.trim()) e.city = "City is required";
    if (!data.state.trim()) e.state = "State is required";
    if (data.pincode.length !== 6) e.pincode = "Enter valid 6-digit pincode";
    if (!data.gender) e.gender = "Select gender";
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      e.latitude = "Choose location on map";
      e.longitude = "Choose location on map";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const field = (
    label: string,
    key: keyof BasicDetails,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#374151]">{label}</label>
      <input
        value={data[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        className={`h-11 w-full rounded-xl border px-3.5 text-sm text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 ${errors[key] ? "border-red-400 bg-red-50" : "border-[#d1d5db] bg-white"}`}
        {...props}
      />
      {errors[key] && <p className="mt-0.5 text-[11px] text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {field("Full Name *", "fullName", { placeholder: "Enter your full name" })}
      {field("Email Address *", "email", { type: "email", placeholder: "your@email.com" })}
      {mobileNumber && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[12px] font-semibold text-[#374151]">Mobile Number</label>
            {onChangeMobile && (
              <button
                type="button"
                onClick={onChangeMobile}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a] hover:underline"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Change
              </button>
            )}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <div className="flex items-center gap-1.5 pr-3 border-r border-[#e5e7eb]">
                <span className="text-sm">🇮🇳</span>
                <span className="text-[13px] font-medium text-[#6b7280]">+91</span>
              </div>
            </div>
            <input
              type="tel"
              readOnly
              value={mobileNumber}
              className="h-11 w-full rounded-xl border border-[#d1d5db] bg-[#f3f4f6] pl-[88px] pr-10 text-sm font-medium text-[#6b7280] outline-none cursor-not-allowed"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <p className="mt-0.5 text-[11px] text-[#6b7280]">Verified via OTP · Re-verify to change</p>
        </div>
      )}
      {field("Date of Birth", "dateOfBirth", { type: "date" })}

      <div className="lg:col-span-2">
        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Gender *</label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ gender: g })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                data.gender === g
                  ? "bg-[#16a34a] text-white"
                  : "border border-[#d1d5db] bg-white text-[#374151] hover:border-[#16a34a]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        {errors.gender && <p className="mt-0.5 text-[11px] text-red-500">{errors.gender}</p>}
      </div>

      <div className="lg:col-span-2">
        {field("Address *", "address", { placeholder: "House/Flat no., Street, Area" })}
      </div>

      <div className="grid grid-cols-3 gap-3 lg:col-span-2">
        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Pincode *</label>
          <div className="relative">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={data.pincode}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="6 digits"
              className={`h-11 w-full rounded-xl border px-3.5 pr-8 text-sm text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 ${errors.pincode ? "border-red-400 bg-red-50" : "border-[#d1d5db] bg-white"}`}
            />
            {pincodeLoading && (
              <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-[#16a34a]" />
            )}
          </div>
          {errors.pincode && <p className="mt-0.5 text-[11px] text-red-500">{errors.pincode}</p>}
        </div>
        <div className="col-span-1">
          {field("City *", "city", { placeholder: "City" })}
        </div>
        <div className="col-span-1">
          {field("State *", "state", { placeholder: "State" })}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-[12px] font-semibold text-[#374151]">Location *</label>
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 text-[12px] font-semibold text-[#15803d] transition-all hover:border-[#16a34a] disabled:opacity-50"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            Current Location
          </button>
        </div>

        {/* City search */}
        <div ref={citySearchRef} className="relative mb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search city or area to pan map…"
              className="h-10 w-full rounded-xl border border-[#d1d5db] bg-white pl-9 pr-9 text-[13px] text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
            />
            {citySearchLoading && (
              <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#16a34a]" />
            )}
            {cityQuery && !citySearchLoading && (
              <button
                type="button"
                onClick={() => { setCityQuery(""); setCitySuggestions([]); setShowSuggestions(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {showSuggestions && citySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
              {citySuggestions.map((s) => {
                const cityName = s.address.city ?? s.address.town ?? s.address.village ?? s.address.county ?? s.display_name.split(",")[0];
                const subtitle = [s.address.state, "India"].filter(Boolean).join(", ");
                return (
                  <button
                    key={s.place_id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectCity(s); }}
                    className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f0fdf4]"
                  >
                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#16a34a]" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#111827]">{cityName}</p>
                      <p className="truncate text-[11px] text-[#6b7280]">{subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`overflow-hidden rounded-lg border ${errors.latitude ? "border-red-300 bg-red-50" : "border-[#d1d5db] bg-white"}`}>
          <div ref={mapContainerRef} className="h-[260px] w-full" />
        </div>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#6b7280]">
          <MapPin size={13} className="mt-0.5 shrink-0 text-[#16a34a]" />
          <span>{errors.latitude || mapStatus}</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50 lg:col-span-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <>Save & Continue <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
}

// ─── Step 2: Skills ─────────────────────────────────────────────────────────────

function Step2({
  selectedIds,
  skillItems,
  onToggle,
  onNext,
  onBack,
  loading,
  skillsLoading,
}: {
  selectedIds: number[];
  skillItems: SkillItem[];
  onToggle: (id: number) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  skillsLoading: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const initializedRef = useRef(false);

  const categories = Array.from(
    new Map(skillItems.map((s) => [String(s.categoryId ?? s.categoryName), s.categoryName])).entries()
  ).map(([value, label]) => ({ value, label }));

  // Auto-select first category once skills load
  useEffect(() => {
    if (!initializedRef.current && skillItems.length > 0) {
      initializedRef.current = true;
      setActiveCategory(String(skillItems[0].categoryId ?? skillItems[0].categoryName));
    }
  }, [skillItems.length]);

  const servicesInCategory = activeCategory
    ? skillItems.filter(
        (s) =>
          String(s.categoryId ?? s.categoryName) === activeCategory &&
          s.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedInCategory = activeCategory
    ? skillItems
        .filter((s) => String(s.categoryId ?? s.categoryName) === activeCategory && selectedIds.includes(s.id))
        .length
    : 0;

  const handleNext = () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-[#6b7280]">
        Select a category below, then pick the services you can offer. Minimum 1 required.
      </p>

      {/* Category chips */}
      {skillsLoading ? (
        <div className="flex items-center gap-2 py-4 text-[13px] font-medium text-[#6b7280]">
          <Loader2 size={16} className="animate-spin text-[#16a34a]" /> Loading categories…
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-[#374151]">Service Categories</p>
          {skillItems.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af]">No categories available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = skillItems.filter(
                  (s) => String(s.categoryId ?? s.categoryName) === cat.value && selectedIds.includes(s.id)
                ).length;
                const isActive = activeCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.value);
                      setSearch("");
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all ${
                      isActive
                        ? "bg-[#16a34a] text-white shadow-sm ring-2 ring-[#16a34a]/20"
                        : "border border-[#d1d5db] bg-white text-[#374151] hover:border-[#16a34a] hover:text-[#16a34a]"
                    }`}
                  >
                    {cat.label}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-[#dcfce7] text-[#15803d]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Services for selected category */}
      {activeCategory && !skillsLoading && (
        <div className="space-y-3">
          {/* Search within category */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search services in this category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#d1d5db] bg-white pl-9 pr-3.5 text-sm text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
            />
          </div>

          {/* Service chips */}
          <div className="min-h-[120px] rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
            {servicesInCategory.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[#9ca3af]">
                {search ? "No services match your search." : "No services in this category."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {servicesInCategory.map((skill) => {
                  const active = selectedIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        onToggle(skill.id);
                        setError("");
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                        active
                          ? "bg-[#16a34a] text-white shadow-sm"
                          : "border border-[#d1d5db] bg-white text-[#374151] hover:border-[#16a34a] hover:text-[#16a34a]"
                      }`}
                    >
                      {active && <Check size={11} />}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedInCategory > 0 && (
            <p className="text-[12px] font-medium text-[#16a34a]">
              {selectedInCategory} service{selectedInCategory > 1 ? "s" : ""} selected from this category
            </p>
          )}
        </div>
      )}

      {/* Total selected across all categories */}
      {selectedIds.length > 0 && (
        <p className="text-[13px] font-semibold text-[#16a34a]">
          Total: {selectedIds.length} skill{selectedIds.length > 1 ? "s" : ""} selected
        </p>
      )}
      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-[#d1d5db] bg-white text-[#374151] transition-all hover:border-[#16a34a] hover:text-[#16a34a]"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleNext}
          disabled={loading || skillsLoading || skillItems.length === 0}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Save & Continue <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Documents ─────────────────────────────────────────────────────────

function DocUploadCard({
  label,
  isMandatory,
  uploaded,
  onUpload,
  onRemove,
  uploading,
  uploadPolicy,
}: {
  label: string;
  isMandatory: boolean;
  uploaded?: UploadedDoc;
  onUpload: (file: File, documentNumber?: string) => void;
  onRemove: () => void;
  uploading: boolean;
  uploadPolicy: UploadPolicy;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentNumber, setDocumentNumber] = useState(uploaded?.documentNumber ?? "");
  const [localError, setLocalError] = useState("");
  const needsDocumentNumber = label !== "Selfie Photo";

  const handleFile = async (file: File) => {
    setLocalError("");
    if (needsDocumentNumber && !documentNumber.trim()) {
      setLocalError("Document number is required before upload.");
      return;
    }
    const isImageFile = file.type.startsWith("image/");
    const category = isImageFile ? uploadPolicy.images : uploadPolicy.documents;
    const ext = fileExtension(file);
    if (!category.acceptedFormats.includes(ext)) {
      setLocalError(`.${ext || "unknown"} files are not allowed.`);
      return;
    }
    if (file.size > Math.min(category.maxUploadMb * 1024 * 1024, MAX_FILE_SIZE)) {
      setLocalError(`File size must be ${category.maxUploadMb} MB or smaller.`);
      return;
    }
    onUpload(file, needsDocumentNumber ? documentNumber.trim() : undefined);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const isImage = uploaded?.file.type.startsWith("image/");

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[#1f2937]">{label}</span>
          {isMandatory && (
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
              Required
            </span>
          )}
          {!isMandatory && (
            <span className="rounded-full bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
              Optional
            </span>
          )}
        </div>
        {uploaded?.status === "done" && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
            <CheckCircle2 size={13} /> Uploaded
            {uploaded.documentNumber ? ` (${uploaded.documentNumber})` : ""}
          </span>
        )}
      </div>

      {needsDocumentNumber && (
        <div className="mb-3">
          <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Document Number *</label>
          <input
            value={documentNumber}
            onChange={(e) => {
              setDocumentNumber(e.target.value.toUpperCase());
              setLocalError("");
            }}
            placeholder="Enter document number"
            className={`h-10 w-full rounded-xl border px-3.5 text-sm text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 ${localError ? "border-red-400 bg-red-50" : "border-[#d1d5db] bg-white"}`}
          />
        </div>
      )}

      {!uploaded ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] py-6 transition-all hover:border-[#16a34a] hover:bg-[#f0fdf4]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0fdf4] ring-1 ring-[#bbf7d0]">
            <Upload size={18} className="text-[#16a34a]" />
          </div>
          <div className="text-center">
            <p className="text-[12px] font-semibold text-[#374151]">
              Drop file or <span className="text-[#16a34a]">browse</span>
            </p>
            <p className="text-[11px] text-[#9ca3af]">
              Max {Math.max(uploadPolicy.images.maxUploadMb, uploadPolicy.documents.maxUploadMb)} MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={uploadAccept(uploadPolicy)}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
        </div>
      ) : uploaded.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-3">
            {isImage && uploaded.preview ? (
              <img src={uploaded.preview} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-red-200 opacity-60" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white ring-1 ring-red-200">
                <FileText size={20} className="text-red-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[#111827]">{uploaded.file.name}</p>
              <p className="mt-0.5 text-[11px] font-medium text-red-600">
                {uploaded.errorMsg || "Upload failed — please try again"}
              </p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-200 transition-all hover:bg-red-200"
            >
              Retry
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { onRemove(); void handleFile(f); } }}
          />
        </div>
      ) : (
        <div className={`flex items-center gap-3 rounded-xl border p-3 ${uploaded.status === "done" ? "border-[#d1fae5] bg-[#f0fdf4]" : "border-[#e5e7eb] bg-[#f9fafb]"}`}>
          {isImage && uploaded.preview ? (
            <img src={uploaded.preview} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-[#bbf7d0]" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white ring-1 ring-[#d1d5db]">
              <FileText size={20} className="text-[#6b7280]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#111827]">{uploaded.file.name}</p>
            <p className="text-[11px] text-[#6b7280]">
              {formatFileSize(uploaded.file.size)}
            </p>
            {uploading && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-[#16a34a]">
                <Loader2 size={11} className="animate-spin" /> Uploading…
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            disabled={uploading}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#9ca3af] ring-1 ring-[#e5e7eb] transition-all hover:text-red-500 disabled:opacity-40"
          >
            <X size={13} />
          </button>
        </div>
      )}
      {localError && <p className="mt-2 text-[11px] text-red-500">{localError}</p>}
    </div>
  );
}

function Step3({
  docs,
  onUpload,
  onRemove,
  uploadingKeys,
  docTypes,
  docTypesLoading,
  docTypesError,
  onRetryDocTypes,
  uploadPolicy,
  onNext,
  onBack,
  loading,
}: {
  docs: Record<string, UploadedDoc>;
  onUpload: (key: string, file: File, documentNumber?: string) => void;
  onRemove: (key: string) => void;
  uploadingKeys: string[];
  docTypes: DocumentType[];
  docTypesLoading: boolean;
  docTypesError: string;
  onRetryDocTypes: () => void;
  uploadPolicy: UploadPolicy;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [error, setError] = useState("");

  const configuredMandatoryDocs = docTypes.filter((d) => d.is_mandatory).map((d) => d.document_type);
  const configuredOptionalDocs = docTypes.filter((d) => !d.is_mandatory).map((d) => d.document_type);
  const mandatoryKeys = [
    ...(configuredMandatoryDocs.length ? configuredMandatoryDocs : MANDATORY_DOCS.filter((d) => d !== "Selfie Photo")),
    "Selfie Photo",
  ];
  const optionalKeys = configuredOptionalDocs.length ? configuredOptionalDocs : OPTIONAL_DOCS;
  const mandatoryDone = mandatoryKeys.every((k) => docs[k]?.status === "done");
  const stillUploading = mandatoryKeys.some((k) => docs[k]?.status === "uploading");

  const handleNext = () => {
    if (stillUploading) {
      setError("Please wait — documents are still uploading.");
      return;
    }
    const failed = mandatoryKeys.filter((k) => docs[k]?.status === "error");
    if (failed.length) {
      setError(`Upload failed for: ${failed.join(", ")}. Please retry those documents.`);
      return;
    }
    const missing = mandatoryKeys.filter((k) => !docs[k]);
    if (missing.length) {
      setError(`Please upload: ${missing.join(", ")}.`);
      return;
    }
    const missingNumbers = mandatoryKeys.filter((k) => k !== "Selfie Photo" && !docs[k]?.documentNumber?.trim());
    if (missingNumbers.length) {
      setError(`Please enter document number for: ${missingNumbers.join(", ")}.`);
      return;
    }
    if (!mandatoryDone) {
      setError("Please upload all mandatory documents.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#6b7280]">
        Upload clear photos or scans. Images compress to {uploadPolicy.images.targetMb} MB and documents compress to {uploadPolicy.documents.targetMb} MB.
      </p>

      {docTypesLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-[#d1fae5] bg-[#f0fdf4] px-3.5 py-2.5 text-[12px] text-[#16a34a]">
          <Loader2 size={13} className="animate-spin" /> Loading document types…
        </div>
      )}
      {docTypesError && !docTypesLoading && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-[12px] text-red-600">{docTypesError}</p>
          <button
            type="button"
            onClick={onRetryDocTypes}
            className="ml-3 shrink-0 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Mandatory</p>
        {mandatoryKeys.map((label) => (
          <DocUploadCard
            key={label}
            label={label}
            isMandatory
            uploaded={docs[label]}
            onUpload={(f, documentNumber) => onUpload(label, f, documentNumber)}
            onRemove={() => onRemove(label)}
            uploading={uploadingKeys.includes(label)}
            uploadPolicy={uploadPolicy}
          />
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Optional</p>
        {optionalKeys.map((label) => (
          <DocUploadCard
            key={label}
            label={label}
            isMandatory={false}
            uploaded={docs[label]}
            onUpload={(f, documentNumber) => onUpload(label, f, documentNumber)}
            onRemove={() => onRemove(label)}
            uploading={uploadingKeys.includes(label)}
            uploadPolicy={uploadPolicy}
          />
        ))}
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-[#d1d5db] bg-white text-[#374151] transition-all hover:border-[#16a34a] hover:text-[#16a34a]"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleNext}
          disabled={loading || uploadingKeys.length > 0}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Save & Continue <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Bank / UPI ────────────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  onNext,
  onBack,
  loading,
}: {
  data: BankDetails;
  onChange: (d: Partial<BankDetails>) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetails, string>>>({});
  const [ifscVerifying, setIfscVerifying] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(false);
  const [ifscError, setIfscError] = useState("");
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiHolderName, setUpiHolderName] = useState<string | null>(null);
  const [upiError, setUpiError] = useState("");

  // Auto-verify IFSC when code reaches 11 chars and matches pattern
  useEffect(() => {
    setIfscVerified(false);
    setIfscError("");
    const code = data.ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) return;
    let cancelled = false;
    setIfscVerifying(true);
    fetch(`https://ifsc.razorpay.com/${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.BANK) {
          onChange({ bankName: d.BANK ?? "", branchName: d.BRANCH ?? "" });
          setIfscVerified(true);
        } else {
          setIfscError("Invalid IFSC code. Please check and try again.");
        }
      })
      .catch(() => {
        if (!cancelled) setIfscError("Could not verify IFSC. Please check the code.");
      })
      .finally(() => {
        if (!cancelled) setIfscVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data.ifscCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear UPI verification when UPI ID changes
  useEffect(() => {
    setUpiVerified(false);
    setUpiHolderName(null);
    setUpiError("");
  }, [data.upiId]);

  const handleVerifyUpi = async () => {
    const upiId = data.upiId.trim();
    const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiId) {
      setUpiError("UPI ID is required");
      return;
    }
    if (!upiRegex.test(upiId)) {
      setUpiError("Invalid format. Use: yourname@bankname (e.g. john@okaxis)");
      return;
    }
    setUpiVerifying(true);
    setUpiError("");
    setUpiVerified(false);
    setUpiHolderName(null);
    try {
      const res = await verifyUpiId(upiId);
      if (res.status === false) {
        setUpiError(res.message ?? "Verification failed. Please try again.");
        return;
      }
      if (!res.valid) {
        setUpiError("UPI ID not found. Please check and try again.");
        return;
      }
      setUpiVerified(true);
      setUpiHolderName(res.customerName ?? null);
    } catch {
      setUpiError("Verification failed. Please check your connection.");
    } finally {
      setUpiVerifying(false);
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof BankDetails, string>> = {};
    if (data.method === "BANK") {
      if (!data.accountHolderName.trim()) e.accountHolderName = "Required";
      if (!data.accountNumber.trim()) e.accountNumber = "Required";
      if (data.accountNumber !== data.confirmAccountNumber) e.confirmAccountNumber = "Account numbers don't match";
      if (!data.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode.trim().toUpperCase())) {
        e.ifscCode = "Enter a valid IFSC code (e.g. HDFC0001234)";
      }
    } else {
      if (!data.upiId.trim() || !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(data.upiId.trim())) {
        e.upiId = "Enter a valid UPI ID (e.g. name@okaxis)";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inputClass = (key: keyof BankDetails) =>
    `h-11 w-full rounded-xl border px-3.5 text-sm text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 ${errors[key] ? "border-red-400 bg-red-50" : "border-[#d1d5db] bg-white"}`;

  const label = (text: string) => (
    <label className="mb-1 block text-[12px] font-semibold text-[#374151]">{text}</label>
  );

  return (
    <div className="space-y-4">
      {/* Method toggle */}
      <div className="flex rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-1">
        {(["BANK", "UPI"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ method: m })}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-all ${
              data.method === m
                ? "bg-white text-[#16a34a] shadow-sm ring-1 ring-[#e5e7eb]"
                : "text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            {m === "BANK" ? <Banknote size={15} /> : <BadgeCheck size={15} />}
            {m === "BANK" ? "Bank Account" : "UPI"}
          </button>
        ))}
      </div>

      {data.method === "BANK" ? (
        <div className="space-y-3">
          <div>
            {label("Account Holder Name *")}
            <input value={data.accountHolderName} onChange={(e) => onChange({ accountHolderName: e.target.value })} placeholder="As on bank passbook" className={inputClass("accountHolderName")} />
            {errors.accountHolderName && <p className="mt-0.5 text-[11px] text-red-500">{errors.accountHolderName}</p>}
          </div>
          <div>
            {label("Account Number *")}
            <input type="password" value={data.accountNumber} onChange={(e) => onChange({ accountNumber: e.target.value })} placeholder="Enter account number" className={inputClass("accountNumber")} />
            {errors.accountNumber && <p className="mt-0.5 text-[11px] text-red-500">{errors.accountNumber}</p>}
          </div>
          <div>
            {label("Confirm Account Number *")}
            <input value={data.confirmAccountNumber} onChange={(e) => onChange({ confirmAccountNumber: e.target.value })} placeholder="Re-enter account number" className={inputClass("confirmAccountNumber")} />
            {errors.confirmAccountNumber && <p className="mt-0.5 text-[11px] text-red-500">{errors.confirmAccountNumber}</p>}
          </div>
          <div>
            {label("IFSC Code *")}
            <div className="relative">
              <input
                value={data.ifscCode}
                onChange={(e) => onChange({ ifscCode: e.target.value.toUpperCase() })}
                placeholder="HDFC0001234"
                maxLength={11}
                className={`${inputClass("ifscCode")} pr-28`}
              />
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                {ifscVerifying && <Loader2 size={14} className="animate-spin text-[#16a34a]" />}
                {ifscVerified && !ifscVerifying && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
                    <Check size={10} strokeWidth={3} /> Verified
                  </span>
                )}
              </div>
            </div>
            {errors.ifscCode && <p className="mt-0.5 text-[11px] text-red-500">{errors.ifscCode}</p>}
            {ifscError && !errors.ifscCode && <p className="mt-0.5 text-[11px] text-red-500">{ifscError}</p>}
            {ifscVerified && (data.bankName || data.branchName) && (
              <p className="mt-0.5 text-[11px] font-medium text-green-700">
                {data.bankName}{data.branchName ? ` · ${data.branchName}` : ""}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              {label("Bank Name")}
              <input value={data.bankName} onChange={(e) => onChange({ bankName: e.target.value })} placeholder="Auto-filled on IFSC verify" className={inputClass("bankName")} />
            </div>
            <div>
              {label("Branch Name")}
              <input value={data.branchName} onChange={(e) => onChange({ branchName: e.target.value })} placeholder="Auto-filled on IFSC verify" className={inputClass("branchName")} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            {label("UPI ID *")}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={data.upiId}
                  onChange={(e) => onChange({ upiId: e.target.value })}
                  placeholder="yourname@okaxis"
                  className={`${inputClass("upiId")} ${upiVerified ? "border-green-400 bg-green-50/30" : ""} pr-20`}
                />
                {upiVerified && (
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
                      <Check size={10} strokeWidth={3} /> Valid
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleVerifyUpi}
                disabled={upiVerifying}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#16a34a] bg-white px-4 text-[12px] font-semibold text-[#16a34a] transition-all hover:bg-[#f0fdf4] active:scale-[0.98] disabled:opacity-60"
              >
                {upiVerifying ? <Loader2 size={13} className="animate-spin" /> : null}
                {upiVerifying ? "Verifying…" : "Verify"}
              </button>
            </div>
            {errors.upiId && <p className="mt-0.5 text-[11px] text-red-500">{errors.upiId}</p>}
            {upiError && !errors.upiId && <p className="mt-0.5 text-[11px] text-red-500">{upiError}</p>}
            {upiVerified && (
              <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5">
                <Check size={12} className="shrink-0 text-green-600" strokeWidth={3} />
                <p className="text-[11px] font-medium text-green-700">
                  UPI Verified{upiHolderName ? ` — Account holder: ${upiHolderName}` : ""}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2563eb]" />
            <p className="text-[12px] text-[#1e40af]">
              Your UPI ID is securely encrypted and used only for earnings payout.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-[#fef3c7] bg-[#fffbeb] p-3">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#d97706]" />
        <p className="text-[12px] text-[#92400e]">
          Bank details are stored securely and used exclusively for earnings settlement.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-[#d1d5db] bg-white text-[#374151] transition-all hover:border-[#16a34a] hover:text-[#16a34a]"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => { if (validate()) onNext(); }}
          disabled={loading}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Save & Continue <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Review ────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="text-[12px] font-medium text-[#6b7280]">{label}</span>
      <span className="text-right text-[13px] font-semibold text-[#111827]">{value || "—"}</span>
    </div>
  );
}

type DeclarationChecks = {
  confirm: boolean;
  terms: boolean;
  background: boolean;
};

function DeclarationCheckItem({
  checkKey,
  checks,
  label,
  onToggle,
}: {
  checkKey: keyof DeclarationChecks;
  checks: DeclarationChecks;
  label: string;
  onToggle: (checkKey: keyof DeclarationChecks) => void;
}) {
  const checked = checks[checkKey];
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <div
        onClick={() => onToggle(checkKey)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
          checked ? "border-[#16a34a] bg-[#16a34a]" : "border-[#d1d5db]"
        }`}
      >
        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-[13px] text-[#374151]">{label}</span>
    </label>
  );
}

function Step5({
  basic,
  skills,
  skillItems,
  docs,
  bank,
  onBack,
  onSubmit,
  loading,
}: {
  basic: BasicDetails;
  skills: number[];
  skillItems: SkillItem[];
  docs: Record<string, UploadedDoc>;
  bank: BankDetails;
  onBack: () => void;
  onSubmit: (agreement: { accepted: boolean; version: string }) => void;
  loading: boolean;
}) {
  const [checks, setChecks] = useState<DeclarationChecks>({ confirm: false, terms: false, background: false });
  const [error, setError] = useState("");

  const allChecked = checks.confirm && checks.terms && checks.background;
  const documentReviewKeys = Array.from(new Set([...MANDATORY_DOCS, ...OPTIONAL_DOCS, ...Object.keys(docs)]));

  const toggleCheck = (checkKey: keyof DeclarationChecks) => {
    setChecks((p) => ({ ...p, [checkKey]: !p[checkKey] }));
  };

  const handleSubmit = () => {
    if (!allChecked) {
      setError("Please accept all declarations to proceed.");
      return;
    }
    setError("");
    onSubmit({ accepted: checks.terms, version: "2026-06" });
  };

  return (
    <div className="space-y-4">
      {/* Personal Info */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white px-4">
        <p className="border-b border-[#f3f4f6] py-3 text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Personal Information</p>
        <ReviewRow label="Full Name" value={basic.fullName} />
        <ReviewRow label="Email" value={basic.email || "Not provided"} />
        <ReviewRow label="Date of Birth" value={basic.dateOfBirth || "Not provided"} />
        <ReviewRow label="Gender" value={basic.gender} />
        <ReviewRow label="Address" value={`${basic.address}, ${basic.city}, ${basic.state} - ${basic.pincode}`} />
      </div>

      {/* Skills */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white px-4">
        <p className="border-b border-[#f3f4f6] py-3 text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Selected Skills</p>
        <div className="py-3">
          <div className="flex flex-wrap gap-1.5">
            {skillItems
              .filter((s) => skills.includes(s.id))
              .map((s) => (
                <span key={s.id} className="rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold text-[#15803d]">
                  {s.name}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white px-4">
        <p className="border-b border-[#f3f4f6] py-3 text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Documents</p>
        {documentReviewKeys.map((key) => (
          <div key={key} className="flex items-center justify-between border-b border-[#f9fafb] py-2.5 last:border-0">
            <span className="text-[12px] font-medium text-[#6b7280]">{key}</span>
            {docs[key]?.status === "done" ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
                <CheckCircle2 size={13} /> Uploaded
                {docs[key]?.documentNumber ? ` (${docs[key].documentNumber})` : ""}
              </span>
            ) : (
              <span className="text-[11px] text-[#9ca3af]">Not uploaded</span>
            )}
          </div>
        ))}
      </div>

      {/* Bank */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white px-4">
        <p className="border-b border-[#f3f4f6] py-3 text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">
          {bank.method === "BANK" ? "Bank Account" : "UPI"}
        </p>
        {bank.method === "BANK" ? (
          <>
            <ReviewRow label="Account Holder" value={bank.accountHolderName} />
            <ReviewRow label="Account Number" value={`****${bank.accountNumber.slice(-4)}`} />
            <ReviewRow label="IFSC Code" value={bank.ifscCode} />
            {bank.bankName && <ReviewRow label="Bank Name" value={bank.bankName} />}
          </>
        ) : (
          <ReviewRow label="UPI ID" value={bank.upiId} />
        )}
      </div>

      {/* Declarations */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Declarations</p>
        <DeclarationCheckItem
          checkKey="confirm"
          checks={checks}
          label="I confirm all information provided is correct and accurate."
          onToggle={toggleCheck}
        />
        <DeclarationCheckItem
          checkKey="terms"
          checks={checks}
          label="I agree to the eFixMate Service Partner Agreement."
          onToggle={toggleCheck}
        />
        <DeclarationCheckItem
          checkKey="background"
          checks={checks}
          label="I consent to a background verification check."
          onToggle={toggleCheck}
        />
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-[#d1d5db] bg-white text-[#374151] transition-all hover:border-[#16a34a] hover:text-[#16a34a]"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !allChecked}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <><Star size={15} /> Submit Registration</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Success Screen ─────────────────────────────────────────────────────────────

type SectionReview = {
  section: string;
  status: "pending" | "approved" | "rejected";
  remark?: string | null;
  reviewed_at?: string | null;
};

type DocumentSection = {
  document_id: number;
  document_type: string;
  section_key: string;
  review: SectionReview | null;
};

type RegistrationStatus = {
  application_status: "draft" | "pending" | "approved" | "rejected";
  application_reject_reason?: string | null;
  can_retry_application?: boolean;
  is_pending_review?: boolean;
  section_reviews?: Record<string, SectionReview>;
  document_sections?: DocumentSection[];
  technician_unique_id?: string | null;
};

function SectionStatusChip({ review }: { review?: SectionReview | null }) {
  const s = review?.status;
  if (!s || s === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
        ⏳ Pending
      </span>
    );
  if (s === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
        ✓ Approved
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-200">
      ✗ Rejected
    </span>
  );
}

function SectionRow({
  label,
  review,
}: {
  label: string;
  review?: SectionReview | null;
}) {
  return (
    <div className="border-b border-[#f3f4f6] py-3 last:border-none">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#374151]">{label}</span>
        <SectionStatusChip review={review} />
      </div>
      {review?.status === "rejected" && review.remark && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2">
          <span className="mt-0.5 shrink-0 text-[11px] text-red-500">⚠</span>
          <p className="text-[11px] leading-relaxed text-red-700">
            <span className="font-semibold">Admin note:</span> {review.remark}
          </p>
        </div>
      )}
    </div>
  );
}

// Maps a section key to the registration step that owns it
const SECTION_STEP_MAP: Record<string, number> = {
  personal_info: 1,
  skills: 2,
  selfie: 3,
  bank: 4,
};
function stepForSection(key: string): number {
  if (SECTION_STEP_MAP[key]) return SECTION_STEP_MAP[key];
  if (key.startsWith("doc_")) return 3;
  return 1;
}

function ApprovalStatusScreen({
  status,
  regId,
  onCorrect,
  onRefresh,
  onGoToPanel,
}: {
  status: RegistrationStatus;
  regId?: string;
  onCorrect?: () => void;
  onRefresh?: () => void;
  onGoToPanel?: () => void;
}) {
  const isApproved = status.application_status === "approved";
  const isPending = status.application_status === "pending";

  const sr = status.section_reviews ?? {};
  const docs = status.document_sections ?? [];

  // Collect all rejected section keys and find the earliest step to jump to
  const rejectedKeys: string[] = [
    ...["personal_info", "skills", "selfie", "bank"].filter((k) => sr[k]?.status === "rejected"),
    ...docs.filter((d) => d.review?.status === "rejected").map((d) => d.section_key),
  ];
  const hasSectionRejections = rejectedKeys.length > 0;

  // Overall rejection = admin explicitly rejected the whole application
  const isOverallRejected = status.application_status === "rejected";
  // Show as "needs correction" when any section is rejected (even if overall is still pending)
  const hasAnyRejection = isOverallRejected || hasSectionRejections;

  const title = isApproved
    ? "Registration Approved"
    : hasAnyRejection
      ? "Action Required — Sections Need Correction"
      : "Application Under Review";

  const message = isApproved
    ? "Your technician account is approved. You can now access the dashboard."
    : hasAnyRejection
      ? "One or more sections were rejected by the admin. Review the remarks below, correct them, and resubmit."
      : "Your application has been submitted and is waiting for admin review.";

  const FIXED_SECTIONS: { key: string; label: string }[] = [
    { key: "personal_info", label: "Personal Information" },
    { key: "skills", label: "Selected Skills" },
  ];

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${
        isApproved ? "bg-[#dcfce7]" : hasAnyRejection ? "bg-red-50" : "bg-[#fffbeb]"
      }`}>
        {hasAnyRejection ? (
          <X size={40} className="text-red-500" />
        ) : (
          <CheckCircle2 size={40} className={isApproved ? "text-[#16a34a]" : "text-[#d97706]"} />
        )}
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-[#14532d]">{title}</h2>
        <p className="text-[13px] text-[#4b5563]">{message}</p>
        {regId && !isApproved && (
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-1.5">
            <span className="text-[11px] font-medium text-[#6b7280]">Registration ID:</span>
            <span className="text-[12px] font-bold text-[#16a34a]">{regId}</span>
          </div>
        )}
        {/* Unique Technician ID — shown only after full approval */}
        {isApproved && status.technician_unique_id && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Your Technician ID</p>
            <div className="inline-flex items-center gap-2 rounded-lg border-2 border-[#16a34a] bg-[#f0fdf4] px-6 py-2.5">
              <BadgeCheck size={18} className="text-[#16a34a]" />
              <span className="font-mono text-[22px] font-bold tracking-widest text-[#15803d]">
                {status.technician_unique_id}
              </span>
            </div>
            <p className="text-[11px] text-[#9ca3af]">Use this ID to identify yourself on the platform</p>
          </div>
        )}
      </div>
      {isApproved && (
        <div className="flex flex-wrap justify-center gap-3">
          {onGoToPanel && (
            <button
              type="button"
              onClick={onGoToPanel}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#15803d] active:scale-95 transition-all shadow-sm"
            >
              Go to My Panel →
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-[#16a34a] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#16a34a] hover:bg-[#f0fdf4] active:scale-95 transition-all"
            >
              ↻ Refresh Status
            </button>
          )}
        </div>
      )}

      {/* Overall status row */}
      <div className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 text-left">
        <ReviewRow
          label="Overall Status"
          value={status.application_status.replace(/^\w/, (c) => c.toUpperCase())}
        />
        {isOverallRejected && status.application_reject_reason && (
          <ReviewRow label="Admin Remark" value={status.application_reject_reason} />
        )}
        {isPending && !hasSectionRejections && (
          <ReviewRow label="Next Step" value="Awaiting admin review (24–48 hrs)" />
        )}
      </div>

      {/* Per-section review status */}
      {(Object.keys(sr).length > 0 || docs.length > 0) && (
        <div className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 text-left">
          <p className="py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
            Section-wise Review Status
          </p>
          {FIXED_SECTIONS.map(({ key, label }) => (
            <SectionRow key={key} label={label} review={sr[key] ?? null} />
          ))}
          {docs.map((doc) => (
            <SectionRow
              key={doc.section_key}
              label={doc.document_type || `Document #${doc.document_id}`}
              review={doc.review}
            />
          ))}
          <SectionRow label="Selfie Photo" review={sr["selfie"] ?? null} />
          <SectionRow label="Bank / UPI Details" review={sr["bank"] ?? null} />
        </div>
      )}

      {isPending && Object.keys(sr).length === 0 && (
        <p className="text-[12px] text-[#9ca3af]">
          Section-wise review results will appear here once the admin begins review.
        </p>
      )}

      {/* Correct & Resubmit CTA — shown whenever any section is rejected */}
      {hasSectionRejections && onCorrect && (
        <div className="w-full rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-left">
          <p className="text-[13px] font-bold text-red-700 mb-1">
            {rejectedKeys.length} section{rejectedKeys.length > 1 ? "s" : ""} need{rejectedKeys.length === 1 ? "s" : ""} correction
          </p>
          <p className="text-[12px] text-red-600 mb-3">
            Fix the highlighted sections and resubmit. The admin will re-review your updated application.
          </p>
          <button
            type="button"
            onClick={() => onCorrect()}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            ✏ Correct &amp; Resubmit
          </button>
        </div>
      )}

      {/* Overall rejected but no per-section data */}
      {isOverallRejected && !hasSectionRejections && onCorrect && (
        <div className="w-full rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-left">
          <p className="text-[13px] font-bold text-red-700 mb-1">Application Rejected</p>
          <p className="text-[12px] text-red-600 mb-3">
            Review the admin remark above, update your details, and resubmit for review.
          </p>
          <button
            type="button"
            onClick={() => onCorrect()}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            ✏ Update &amp; Resubmit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Correction Screen ────────────────────────────────────────────────────────

function CorrectionScreen({
  status,
  docs,
  onDocUpload,
  onDocRemove,
  uploadingKeys,
  docTypes,
  docTypesLoading,
  onRetryDocTypes,
  uploadPolicy,
  onBack,
  onSubmit,
  onWizardCorrect,
  globalError,
  loading,
}: {
  status: RegistrationStatus;
  docs: Record<string, UploadedDoc>;
  onDocUpload: (key: string, file: File, documentNumber?: string) => void;
  onDocRemove: (key: string) => void;
  uploadingKeys: string[];
  docTypes: DocumentType[];
  docTypesLoading: boolean;
  onRetryDocTypes: () => void;
  uploadPolicy: UploadPolicy;
  onBack: () => void;
  onSubmit: () => void;
  onWizardCorrect: (step: number) => void;
  globalError?: string;
  loading: boolean;
}) {
  const sr = status.section_reviews ?? {};
  const docSections = status.document_sections ?? [];

  type RejectedItem = { sectionKey: string; label: string; remark: string | null };

  const rejectedUploadItems: RejectedItem[] = [
    ...docSections
      .filter((d) => d.review?.status === "rejected")
      .map((d) => ({ sectionKey: d.section_key, label: d.document_type, remark: d.review?.remark ?? null })),
    ...(sr.selfie?.status === "rejected"
      ? [{ sectionKey: "selfie", label: "Selfie Photo", remark: sr.selfie.remark ?? null }]
      : []),
  ];

  const SECTION_LABELS: Record<string, string> = {
    personal_info: "Personal Information",
    skills: "Skills & Services",
    bank: "Bank / UPI Details",
  };

  const rejectedFormSections = (["personal_info", "skills", "bank"] as const).filter(
    (k) => sr[k]?.status === "rejected"
  );

  const allUploadsDone = rejectedUploadItems.every(
    (item) =>
      docs[item.label]?.status === "done" &&
      (item.label === "Selfie Photo" || Boolean(docs[item.label]?.documentNumber?.trim()))
  );
  const stillUploading = rejectedUploadItems.some((item) => docs[item.label]?.status === "uploading");
  const canResubmit = allUploadsDone && !rejectedFormSections.length && !stillUploading;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6b7280] hover:text-[#14532d]"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <h2 className="text-[17px] font-bold text-[#14532d]">Correct Rejected Sections</h2>
      </div>

      <p className="text-[13px] text-[#6b7280]">
        Only the rejected items are shown. Update each one and resubmit — everything else stays as-is.
      </p>

      {/* Non-upload sections (personal_info, skills, bank) */}
      {rejectedFormSections.map((key) => (
        <div key={key} className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-[13px] font-bold text-red-700">{SECTION_LABELS[key]}</p>
          {sr[key]?.remark && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-white p-2.5 text-[12px] text-red-700">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>
                <span className="font-semibold">Admin note: </span>
                {sr[key]!.remark}
              </span>
            </div>
          )}
          <button
            onClick={() => onWizardCorrect(stepForSection(key))}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-red-700"
          >
            ✏ Edit {SECTION_LABELS[key]}
          </button>
        </div>
      ))}

      {/* Doc / selfie upload cards */}
      {docTypesLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-[#d1fae5] bg-[#f0fdf4] px-3.5 py-2.5 text-[12px] text-[#16a34a]">
          <Loader2 size={13} className="animate-spin" /> Loading document types…
        </div>
      )}

      {!docTypesLoading && docTypes.length === 0 && rejectedUploadItems.some((item) => item.label !== "Selfie Photo") && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <p className="text-[12px] text-amber-700">Document metadata is required before re-uploading documents.</p>
          <button
            type="button"
            onClick={onRetryDocTypes}
            className="ml-3 shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {rejectedUploadItems.map((item) => (
          <div key={item.sectionKey} className="space-y-2">
            {item.remark && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>
                  <span className="font-semibold">Rejected — Admin note: </span>
                  {item.remark}
                </span>
              </div>
            )}
            <DocUploadCard
              label={item.label}
              isMandatory
              uploaded={docs[item.label]}
              onUpload={(f, documentNumber) => onDocUpload(item.label, f, documentNumber)}
              onRemove={() => onDocRemove(item.label)}
              uploading={uploadingKeys.includes(item.label)}
              uploadPolicy={uploadPolicy}
            />
          </div>
        ))}
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {globalError}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canResubmit || loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Submitting…</>
        ) : (
          <><Star size={16} /> Resubmit for Review</>
        )}
      </button>

      {!canResubmit && !loading && (
        <p className="text-center text-[12px] text-[#9ca3af]">
          {rejectedFormSections.length
            ? "Please edit all rejected form sections above first."
            : stillUploading
            ? "Please wait — uploads in progress."
            : "Re-upload all rejected documents to enable resubmit."}
        </p>
      )}
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        {STEP_META.map((s, i) => {
          const num = i + 1;
          const done = num < step;
          const active = num === step;
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                done ? "bg-[#16a34a]" : active ? "bg-[#16a34a] ring-4 ring-[#bbf7d0]" : "bg-[#e5e7eb]"
              }`}>
                {done ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : (
                  <Icon size={14} className={active ? "text-white" : "text-[#9ca3af]"} />
                )}
              </div>
              <span className={`mt-1 hidden text-[10px] font-semibold sm:block ${active ? "text-[#16a34a]" : done ? "text-[#6b7280]" : "text-[#9ca3af]"}`}>
                {s.label}
              </span>
              {i < TOTAL_STEPS - 1 && (
                <div className={`absolute hidden`} />
              )}
            </div>
          );
        })}
      </div>
      {/* progress line */}
      <div className="relative h-1.5 w-full rounded-full bg-[#e5e7eb]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#16a34a] transition-all duration-500"
          style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-center text-[12px] font-semibold text-[#16a34a]">
        Step {step} of {TOTAL_STEPS} — {STEP_META[step - 1]?.label}
      </p>
    </div>
  );
}

// ─── Draft persistence ─────────────────────────────────────────────────────────

const DRAFT_KEY = "efm_tech_reg_draft";

function loadDraft(techId: number | undefined): { basic?: Partial<BasicDetails>; bank?: Partial<BankDetails>; selectedSkillIds?: number[] } {
  if (typeof window === "undefined" || !techId) return {};
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}_${techId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(techId: number | undefined, patch: { basic?: Partial<BasicDetails>; bank?: Partial<BankDetails>; selectedSkillIds?: number[] }) {
  if (typeof window === "undefined" || !techId) return;
  try {
    const existing = loadDraft(techId);
    localStorage.setItem(`${DRAFT_KEY}_${techId}`, JSON.stringify({ ...existing, ...patch }));
  } catch { /* ignore */ }
}

function clearDraft(techId: number | undefined) {
  if (typeof window === "undefined" || !techId) return;
  try { localStorage.removeItem(`${DRAFT_KEY}_${techId}`); } catch { /* ignore */ }
}

// ─── Main Registration Page ────────────────────────────────────────────────────

export default function TechnicianRegisterPage() {
  const { token, technician, isHydrated, logout } = useTechnicianAuthStore();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [regId, setRegId] = useState<string | undefined>();
  const [approvalStatus, setApprovalStatus] = useState<RegistrationStatus>({
    application_status: "draft",
  });

  // Step 2 data
  const [skillItems, setSkillItems] = useState<SkillItem[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Step 3 data
  const [docs, setDocs] = useState<Record<string, UploadedDoc>>({});
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [uploadPolicy, setUploadPolicy] = useState<UploadPolicy>(DEFAULT_UPLOAD_POLICY);

  // Form state
  const [basic, setBasic] = useState<BasicDetails>({
    fullName: "", email: "", dateOfBirth: "", gender: "",
    address: "", city: "", state: "", pincode: "",
    latitude: "", longitude: "",
  });

  const [bank, setBank] = useState<BankDetails>({
    method: "BANK",
    accountHolderName: "", accountNumber: "", confirmAccountNumber: "",
    ifscCode: "", bankName: "", branchName: "", upiId: "",
  });

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/technician/login");
    }
  }, [isHydrated, token, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await publicAPI.uploadSettings();
      if (alive && res?.status && res.data) {
        setUploadPolicy({
          images: { ...DEFAULT_UPLOAD_POLICY.images, ...(res.data.images || {}) },
          documents: { ...DEFAULT_UPLOAD_POLICY.documents, ...(res.data.documents || {}) },
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Restore draft on mount once technician is known
  useEffect(() => {
    if (!isHydrated || !technician) return;
    const draft = loadDraft(technician.technician_id);
    if (draft.basic) setBasic((p) => ({ ...p, ...draft.basic }));
    if (draft.bank) setBank((p) => ({ ...p, ...draft.bank }));
    if (draft.selectedSkillIds?.length) setSelectedSkillIds(draft.selectedSkillIds);
  }, [isHydrated, technician?.technician_id]);

  // Check registration status on mount
  useEffect(() => {
    if (!isHydrated || !token) return;
    (async () => {
      try {
        const res = await getRegistrationStatus() as {
          status?: boolean;
          application_status?: RegistrationStatus["application_status"];
          application_reject_reason?: string | null;
          can_retry_application?: boolean;
          is_pending_review?: boolean;
          section_reviews?: Record<string, SectionReview>;
          document_sections?: DocumentSection[];
          technician_unique_id?: string | null;
          data?: { currentStep?: number; registration_id?: string };
        };
        if (res?.application_status && res.application_status !== "draft") {
          setApprovalStatus({
            application_status: res.application_status,
            application_reject_reason: res.application_reject_reason ?? null,
            can_retry_application: res.can_retry_application,
            is_pending_review: res.is_pending_review,
            section_reviews: res.section_reviews ?? {},
            document_sections: res.document_sections ?? [],
            technician_unique_id: res.technician_unique_id ?? null,
          });
          setRegId(res.data?.registration_id);
          setSubmitted(true);
          return;
        }
        if (res?.data?.currentStep) {
          setStep(Math.min(res.data.currentStep, TOTAL_STEPS));
        }
      } catch {
        // start from step 1
      }
    })();
  }, [isHydrated, token]);

  const refreshApprovalStatus = useCallback(async () => {
    try {
      const res = await getRegistrationStatus() as {
        status?: boolean;
        application_status?: RegistrationStatus["application_status"];
        application_reject_reason?: string | null;
        can_retry_application?: boolean;
        is_pending_review?: boolean;
        section_reviews?: Record<string, SectionReview>;
        document_sections?: DocumentSection[];
        technician_unique_id?: string | null;
        data?: { registration_id?: string };
      };
      if (res?.application_status && res.application_status !== "draft") {
        setApprovalStatus({
          application_status: res.application_status,
          application_reject_reason: res.application_reject_reason ?? null,
          can_retry_application: res.can_retry_application,
          is_pending_review: res.is_pending_review,
          section_reviews: res.section_reviews ?? {},
          document_sections: res.document_sections ?? [],
          technician_unique_id: res.technician_unique_id ?? null,
        });
        if (res.data?.registration_id) setRegId(res.data.registration_id);
      }
    } catch {
      // keep the last known approval status on screen
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !token || !submitted) return;
    const interval = window.setInterval(refreshApprovalStatus, 30000);
    return () => window.clearInterval(interval);
  }, [isHydrated, token, submitted, refreshApprovalStatus]);

  // Load skills when reaching step 2
  useEffect(() => {
    if (step !== 2 || skillItems.length > 0) return;
    (async () => {
      setSkillsLoading(true);
      setGlobalError("");
      try {
        const res = await getRegistrationServices() as {
          status?: boolean;
          data?: RegistrationServiceRow[] | {
            services?: RegistrationServiceRow[];
            selectedIds?: number[];
            selected_service_ids?: number[];
          };
          selected_service_ids?: number[];
          selectedIds?: number[];
          message?: string;
        };
        const serviceRows = Array.isArray(res?.data) ? res.data : res?.data?.services;
        const selectedIds =
          (Array.isArray(res?.selected_service_ids) && res.selected_service_ids) ||
          (Array.isArray(res?.selectedIds) && res.selectedIds) ||
          (!Array.isArray(res?.data) && Array.isArray(res?.data?.selected_service_ids) && res.data.selected_service_ids) ||
          (!Array.isArray(res?.data) && Array.isArray(res?.data?.selectedIds) && res.data.selectedIds) ||
          [];

        if (serviceRows?.length) {
          setGlobalError("");
          const activeServices = serviceRows
            .map((s) => ({
              id: Number(s.service_id ?? s.id),
              name: String(s.service ?? s.service_name ?? s.name ?? "").trim(),
              categoryId: Number(s.category_id ?? s.categoryId) || undefined,
              categoryName: String(s.category_name ?? s.categoryName ?? (
                s.category_id ?? s.categoryId ? `Category ${s.category_id ?? s.categoryId}` : "Other"
              )).trim(),
            }))
            .filter((s) => Number.isFinite(s.id) && s.id > 0 && s.name);
          if (activeServices.length === 0) {
            setSkillItems([]);
            setGlobalError("No valid active services found. Please contact admin.");
            return;
          }
          const activeIds = new Set(activeServices.map((s) => s.id));
          setSkillItems(activeServices);
          if (selectedIds.length) {
            setSelectedSkillIds(
              selectedIds
                .map(Number)
                .filter((id) => Number.isFinite(id) && id > 0 && activeIds.has(id))
            );
          }
        } else {
          setSkillItems([]);
          setGlobalError(res?.message || "No active services found. Please contact admin.");
        }
      } catch {
        setSkillItems([]);
        setGlobalError("Unable to load services. Please try again.");
      } finally {
        setSkillsLoading(false);
      }
    })();
  }, [step, skillItems.length]);

  const [docTypesLoading, setDocTypesLoading] = useState(false);
  const [docTypesError, setDocTypesError] = useState("");

  const loadDocTypes = async () => {
    setDocTypesLoading(true);
    setDocTypesError("");
    try {
      const res = await getRequiredDocuments();
      if (process.env.NODE_ENV !== "production") {
        console.log("[DocTypes API response]", res);
      }

      // Extract array from any common response shape
      const raw = res as Record<string, unknown>;
      const candidates: unknown[] = [
        raw,                          // direct array
        raw?.data,                    // { data: [...] }
        (raw?.data as Record<string, unknown>)?.documentTypes,
        (raw?.data as Record<string, unknown>)?.document_types,
        (raw?.data as Record<string, unknown>)?.list,
        raw?.documentTypes,
        raw?.document_types,
        raw?.list,
      ];

      type DocTypeRow = DocumentType & { id?: number };
      const isDocTypeRow = (x: unknown): x is DocTypeRow =>
        typeof x === "object" && x !== null &&
        ("document_type_id" in x || "id" in x) &&
        "document_type" in x;

      let found: DocTypeRow[] = [];
      for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0 && isDocTypeRow(c[0])) {
          found = c.map((d) => ({
            document_type_id: Number((d as Record<string, unknown>).document_type_id ?? (d as Record<string, unknown>).id),
            document_type: String((d as Record<string, unknown>).document_type),
            is_mandatory: Boolean((d as Record<string, unknown>).is_mandatory),
          }));
          break;
        }
      }

      if (found.length > 0) {
        setDocTypes(found);
      } else {
        const shape = typeof raw === "object" && raw !== null
          ? `Keys: ${Object.keys(raw).join(", ")} | data type: ${typeof raw.data} | data: ${JSON.stringify(raw.data).slice(0, 120)}`
          : `Response: ${JSON.stringify(res).slice(0, 120)}`;
        setDocTypesError(`API returned no document types. (${shape})`);
      }
    } catch (err) {
      setDocTypesError(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDocTypesLoading(false);
    }
  };

  // Load document types when reaching step 3
  useEffect(() => {
    if (step !== 3 || docTypes.length > 0) return;
    loadDocTypes();
  }, [step]);

  const resolveDocTypeId = (key: string): number | undefined => {
    if (!docTypes.length) return undefined;
    const keyLower = key.toLowerCase().trim();
    // Exact match first — avoids "PAN Card" matching "Aadhaar Card Front" via "card"
    const exact = docTypes.find((d) => d.document_type.toLowerCase().trim() === keyLower);
    if (exact) return exact.document_type_id;
    // Fallback: key starts with doc type name (e.g. future renames)
    const startsWith = docTypes.find((d) => keyLower.startsWith(d.document_type.toLowerCase().trim()));
    return startsWith?.document_type_id;
  };

  const handleDocUpload = async (key: string, file: File, documentNumber?: string) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setDocs((p) => ({ ...p, [key]: { file, preview, status: "uploading", documentNumber } }));
    setUploadingKeys((p) => [...p, key]);

    try {
      const isSelfie = key === "Selfie Photo";
      const formData = new FormData();
      formData.append("attachment", file);

      if (!isSelfie) {
        const typeId = resolveDocTypeId(key);
        if (!typeId) {
          const reason = docTypes.length === 0
            ? "Document types failed to load. Use the Retry button above."
            : `No matching document type found for "${key}". Contact support.`;
          setDocs((p) => ({ ...p, [key]: { ...p[key], status: "error", errorMsg: reason } }));
          setUploadingKeys((p) => p.filter((k) => k !== key));
          return;
        }
        formData.append("documentTypeId", String(typeId));
        formData.append("documentNumber", documentNumber ?? "");
      }

      const fn = isSelfie ? uploadSelfie : uploadDocument;
      const res = await fn(formData) as { status?: boolean; message?: string };

      setDocs((p) => ({
        ...p,
        [key]: { ...p[key], status: res?.status !== false ? "done" : "error", errorMsg: res?.message, documentNumber },
      }));
    } catch {
      setDocs((p) => ({ ...p, [key]: { ...p[key], status: "error", errorMsg: "Upload failed" } }));
    } finally {
      setUploadingKeys((p) => p.filter((k) => k !== key));
    }
  };

  const handleDocRemove = (key: string) => {
    setDocs((p) => {
      const next = { ...p };
      if (next[key]?.preview) URL.revokeObjectURL(next[key].preview!);
      delete next[key];
      return next;
    });
  };

  // Step handlers
  const handleStep1Next = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await saveBasicDetails({
        fullName: basic.fullName,
        email: basic.email || undefined,
        dateOfBirth: basic.dateOfBirth || undefined,
        gender: basic.gender,
        address: basic.address,
        city: basic.city,
        state: basic.state,
        pincode: basic.pincode,
        latitude: basic.latitude,
        longitude: basic.longitude,
        country: "India",
      }) as { status?: boolean; message?: string };
      if (res?.status === false) {
        setGlobalError(res.message || "Failed to save details. Please try again.");
        return;
      }
      saveDraft(technician?.technician_id, { basic });
      setStep(2);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const activeIds = new Set(skillItems.map((s) => s.id));
      const validSelectedIds = selectedSkillIds.filter((id) => activeIds.has(id));
      if (validSelectedIds.length === 0) {
        setGlobalError("Please select at least one active service.");
        return;
      }
      const res = await saveSkills(validSelectedIds) as { status?: boolean; message?: string };
      if (res?.status === false) {
        setGlobalError(res.message || "Failed to save skills.");
        return;
      }
      setSelectedSkillIds(validSelectedIds);
      saveDraft(technician?.technician_id, { selectedSkillIds: validSelectedIds });
      setStep(3);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Next = () => {
    setStep(4);
  };

  const handleStep4Next = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const payload =
        bank.method === "BANK"
          ? {
              paymentMethod: "BANK",
              accountHolderName: bank.accountHolderName,
              accountNumber: bank.accountNumber,
              ifscNumber: bank.ifscCode,
              accountType: "C",
            }
          : {
              paymentMethod: "UPI",
              upiId: bank.upiId,
            };

      const res = await saveBankDetails(payload) as { status?: boolean; message?: string };
      if (res?.status === false) {
        setGlobalError(res.message || "Failed to save payment details.");
        return;
      }
      saveDraft(technician?.technician_id, { bank });
      setStep(5);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitCorrections = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await resubmitCorrections() as { status?: boolean; message?: string };
      if (res?.status === false) {
        setGlobalError(res.message || "Resubmit failed. Please try again.");
        return;
      }
      // Refresh status and go back to approval status screen
      const statusRes = await getRegistrationStatus() as {
        status?: boolean;
        application_status?: RegistrationStatus["application_status"];
        application_reject_reason?: string | null;
        can_retry_application?: boolean;
        is_pending_review?: boolean;
        section_reviews?: Record<string, SectionReview>;
        document_sections?: DocumentSection[];
        technician_unique_id?: string | null;
        data?: { registration_id?: string };
      };
      if (statusRes?.application_status) {
        setApprovalStatus({
          application_status: statusRes.application_status,
          application_reject_reason: statusRes.application_reject_reason ?? null,
          can_retry_application: statusRes.can_retry_application,
          is_pending_review: statusRes.is_pending_review,
          section_reviews: statusRes.section_reviews ?? {},
          document_sections: statusRes.document_sections ?? [],
          technician_unique_id: statusRes.technician_unique_id ?? null,
        });
      }
      setCorrectionMode(false);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (agreement: { accepted: boolean; version: string }) => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await submitRegistration(agreement) as {
        status?: boolean;
        message?: string;
        registration_progress?: {
          basic_details?: { completed: boolean; missing?: string[] };
          skills?: { completed: boolean };
          documents?: { completed: boolean; missing?: { document_type: string }[] };
          selfie?: { completed: boolean };
          bank_details?: { completed: boolean };
        };
        data?: {
          registration_id?: string;
          application_status?: RegistrationStatus["application_status"];
          is_pending_review?: boolean;
        };
      };
      if (res?.status === false) {
        const p = res.registration_progress;
        if (p) {
          const incomplete: string[] = [];
          if (!p.basic_details?.completed) incomplete.push("Basic Details" + (p.basic_details?.missing?.length ? ` (missing: ${p.basic_details.missing.join(", ")})` : ""));
          if (!p.skills?.completed) incomplete.push("Skills");
          if (!p.documents?.completed) incomplete.push("Documents" + (p.documents?.missing?.length ? ` (missing: ${p.documents.missing.map((d) => d.document_type).join(", ")})` : ""));
          if (!p.selfie?.completed) incomplete.push("Selfie Photo");
          if (!p.bank_details?.completed) incomplete.push("Bank / UPI details");
          if (incomplete.length) {
            setGlobalError(`Please complete: ${incomplete.join(" · ")}`);
            return;
          }
        }
        setGlobalError(res.message || "Submission failed. Please try again.");
        return;
      }
      const rid = (res as { data?: { registration_id?: string } })?.data?.registration_id;
      setRegId(rid);
      setApprovalStatus({
        application_status: res.data?.application_status || "pending",
        is_pending_review: res.data?.is_pending_review ?? true,
      });
      clearDraft(technician?.technician_id);
      setSubmitted(true);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f0fdf4] px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#16a34a]" />
        <p className="text-sm font-semibold text-[#14532d]">
          Mobile verification is required to access technician registration.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-[#bbf7d0]">
            <BrandLogo width={24} height={24} className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#14532d]">Partner Registration</h1>
            <p className="text-[12px] text-[#4b5563]">Join eFixMate as a service technician</p>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-[#bbf7d0]/60 bg-white shadow-xl p-6">
            {correctionMode ? (
              <CorrectionScreen
                status={approvalStatus}
                docs={docs}
                onDocUpload={handleDocUpload}
                onDocRemove={handleDocRemove}
                uploadingKeys={uploadingKeys}
                docTypes={docTypes}
                docTypesLoading={docTypesLoading}
                onRetryDocTypes={loadDocTypes}
                uploadPolicy={uploadPolicy}
                onBack={() => setCorrectionMode(false)}
                onSubmit={handleResubmitCorrections}
                onWizardCorrect={(startStep) => {
                  setSubmitted(false);
                  setCorrectionMode(false);
                  setStep(startStep);
                  setGlobalError("");
                }}
                globalError={globalError}
                loading={loading}
              />
            ) : (
              <ApprovalStatusScreen
                status={approvalStatus}
                regId={regId}
                onRefresh={refreshApprovalStatus}
                onGoToPanel={
                  technician?.technician_id
                    ? () => router.push(`/technician/${encodeId(technician.technician_id)}/dashboard`)
                    : undefined
                }
                onCorrect={() => {
                  if (!docTypes.length && !docTypesLoading) loadDocTypes();
                  setCorrectionMode(true);
                  setGlobalError("");
                }}
              />
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#bbf7d0]/60 bg-white shadow-xl">
            <div className="p-6 lg:p-8">
              <ProgressBar step={step} />

              {globalError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-[12px] font-medium text-red-600">
                  {globalError}
                </div>
              )}

              {step === 1 && (
                <Step1
                  data={basic}
                  onChange={(d) => setBasic((p) => ({ ...p, ...d }))}
                  onNext={handleStep1Next}
                  loading={loading}
                  mobileNumber={technician?.mobile_number}
                  onChangeMobile={() => {
                    logout();
                    router.replace("/technician/login");
                  }}
                />
              )}
              {step === 2 && (
                <Step2
                  selectedIds={selectedSkillIds}
                  skillItems={skillItems}
                  onToggle={(id) =>
                    setSelectedSkillIds((p) =>
                      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
                    )
                  }
                  onNext={handleStep2Next}
                  onBack={() => setStep(1)}
                  loading={loading}
                  skillsLoading={skillsLoading}
                />
              )}
              {step === 3 && (
                <Step3
                  docs={docs}
                  onUpload={handleDocUpload}
                  onRemove={handleDocRemove}
                  uploadingKeys={uploadingKeys}
                  docTypes={docTypes}
                  docTypesLoading={docTypesLoading}
                  docTypesError={docTypesError}
                  onRetryDocTypes={loadDocTypes}
                  uploadPolicy={uploadPolicy}
                  onNext={handleStep3Next}
                  onBack={() => setStep(2)}
                  loading={loading}
                />
              )}
              {step === 4 && (
                <Step4
                  data={bank}
                  onChange={(d) => setBank((p) => ({ ...p, ...d }))}
                  onNext={handleStep4Next}
                  onBack={() => setStep(3)}
                  loading={loading}
                />
              )}
              {step === 5 && (
                <Step5
                  basic={basic}
                  skills={selectedSkillIds}
                  skillItems={skillItems}
                  docs={docs}
                  bank={bank}
                  onBack={() => setStep(4)}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
