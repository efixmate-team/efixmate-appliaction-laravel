/**
 * Location detection utilities for EFixMate.
 *
 * Priority order:
 *   1. Saved user address (logged-in) — city/area from their default address
 *   2. Persisted localStorage location
 *   3. Browser GPS → reverse geocode via Google Maps API
 *   4. IP-based fallback
 *   5. Default (Raipur, CG)
 */

import { reverseGeocodeNew, reverseGeocodeOsm } from "@/lib/placesApiNew";
import type { LocationData } from "@/store/location.store";

function buildLocationFromGeo(
  lat: number,
  lng: number,
  geo: { street?: string; city?: string; state?: string; pincode?: string },
  source: LocationData["source"]
): LocationData | null {
  const area = geo.street?.split(",")[0]?.trim() ?? "";
  const city = geo.city?.trim() ?? "";
  const stateRaw = geo.state?.trim() ?? "";
  if (!city && !stateRaw) return null;

  const state = stateCode(stateRaw);
  const displayName = area ? `${area}, ${city || stateRaw}` : `${city || stateRaw}${state ? `, ${state}` : ""}`;

  return {
    lat,
    lng,
    area,
    city: city || stateRaw,
    state,
    pincode: geo.pincode ?? "",
    displayName,
    source,
  };
}

// ─── Reverse geocoding (Google Maps + OSM fallback) ───────────────────────────

export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
  source: LocationData["source"] = "gps"
): Promise<LocationData> {
  try {
    let geo = await reverseGeocodeNew(lat, lng);
    if (!geo.city && !geo.state) {
      geo = await reverseGeocodeOsm(lat, lng);
    }

    const loc = buildLocationFromGeo(lat, lng, geo, source);
    if (loc) return loc;

    // Last resort: keep GPS coords even if geocoders fail
    return {
      lat,
      lng,
      area: "",
      city: "Your area",
      state: "IN",
      pincode: "",
      displayName: "Current location",
      source,
    };
  } catch {
    return {
      lat,
      lng,
      area: "",
      city: "Your area",
      state: "IN",
      pincode: "",
      displayName: "Current location",
      source,
    };
  }
}

// ─── GPS detection ────────────────────────────────────────────────────────────

export function requestGPS(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 }
    );
  });
}

export async function detectFromGPS(): Promise<LocationData | null> {
  const pos = await requestGPS();
  if (!pos) return null;
  return reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude, "gps");
}

// ─── IP-based fallback ────────────────────────────────────────────────────────

export async function detectFromIP(): Promise<LocationData | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("IP API failed");
    const d = await res.json() as {
      latitude?: number; longitude?: number;
      city?: string; region?: string;
      region_code?: string; postal?: string;
    };
    const lat = d.latitude ?? 21.2514;
    const lng = d.longitude ?? 81.6296;
    const city  = d.city ?? "Raipur";
    const state = stateCode(d.region ?? "Chhattisgarh");
    return {
      lat, lng,
      area: "",
      city,
      state,
      pincode: d.postal ?? "",
      displayName: `${city}, ${state}`,
      source: "ip",
    };
  } catch {
    return null;
  }
}

// ─── Full auto-detect (GPS → IP → default) ───────────────────────────────────

export async function autoDetectLocation(): Promise<{
  location: LocationData;
  permissionDenied: boolean;
}> {
  const DEFAULT: LocationData = {
    lat: 21.2514, lng: 81.6296,
    area: "", city: "Raipur", state: "CG",
    displayName: "Raipur, CG",
    source: "default",
  };

  // 1. Try GPS
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const pos = await requestGPS();
    if (pos) {
      const loc = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude, "gps");
      if (loc) return { location: loc, permissionDenied: false };
    } else {
      // GPS denied or unavailable
      const ip = await detectFromIP();
      return { location: ip ?? DEFAULT, permissionDenied: true };
    }
  }

  // 2. IP fallback
  const ip = await detectFromIP();
  return { location: ip ?? DEFAULT, permissionDenied: false };
}

// ─── Build LocationData from a saved address ──────────────────────────────────

export function locationFromAddress(addr: {
  address?: string; city?: string; state?: string; pincode?: string;
  latitude?: string; longitude?: string;
}): LocationData {
  const city  = addr.city ?? "Raipur";
  const state = stateCode(addr.state ?? "Chhattisgarh");
  const area  = addr.address?.split(",")[0]?.trim() ?? "";
  return {
    lat:  parseFloat(addr.latitude ?? "21.2514"),
    lng:  parseFloat(addr.longitude ?? "81.6296"),
    area, city, state,
    pincode:     addr.pincode ?? "",
    displayName: area ? `${area}, ${city}` : `${city}, ${state}`,
    source: "address",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_CODES: Record<string, string> = {
  "Chhattisgarh": "CG", "Maharashtra": "MH", "Delhi": "DL",
  "Karnataka":    "KA", "Tamil Nadu":  "TN", "Gujarat":    "GJ",
  "Rajasthan":    "RJ", "Uttar Pradesh": "UP", "Madhya Pradesh": "MP",
  "West Bengal":  "WB", "Telangana":   "TS", "Andhra Pradesh": "AP",
};

export function stateCode(stateName: string): string {
  return STATE_CODES[stateName] ?? stateName.slice(0, 2).toUpperCase();
}

/** Context-aware service suggestion based on time & (future: weather). */
export function getTimeBasedServiceSuggestion(): { label: string; service: string } {
  const h = new Date().getHours();
  if (h >= 5  && h < 10) return { label: "Start your morning right",    service: "Electrical Inspection" };
  if (h >= 10 && h < 14) return { label: "Afternoon specials",          service: "AC Service"            };
  if (h >= 14 && h < 18) return { label: "Peak hour deals",             service: "Plumbing Fix"          };
  if (h >= 18 && h < 21) return { label: "Evening at home",             service: "Appliance Repair"      };
  return { label: "Available 24/7",                                      service: "Emergency Services"    };
}
