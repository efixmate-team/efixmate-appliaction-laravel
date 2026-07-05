import type { LocationData } from "@/store/location.store";
import { locationFromAddress, requestGPS, stateCode } from "@/lib/locationDetection";

export type UserAddress = {
  address_id: number;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string | number;
  latitude?: string | number;
  longitude?: string | number;
  is_selected?: boolean;
  is_active?: boolean;
};

export type AddressFormData = {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  longitude: string;
};

export function normalizeUserAddresses(raw: unknown): UserAddress[] {
  if (!Array.isArray(raw)) return [];
  const out: UserAddress[] = [];
  for (const row of raw) {
    const r = row as Record<string, unknown>;
    const id = r.address_id ?? r.addressId;
    if (id == null) continue;
    if (r.is_active === false) continue;
    out.push({
      address_id: Number(id),
      address: String(r.address ?? ""),
      city: String(r.city ?? ""),
      state: String(r.state ?? ""),
      country: r.country != null ? String(r.country) : "India",
      pincode: r.pincode != null ? String(r.pincode) : "",
      latitude: r.latitude as string | number | undefined,
      longitude: r.longitude as string | number | undefined,
      is_selected: Boolean(r.is_selected ?? r.isSelected),
      is_active: r.is_active != null ? Boolean(r.is_active) : true,
    });
  }
  return out;
}

export function locationFromUserAddress(addr: UserAddress): LocationData {
  return {
    ...locationFromAddress({
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: String(addr.pincode ?? ""),
      latitude: addr.latitude != null ? String(addr.latitude) : undefined,
      longitude: addr.longitude != null ? String(addr.longitude) : undefined,
    }),
    addressId: addr.address_id,
    source: "address",
  };
}

export type AddressLabel = "Home" | "Office" | "Other";

const HOME_HINT = /\b(home|house|residence|villa|flat|apartment|pg)\b/i;
const OFFICE_HINT = /\b(office|work|workplace|company|corp|corporate|business|hq)\b/i;

/** Infer Home / Office from address text when no dedicated label column exists. */
export function getAddressLabel(addr: UserAddress): AddressLabel {
  const text = addr.address.trim();
  if (/^home\b/i.test(text) || HOME_HINT.test(text)) return "Home";
  if (/^office\b/i.test(text) || OFFICE_HINT.test(text)) return "Office";
  return "Other";
}

export function getAddressDisplayTitle(addr: UserAddress): string {
  const label = getAddressLabel(addr);
  if (label !== "Other") return label;
  const line = addr.address.split(",")[0]?.trim();
  return line || addr.city || "Address";
}

export function parseAddressCoords(addr: UserAddress): { lat: number; lng: number } | null {
  const lat = parseFloat(String(addr.latitude ?? ""));
  const lng = parseFloat(String(addr.longitude ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function findNearestAddress(
  lat: number,
  lng: number,
  addresses: UserAddress[]
): { address: UserAddress; distanceKm: number } | null {
  let best: { address: UserAddress; distanceKm: number } | null = null;
  for (const addr of addresses) {
    const coords = parseAddressCoords(addr);
    if (!coords) continue;
    const d = distanceKm({ lat, lng }, coords);
    if (!best || d < best.distanceKm) best = { address: addr, distanceKm: d };
  }
  return best;
}

/** Pick the saved address closest to the user's current GPS (Home vs Office). */
export async function resolveNearestSavedAddress(
  addresses: UserAddress[]
): Promise<{ address: UserAddress; distanceKm: number; gpsUsed: boolean } | null> {
  if (!addresses.length) return null;
  if (addresses.length === 1) {
    return { address: addresses[0], distanceKm: 0, gpsUsed: false };
  }

  const pos = await requestGPS();
  if (!pos) {
    const fallback = addresses.find((a) => a.is_selected) ?? addresses[0];
    return { address: fallback, distanceKm: 0, gpsUsed: false };
  }

  const nearest = findNearestAddress(
    pos.coords.latitude,
    pos.coords.longitude,
    addresses
  );
  if (!nearest) {
    const fallback = addresses.find((a) => a.is_selected) ?? addresses[0];
    return { address: fallback, distanceKm: 0, gpsUsed: true };
  }
  return { address: nearest.address, distanceKm: nearest.distanceKm, gpsUsed: true };
}

export function formFromLocation(loc: LocationData): AddressFormData {
  const street = loc.area?.trim() || "";
  return {
    address: street,
    city: loc.city || "",
    state: loc.state.length <= 3 ? loc.state : stateCode(loc.state),
    country: "India",
    pincode: loc.pincode ?? "",
    latitude: String(loc.lat),
    longitude: String(loc.lng),
  };
}

export function formFromUserAddress(addr: UserAddress): AddressFormData {
  return {
    address: addr.address,
    city: addr.city,
    state: addr.state.length <= 3 ? addr.state : stateCode(addr.state),
    country: addr.country ?? "India",
    pincode: String(addr.pincode ?? ""),
    latitude: addr.latitude != null ? String(addr.latitude) : "",
    longitude: addr.longitude != null ? String(addr.longitude) : "",
  };
}

export function validateAddressForm(form: AddressFormData): string | null {
  if (!form.address.trim()) return "Enter house/flat number and street.";
  if (!form.city.trim()) return "City is required.";
  if (!form.state.trim()) return "State is required.";
  if (!form.country.trim()) return "Country is required.";
  if (!/^\d{6}$/.test(form.pincode.replace(/\s/g, ""))) return "Enter a valid 6-digit pincode.";
  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Location coordinates are missing.";
  return null;
}

export function toUpsertAddressPayload(
  form: AddressFormData,
  options?: { addressId?: number; isSelected?: boolean }
) {
  const payload: Record<string, unknown> = {
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    pincode: form.pincode.replace(/\s/g, ""),
    latitude: parseFloat(form.latitude),
    longitude: parseFloat(form.longitude),
    is_selected: options?.isSelected ?? true,
  };
  if (options?.addressId != null) {
    payload.address_id = options.addressId;
    payload.addressId = options.addressId;
  }
  return payload;
}
