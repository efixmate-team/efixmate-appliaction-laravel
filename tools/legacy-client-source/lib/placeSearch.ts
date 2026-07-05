/**
 * Unified place search for admin area picker, location modal, etc.
 * Uses /geo/places/* (Next.js routes) — not proxied to Express /api backend.
 */

import { getPlaceLocationNew } from "@/lib/placesApiNew";

export type AppPlaceSuggestion = {
  placeId: string;
  text: string;
  lat?: number;
  lng?: number;
};

const GEO_SEARCH = "/geo/places/search";
const GEO_DETAILS = "/geo/places/details";

function mapRow(row: {
  place_id: string;
  display_name: string;
  lat?: string;
  lon?: string;
}): AppPlaceSuggestion {
  const lat = row.lat ? Number(row.lat) : undefined;
  const lng = row.lon ? Number(row.lon) : undefined;
  return {
    placeId: row.place_id,
    text: row.display_name,
    ...(lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
      ? { lat, lng }
      : {}),
  };
}

async function photonClientSearch(
  query: string,
  limit: number
): Promise<AppPlaceSuggestion[]> {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query.includes("India") ? query : `${query}, India`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", "en");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: Record<string, string | undefined>;
      }>;
    };

    return (data.features ?? []).map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      const text = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(", ");
      return {
        placeId: `photon:${lat},${lng}`,
        text: text || query,
        lat,
        lng,
      };
    });
  } catch {
    return [];
  }
}

/** Search places — OSM-backed server route first, Photon client fallback. */
export async function searchAppPlaces(
  query: string,
  limit = 12
): Promise<AppPlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    const res = await fetch(`${GEO_SEARCH}?${params}`);
    if (res.ok) {
      const data = (await res.json()) as Array<{
        place_id: string;
        display_name: string;
        lat?: string;
        lon?: string;
      }>;
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapRow);
      }
    }
  } catch {
    /* server route unavailable — try client OSM */
  }

  return photonClientSearch(q, limit);
}

export async function resolveAppPlaceCoords(
  placeId: string,
  hint?: { lat?: number; lng?: number }
): Promise<{ lat: number; lng: number } | null> {
  if (hint?.lat != null && hint?.lng != null) {
    return { lat: hint.lat, lng: hint.lng };
  }

  const prefixed = placeId.match(/^(?:nominatim|geocode|photon):(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (prefixed) {
    const lat = Number(prefixed[1]);
    const lng = Number(prefixed[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  try {
    const res = await fetch(`${GEO_DETAILS}?placeId=${encodeURIComponent(placeId)}`);
    if (res.ok) {
      const data = (await res.json()) as { lat?: number; lng?: number };
      if (data.lat != null && data.lng != null) return { lat: data.lat, lng: data.lng };
    }
  } catch {
    /* fall through */
  }

  return getPlaceLocationNew(placeId);
}
