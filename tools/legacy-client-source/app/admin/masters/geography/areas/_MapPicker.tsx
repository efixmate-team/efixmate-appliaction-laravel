"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { loadGoogleMaps } from "@/lib/gmapsLoader";
import {
  searchPlaces,
  getPlacePosition,
  resetPlaceSearchSession,
  type PlaceSuggestion,
} from "./_placeSearch";

interface Props {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, radius, onLocationChange }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchPlaces(value, { limit: 12 });
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const selectSuggestion = async (s: PlaceSuggestion) => {
    const label = s.display_name.split(",").slice(0, 2).join(",").trim();
    setQuery(label);
    setSuggestions([]);
    setShowDropdown(false);

    const coords = await getPlacePosition(s.place_id, { lat: s.lat, lon: s.lon });
    if (!coords) return;

    onLocationChange(coords.lat, coords.lng);

    if (mapRef.current && markerRef.current && circleRef.current) {
      const pos = { lat: coords.lat, lng: coords.lng };
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(15);
      markerRef.current.setPosition(pos);
      circleRef.current.setCenter(pos);
    }
  };

  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center = { lat, lng };
      const safeRadius = !isNaN(radius) && radius > 0 ? radius : 5000;

      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });

      const circle = new google.maps.Circle({
        center,
        radius: safeRadius,
        map,
        strokeColor: "#3b82f6",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        clickable: false,
      });

      marker.addListener("drag", () => {
        const pos = marker.getPosition();
        if (pos) circle.setCenter(pos);
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) onLocationChange(pos.lat(), pos.lng());
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        marker.setPosition(e.latLng);
        circle.setCenter(e.latLng);
        onLocationChange(e.latLng.lat(), e.latLng.lng());
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      circleRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, [mounted]);

  useEffect(() => {
    if (circleRef.current && !isNaN(radius) && radius > 0) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  return (
    <>
      <div className="relative" ref={searchRef}>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm focus-within:border-[#60a5fa] focus-within:ring-2 focus-within:ring-[#eff6ff] transition-all">
          {searching
            ? <Loader2 className="w-4 h-4 text-[#eff6ff] shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-[#5c6a7f] shrink-0" />}
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search location… e.g. Mahalaxmi Layout, Bangalore"
            className="flex-1 text-[13px] bg-transparent outline-none text-[#334155] placeholder:text-[#5c6a7f]"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); resetPlaceSearchSession(); }}>
              <X className="w-3.5 h-3.5 text-[#5c6a7f] hover:text-[#475569]" />
            </button>
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-xl z-[9999] overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((s) => {
              const parts = s.display_name.split(",");
              return (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => void selectSuggestion(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#eff6ff] transition-colors text-left border-b border-[#f8fafc] last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#eff6ff] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1e293b] truncate">{parts.slice(0, 2).join(",").trim()}</p>
                    <p className="text-[11px] text-[#5c6a7f] truncate mt-0.5">{parts.slice(2).join(",").trim()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2 rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ height: 320 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </>
  );
}
