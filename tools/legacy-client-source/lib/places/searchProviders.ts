/** Server-side place search providers (used by /geo/places/search route). */

export type PlaceSearchResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

function apiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function dedupe(items: PlaceSearchResult[]): PlaceSearchResult[] {
  const seen = new Set<string>();
  const out: PlaceSearchResult[] = [];
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

function withIndiaHints(query: string): string[] {
  const q = query.trim();
  const variants = [q];
  if (!/\bindia\b/i.test(q)) variants.push(`${q}, India`);
  if (!/\braipur\b/i.test(q) && q.length < 40) {
    variants.push(`${q}, Raipur, Chhattisgarh, India`);
  }
  return variants;
}

/** Fast OSM geocoder — no API key required. */
export async function photonSearch(
  query: string,
  limit: number
): Promise<PlaceSearchResult[]> {
  const collected: PlaceSearchResult[] = [];

  for (const q of withIndiaHints(query)) {
    if (collected.length >= limit) break;
    try {
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", q);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("lang", "en");

      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) continue;

      const data = (await res.json()) as {
        features?: Array<{
          geometry: { coordinates: [number, number] };
          properties: Record<string, string | undefined>;
        }>;
      };

      for (const f of data.features ?? []) {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        const labelParts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
        const display_name = labelParts.join(", ") || q;
        collected.push({
          place_id: `photon:${lat},${lng}`,
          display_name,
          lat: String(lat),
          lon: String(lng),
        });
        if (collected.length >= limit) break;
      }
      if (collected.length > 0) break;
    } catch {
      /* try next variant */
    }
  }

  return collected;
}

export async function nominatimSearch(
  query: string,
  limit: number
): Promise<PlaceSearchResult[]> {
  const run = async (q: string) => {
    const url = `${NOMINATIM}/search?${new URLSearchParams({
      q,
      format: "json",
      limit: String(limit),
      countrycodes: "in",
      addressdetails: "1",
    })}`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "EfixMate/1.0 (place-search; contact@efixmate.com)",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const hits = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    return (hits || []).map((h) => ({
      place_id: `nominatim:${h.lat},${h.lon}`,
      display_name: h.display_name,
      lat: h.lat,
      lon: h.lon,
    }));
  };

  for (const q of withIndiaHints(query)) {
    const results = await run(q);
    if (results.length > 0) return results;
  }
  return [];
}

export async function googleGeocode(
  query: string,
  limit: number
): Promise<PlaceSearchResult[]> {
  const key = apiKey();
  if (!key) return [];

  const tryAddress = async (address: string) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("components", "country:IN");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };

    if (data.status !== "OK" || !data.results?.length) return [];

    return data.results.slice(0, limit).map((r) => {
      const { lat, lng } = r.geometry.location;
      return {
        place_id: `geocode:${lat},${lng}`,
        display_name: r.formatted_address,
        lat: String(lat),
        lon: String(lng),
      };
    });
  };

  for (const q of withIndiaHints(query)) {
    const results = await tryAddress(q);
    if (results.length > 0) return results;
  }
  return [];
}

export async function googlePlacesAutocomplete(
  query: string,
  limit: number
): Promise<PlaceSearchResult[]> {
  const key = apiKey();
  if (!key) return [];

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ["in"],
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: { placeId?: string; text?: { text?: string } };
      }>;
    };

    return (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text: { text: string } } =>
        Boolean(p?.placeId && p?.text?.text)
      )
      .slice(0, limit)
      .map((p) => ({
        place_id: p.placeId,
        display_name: p.text.text,
        lat: "",
        lon: "",
      }));
  } catch {
    return [];
  }
}

/** OSM first (always works without Google billing), then Google when enabled. */
export async function searchAllProviders(
  query: string,
  limit: number
): Promise<PlaceSearchResult[]> {
  const collected: PlaceSearchResult[] = [];

  const [photon, osm, geocoded, autocomplete] = await Promise.allSettled([
    photonSearch(query, limit),
    nominatimSearch(query, limit),
    googleGeocode(query, limit),
    googlePlacesAutocomplete(query, limit),
  ]);

  if (photon.status === "fulfilled") collected.push(...photon.value);
  if (osm.status === "fulfilled") collected.push(...osm.value);
  if (geocoded.status === "fulfilled") collected.push(...geocoded.value);
  if (autocomplete.status === "fulfilled") collected.push(...autocomplete.value);

  return dedupe(collected).slice(0, limit);
}
