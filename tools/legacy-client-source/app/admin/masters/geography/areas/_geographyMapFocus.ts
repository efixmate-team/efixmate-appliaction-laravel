import type { AreaPoint } from "./_areaLayers";
import { getPlacePosition, searchPlaces } from "./_placeSearch";

export type MapFlyTo =
  | { type: "point"; lat: number; lng: number; zoom: number }
  | { type: "bounds"; points: [number, number][]; padding?: number };

export type GeographyNames = {
  countryName?: string;
  stateName?: string;
  cityName?: string;
  cityId?: string;
};

function parsePolygonCoords(raw: unknown): [number, number][] | null {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) return raw as [number, number][];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed as [number, number][];
    } catch {
      return null;
    }
  }
  return null;
}

/** Collect lat/lng points from existing areas in the selected city (for fitBounds). */
export function collectAreaBoundsPoints(
  areas: AreaPoint[],
  cityName?: string,
): [number, number][] {
  if (!cityName?.trim()) return [];
  const key = cityName.trim().toLowerCase();
  const points: [number, number][] = [];

  for (const area of areas) {
    if ((area.city_name || "").trim().toLowerCase() !== key) continue;

    const poly = parsePolygonCoords(area.polygon_coordinates);
    if (poly?.length) {
      poly.forEach(([lat, lng]) => points.push([lat, lng]));
      continue;
    }

    const lat = Number(area.latitude);
    const lng = Number(area.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push([lat, lng]);
      const rKm = Number(area.radius_km) || 1;
      const dLat = rKm / 111;
      const dLng = rKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
      points.push([lat + dLat, lng], [lat - dLat, lng], [lat, lng + dLng], [lat, lng - dLng]);
    }
  }

  return points;
}

export async function resolveGeographyMapFlyTo(
  names: GeographyNames,
  existingAreas: AreaPoint[] = [],
): Promise<MapFlyTo | null> {
  const { countryName, stateName, cityName } = names;

  if (cityName?.trim()) {
    const areaPoints = collectAreaBoundsPoints(existingAreas, cityName);
    if (areaPoints.length >= 2) {
      return { type: "bounds", points: areaPoints, padding: 56 };
    }
  }

  let query = "";
  let zoom = 5;

  if (cityName?.trim()) {
    query = [cityName, stateName, countryName].filter(Boolean).join(", ");
    zoom = 12;
  } else if (stateName?.trim()) {
    query = [stateName, countryName].filter(Boolean).join(", ");
    zoom = 8;
  } else if (countryName?.trim()) {
    query = countryName.trim();
    zoom = 5;
  } else {
    return null;
  }

  const hits = await searchPlaces(query, { limit: 5, existingAreas: [] });
  if (!hits.length) return null;

  for (const hit of hits) {
    const coords = await getPlacePosition(hit.place_id, { lat: hit.lat, lon: hit.lon });
    if (coords) {
      return { type: "point", lat: coords.lat, lng: coords.lng, zoom };
    }
  }

  return null;
}
