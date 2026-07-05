import {
  forwardGeocodeSearch,
  getPlaceLocationNew,
  resetPlacesSession,
  autocompletePlacesNew,
} from "@/lib/placesApiNew";
import { searchAppPlaces } from "@/lib/placeSearch";
import { searchPlacesNominatim } from "./_nominatim";
import type { AreaPoint } from "./_areaLayers";

export type PlaceSuggestion = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: undefined;
};

export type SearchPlacesOptions = {
  limit?: number;
  existingAreas?: AreaPoint[];
  excludeAreaId?: number;
};

/** Call when the user clears the search box to start a fresh billing session. */
export function resetPlaceSearchSession(): void {
  resetPlacesSession();
}

function dedupeSuggestions(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  const out: PlaceSuggestion[] = [];
  for (const item of items) {
    const lat = item.lat ? Number(item.lat).toFixed(5) : "";
    const lon = item.lon ? Number(item.lon).toFixed(5) : "";
    const key = item.place_id || `${lat},${lon}|${item.display_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Match areas already drawn on the map (grey reference shapes). */
export function searchExistingAreas(
  areas: AreaPoint[],
  query: string,
  excludeAreaId?: number
): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return areas
    .filter((a) => excludeAreaId == null || a.area_id !== excludeAreaId)
    .filter((a) => {
      const name = (a.area_name || "").toLowerCase();
      const city = (a.city_name || "").toLowerCase();
      const state = (a.state_name || "").toLowerCase();
      return name.includes(q) || `${name} ${city} ${state}`.includes(q);
    })
    .map((a) => {
      const lat = parseFloat(String(a.latitude));
      const lng = parseFloat(String(a.longitude));
      const location = [a.city_name, a.state_name].filter(Boolean).join(", ");
      return {
        place_id: `geocode:${lat},${lng}`,
        display_name: location
          ? `${a.area_name} — ${location} (saved area)`
          : `${a.area_name} (saved area)`,
        lat: String(lat),
        lon: String(lng),
      };
    })
    .filter((s) => !Number.isNaN(Number(s.lat)) && !Number.isNaN(Number(s.lon)));
}

async function searchPlacesRemote(
  query: string,
  limit: number
): Promise<PlaceSuggestion[]> {
  try {
    const rows = await searchAppPlaces(query, limit);
    return rows.map((r) => ({
      place_id: r.placeId,
      display_name: r.text,
      lat: r.lat != null ? String(r.lat) : "",
      lon: r.lng != null ? String(r.lng) : "",
    }));
  } catch {
    return [];
  }
}

async function searchPlacesClientFallback(
  query: string,
  limit: number
): Promise<PlaceSuggestion[]> {
  const collected: PlaceSuggestion[] = [];

  try {
    const osm = await searchPlacesNominatim(query, limit);
    collected.push(...osm);
  } catch {
    /* try other providers */
  }

  if (collected.length < limit) {
    try {
      const geocoded = await forwardGeocodeSearch(query, limit - collected.length);
      collected.push(
        ...geocoded.map((r) => ({
          place_id: r.placeId,
          display_name: r.text,
          lat: String(r.lat),
          lon: String(r.lng),
        }))
      );
    } catch {
      /* try autocomplete */
    }
  }

  if (collected.length < limit) {
    try {
      const autocomplete = await autocompletePlacesNew(query, {
        regionCodes: ["IN"],
        limit: limit - collected.length,
      });
      collected.push(
        ...autocomplete.map((r) => ({
          place_id: r.placeId,
          display_name: r.text,
          lat: "",
          lon: "",
        }))
      );
    } catch {
      /* exhausted fallbacks */
    }
  }

  return dedupeSuggestions(collected).slice(0, limit);
}

export async function searchPlaces(
  query: string,
  limitOrOptions: number | SearchPlacesOptions = 12
): Promise<PlaceSuggestion[]> {
  const options =
    typeof limitOrOptions === "number" ? { limit: limitOrOptions } : limitOrOptions;
  const limit = options.limit ?? 12;
  const q = query.trim();
  if (q.length < 2) return [];

  const collected: PlaceSuggestion[] = [];

  collected.push(
    ...searchExistingAreas(options.existingAreas ?? [], q, options.excludeAreaId)
  );

  const remoteLimit = limit - collected.length;
  if (remoteLimit > 0) {
    let remote = await searchPlacesRemote(q, remoteLimit);
    if (remote.length === 0) {
      remote = await searchPlacesClientFallback(q, remoteLimit);
    }
    collected.push(...remote);
  }

  return dedupeSuggestions(collected).slice(0, limit);
}

export async function getPlacePosition(
  placeId: string,
  hint?: { lat?: string; lon?: string }
): Promise<{ lat: number; lng: number } | null> {
  if (placeId.startsWith("nominatim:") || placeId.startsWith("geocode:") || placeId.startsWith("photon:")) {
    const [lat, lng] = placeId.replace(/^(nominatim|geocode|photon):/, "").split(",").map(Number);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    return null;
  }

  if (hint?.lat && hint?.lon) {
    const lat = Number(hint.lat);
    const lng = Number(hint.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  try {
    const res = await fetch(
      `/geo/places/details?placeId=${encodeURIComponent(placeId)}`
    );
    if (res.ok) {
      const data = (await res.json()) as { lat?: number; lng?: number };
      if (data.lat != null && data.lng != null) return { lat: data.lat, lng: data.lng };
    }
  } catch {
    /* fall through */
  }

  return getPlaceLocationNew(placeId);
}
