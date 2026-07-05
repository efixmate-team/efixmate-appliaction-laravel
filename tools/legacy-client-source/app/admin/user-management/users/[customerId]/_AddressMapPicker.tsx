"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin, X, LocateFixed } from "lucide-react";
import { loadGoogleMaps } from "@/lib/gmapsLoader";
import { reverseGeocodeNew } from "@/lib/placesApiNew";
import {
  getPlacePosition,
  resetPlaceSearchSession,
  searchPlaces,
  type PlaceSuggestion,
} from "@/app/admin/masters/geography/areas/_placeSearch";

export interface ResolvedAddress {
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface Props {
  onResolve: (addr: ResolvedAddress) => void;
}

const DEFAULT_LAT = 21.2514;
const DEFAULT_LNG = 81.6296;

export default function AddressMapPicker({ onResolve }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [pinInfo, setPinInfo] = useState<string>("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      resetPlaceSearchSession();
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(value, 7);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const movePinTo = async (lat: number, lng: number) => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(16);
      markerRef.current.setPosition({ lat, lng });
    }
    setResolving(true);
    setPinInfo("Resolving address…");
    const geo = await reverseGeocodeNew(lat, lng);
    setResolving(false);
    const label =
      [geo.street, geo.city, geo.state].filter(Boolean).join(", ") ||
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setPinInfo(label);
    onResolve({
      lat,
      lng,
      street: geo.street || "",
      city: geo.city || "",
      state: geo.state || "",
      country: geo.country || "",
      pincode: geo.pincode || "",
    });
  };

  const selectSuggestion = async (s: PlaceSuggestion) => {
    setQuery(s.display_name.split(",").slice(0, 2).join(",").trim());
    setSuggestions([]);
    setShowDropdown(false);

    const coords = await getPlacePosition(s.place_id, { lat: s.lat, lon: s.lon });
    if (coords) void movePinTo(coords.lat, coords.lng);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => void movePinTo(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  };

  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: 12,
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
        if (pos) void movePinTo(pos.lat(), pos.lng());
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        marker.setPosition(e.latLng);
        void movePinTo(e.latLng.lat(), e.latLng.lng());
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mounted]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2" ref={searchRef}>
        <div className="relative flex-1">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm focus-within:border-[#60a5fa] focus-within:ring-2 focus-within:ring-[#eff6ff] transition-all">
            {searching
              ? <Loader2 className="w-4 h-4 text-[#eff6ff] shrink-0 animate-spin" />
              : <Search className="w-4 h-4 text-[#5c6a7f] shrink-0" />}
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Search address or locality…"
              className="flex-1 text-sm bg-transparent outline-none text-[#334155] placeholder:text-[#5c6a7f]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setShowDropdown(false);
                  resetPlaceSearchSession();
                }}
              >
                <X className="w-3.5 h-3.5 text-[#5c6a7f] hover:text-[#475569]" />
              </button>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-xl z-[9999] overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((s) => {
                const parts = s.display_name.split(",");
                return (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => void selectSuggestion(s)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#eff6ff] transition-colors text-left border-b border-[#f8fafc] last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#eff6ff] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#1e293b] truncate">{parts.slice(0, 2).join(",").trim()}</p>
                      <p className="text-[11px] text-[#5c6a7f] truncate">{parts.slice(2).join(",").trim()}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleMyLocation}
          title="Use my location"
          className="p-2.5 rounded-xl border border-[#e2e8f0] bg-[#ffffff] hover:bg-[#eff6ff] hover:border-[#93c5fd] text-[#53697e] hover:text-[#2563eb] transition-colors shadow-sm"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ height: 300 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {(pinInfo || resolving) && (
        <div className="flex items-center gap-2 text-xs text-[#53697e] px-1">
          {resolving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#eff6ff]" />
            : <MapPin className="w-3.5 h-3.5 text-[#eff6ff]" />}
          <span>{pinInfo}</span>
        </div>
      )}

      <p className="text-xs text-[#5c6a7f] px-1">Click on the map or drag the pin to set the location. Fields below will be auto-filled.</p>
    </div>
  );
}
