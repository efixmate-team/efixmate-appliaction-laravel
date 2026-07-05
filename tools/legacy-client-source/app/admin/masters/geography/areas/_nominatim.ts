export type PolygonCoords = [number, number][];

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const HEADERS: HeadersInit = {
  "Accept-Language": "en",
  "User-Agent": "EfixMate-Admin/1.0 (internal service-area tool)",
};

/** Prefer smaller administrative / locality areas over city/state. */
const LOCALITY_ADDRESS_KEYS = [
  "neighbourhood",
  "suburb",
  "city_district",
  "quarter",
  "borough",
  "hamlet",
  "village",
  "town",
] as const;

const BOUNDARY_TYPES = new Set([
  "administrative",
  "suburb",
  "neighbourhood",
  "quarter",
  "city_district",
  "residential",
  "boundary",
]);

export type NominatimAddress = Partial<Record<string, string>>;

export type LocalityInfo = {
  name: string;
  city?: string;
  state?: string;
};

export type LocalityBoundaryResult = {
  name: string;
  polygon: PolygonCoords;
  displayName: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastNominatimSearchAt = 0;

async function throttleNominatimSearch() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimSearchAt));
  if (wait > 0) await delay(wait);
  lastNominatimSearchAt = Date.now();
}

async function nominatimGet<T>(path: string): Promise<T> {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  return res.json() as Promise<T>;
}

/** Extract locality (e.g. Shankar Nagar) from Nominatim address parts or display name. */
export function extractLocality(
  address: NominatimAddress | undefined,
  displayName: string
): LocalityInfo | null {
  if (address) {
    for (const key of LOCALITY_ADDRESS_KEYS) {
      const name = address[key];
      if (name?.trim()) {
        return {
          name: name.trim(),
          city: (address.city || address.town || address.municipality)?.trim(),
          state: (address.state || address["ISO3166-2-lvl4"])?.trim(),
        };
      }
    }
  }

  const parts = displayName.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      name: parts[1],
      city: parts[2],
      state: parts.length > 3 ? parts[parts.length - 2] : undefined,
    };
  }
  if (parts.length === 2) {
    return { name: parts[0], city: parts[1] };
  }

  return null;
}

/** GeoJSON coordinates are [lng, lat]; we need [lat, lng]. */
function ringToLatLng(ring: number[][]): PolygonCoords {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function polygonFromGeoJson(geojson: { type?: string; coordinates?: unknown }): PolygonCoords | null {
  if (!geojson?.type || !geojson.coordinates) return null;

  if (geojson.type === "Polygon") {
    const rings = geojson.coordinates as number[][][];
    if (!rings?.[0]?.length || rings[0].length < 3) return null;
    return ringToLatLng(rings[0]);
  }

  if (geojson.type === "MultiPolygon") {
    const polys = geojson.coordinates as number[][][][];
    if (!polys?.length) return null;
    let best: number[][] | null = null;
    for (const poly of polys) {
      const ring = poly?.[0];
      if (ring && (!best || ring.length > best.length)) best = ring;
    }
    if (!best || best.length < 3) return null;
    return ringToLatLng(best);
  }

  return null;
}

type SearchHit = {
  display_name: string;
  geojson?: { type?: string; coordinates?: unknown };
  type?: string;
  class?: string;
  importance?: number;
};

function scoreBoundaryHit(hit: SearchHit, localityName: string): number {
  let score = 0;
  const geo = hit.geojson;
  if (geo && (geo.type === "Polygon" || geo.type === "MultiPolygon")) score += 50;

  const nameLower = localityName.toLowerCase();
  const displayLower = (hit.display_name || "").toLowerCase();
  if (displayLower.startsWith(nameLower)) score += 20;
  if (displayLower.includes(nameLower)) score += 10;

  if (hit.type && BOUNDARY_TYPES.has(hit.type)) score += 15;
  if (hit.class === "boundary") score += 12;
  if (hit.importance) score += Math.min(hit.importance * 5, 10);

  return score;
}

/** Search OSM for a locality polygon (e.g. Shankar Nagar, Raipur). */
export async function fetchLocalityBoundary(
  locality: LocalityInfo
): Promise<LocalityBoundaryResult | null> {
  const queries = [
    [locality.name, locality.city, locality.state, "India"].filter(Boolean).join(", "),
    [locality.name, locality.city, "India"].filter(Boolean).join(", "),
    [locality.name, "India"].filter(Boolean).join(", "),
  ];

  for (const q of queries) {
    const hits = await nominatimGet<SearchHit[]>(
      `/search?q=${encodeURIComponent(q)}&format=json&limit=8&countrycodes=in&polygon_geojson=1`
    );

    const ranked = (hits || [])
      .map((hit) => ({ hit, score: scoreBoundaryHit(hit, locality.name) }))
      .filter(({ hit, score }) => score >= 50 && hit.geojson)
      .sort((a, b) => b.score - a.score);

    for (const { hit } of ranked) {
      const polygon = polygonFromGeoJson(hit.geojson!);
      if (polygon && polygon.length >= 3) {
        return {
          name: locality.name,
          polygon,
          displayName: hit.display_name,
        };
      }
    }

    await delay(1100);
  }

  return null;
}

type NominatimSearchRow = {
  lat: string;
  lon: string;
  display_name: string;
};

/** Place search for area picker (used when Google Places API New is unavailable). */
export async function searchPlacesNominatim(
  query: string,
  limit = 12
): Promise<Array<{ place_id: string; display_name: string; lat: string; lon: string }>> {
  const q = query.trim();
  if (q.length < 2) return [];

  const runQuery = async (searchQ: string) => {
    await throttleNominatimSearch();
    return nominatimGet<NominatimSearchRow[]>(
      `/search?q=${encodeURIComponent(searchQ)}&format=json&limit=${limit}&countrycodes=in`
    );
  };

  let hits = await runQuery(q);

  if (!hits?.length && !/\bindia\b/i.test(q)) {
    hits = await runQuery(`${q}, India`);
  }
  if (!hits?.length && !/\braipur\b/i.test(q)) {
    hits = await runQuery(`${q}, Raipur, Chhattisgarh, India`);
  }

  return (hits || []).map((h) => ({
    place_id: `nominatim:${h.lat},${h.lon}`,
    display_name: h.display_name,
    lat: h.lat,
    lon: h.lon,
  }));
}

export async function reverseGeocodeLocality(
  lat: number,
  lng: number
): Promise<LocalityInfo | null> {
  const data = await nominatimGet<{
    display_name?: string;
    address?: NominatimAddress;
  }>(
    `/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
  );

  if (!data?.display_name) return null;
  return extractLocality(data.address, data.display_name);
}

export async function resolveLocalityBoundary(
  lat: number,
  lng: number,
  address: NominatimAddress | undefined,
  displayName: string
): Promise<LocalityBoundaryResult | null> {
  let locality = extractLocality(address, displayName);

  if (!locality) {
    await delay(1100);
    locality = await reverseGeocodeLocality(lat, lng);
  }

  if (!locality) return null;

  await delay(1100);
  return fetchLocalityBoundary(locality);
}
