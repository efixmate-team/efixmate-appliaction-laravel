/** Google Places API (New) — REST client (replaces legacy JS Places Autocomplete / Geocoder). */

const PLACES_BASE = "https://places.googleapis.com/v1";

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}

let sessionToken: string | null = null;
let placesNewBlocked = false;
let placesNewBlockedLogged = false;

/** True after Google returns 403 API_KEY_SERVICE_BLOCKED for Places API (New). */
export function isPlacesNewBlocked(): boolean {
  return placesNewBlocked;
}

export function resetPlacesSession(): void {
  sessionToken = null;
}

function ensureSessionToken(): string {
  if (!sessionToken) {
    sessionToken =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return sessionToken;
}

export type AutocompleteSuggestion = {
  placeId: string;
  text: string;
};

export async function autocompletePlacesNew(
  input: string,
  options?: { regionCodes?: string[]; limit?: number }
): Promise<AutocompleteSuggestion[]> {
  const key = getGoogleMapsApiKey();
  if (!key) {
    console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
    return [];
  }

  const q = input.trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: options?.regionCodes ?? ["in"],
        sessionToken: ensureSessionToken(),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 403) {
        placesNewBlocked = true;
        if (!placesNewBlockedLogged) {
          placesNewBlockedLogged = true;
          console.warn(
            "Google Places API (New) is blocked for this API key (enable it in Google Cloud Console). " +
              "Using OpenStreetMap search as fallback."
          );
        }
      } else {
        console.error("Places autocomplete (New) failed:", res.status, body);
      }
      return [];
    }

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
      .slice(0, options?.limit ?? 12)
      .map((p) => ({ placeId: p.placeId, text: p.text.text }));
  } catch (err) {
    console.error("Places autocomplete (New) error:", err);
    return [];
  }
}

/** Forward geocode via Geocoding API (works when Places API New is blocked). */
export async function forwardGeocodeSearch(
  query: string,
  limit = 12
): Promise<Array<{ placeId: string; text: string; lat: number; lng: number }>> {
  const key = getGoogleMapsApiKey();
  if (!key) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const tryGeocode = async (address: string) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("components", "country:IN");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
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
        placeId: `geocode:${lat},${lng}`,
        text: r.formatted_address,
        lat,
        lng,
      };
    });
  };

  try {
    let results = await tryGeocode(q);
    if (results.length > 0) return results;

    if (!/\bindia\b/i.test(q)) {
      results = await tryGeocode(`${q}, India`);
      if (results.length > 0) return results;
    }

    if (!/\braipur\b/i.test(q)) {
      results = await tryGeocode(`${q}, Raipur, Chhattisgarh, India`);
    }
    return results;
  } catch (err) {
    console.error("Geocoding search error:", err);
    return [];
  }
}

export async function getPlaceLocationNew(
  placeId: string
): Promise<{ lat: number; lng: number } | null> {
  const key = getGoogleMapsApiKey();
  if (!key) return null;

  const id = placeId.replace(/^places\//, "");
  const token = ensureSessionToken();
  const url = new URL(`${PLACES_BASE}/places/${encodeURIComponent(id)}`);
  url.searchParams.set("sessionToken", token);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "location",
      },
    });

    resetPlacesSession();

    if (!res.ok) {
      console.error("Place details (New) failed:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      location?: { latitude?: number; longitude?: number };
    };

    const { latitude, longitude } = data.location ?? {};
    if (latitude == null || longitude == null) return null;
    return { lat: latitude, lng: longitude };
  } catch (err) {
    console.error("Place details (New) error:", err);
    resetPlacesSession();
    return null;
  }
}

export type ReverseGeocodeResult = {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

/** Standard Geocoding API (REST) — not the legacy Places JS SDK. */
export async function reverseGeocodeNew(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const key = getGoogleMapsApiKey();
  if (!key) return { street: "", city: "", state: "", country: "", pincode: "" };

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    if (!res.ok) return { street: "", city: "", state: "", country: "", pincode: "" };

    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{ long_name: string; types: string[] }>;
      }>;
    };

    if (data.status !== "OK" || !data.results?.[0]?.address_components) {
      return { street: "", city: "", state: "", country: "", pincode: "" };
    }

    const comps = data.results[0].address_components;
    const get = (...types: string[]) =>
      comps.find((c) => c.types.some((t) => types.includes(t)))?.long_name ?? "";

    const street = [get("route"), get("sublocality_level_2", "sublocality_level_1", "neighborhood", "sublocality")]
      .filter(Boolean)
      .join(", ");
    const city =
      get("locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2") ||
      get("administrative_area_level_2");
    const state = get("administrative_area_level_1");
    const country = get("country");
    const pincode = get("postal_code");

    if (!city && !state && data.results[0].formatted_address) {
      const parts = data.results[0].formatted_address.split(",").map((p) => p.trim()).filter(Boolean);
      const withoutCountry = parts.filter((p) => !/^india$/i.test(p));
      const derivedCity = withoutCountry.length >= 2 ? withoutCountry[withoutCountry.length - 2] : withoutCountry[0] ?? "";
      const derivedState = withoutCountry.length >= 1 ? withoutCountry[withoutCountry.length - 1].replace(/\d+/g, "").trim() : "";
      return {
        street: street || (withoutCountry[0] ?? ""),
        city: derivedCity,
        state: derivedState,
        country: country || "India",
        pincode,
      };
    }

    return { street, city, state, country, pincode };
  } catch {
    return { street: "", city: "", state: "", country: "", pincode: "" };
  }
}

const NOMINATIM_HEADERS: HeadersInit = {
  "Accept-Language": "en",
  "User-Agent": "EFixMate-Web/1.0 (location detection)",
};

/** OpenStreetMap reverse geocode — fallback when Google Geocoding fails or is blocked. */
export async function reverseGeocodeOsm(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "14");

    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!res.ok) return { street: "", city: "", state: "", country: "", pincode: "" };

    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    const addr = data.address ?? {};
    const area =
      addr.neighbourhood ||
      addr.suburb ||
      addr.city_district ||
      addr.quarter ||
      addr.residential ||
      "";
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      addr.state_district ||
      "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";

    if (!city && !state && data.display_name) {
      const parts = data.display_name.split(",").map((p) => p.trim()).filter(Boolean);
      const withoutCountry = parts.filter((p) => !/^india$/i.test(p));
      return {
        street: area || withoutCountry[0] || "",
        city: withoutCountry.length >= 2 ? withoutCountry[withoutCountry.length - 2] : withoutCountry[0] || "",
        state: withoutCountry.length >= 1 ? withoutCountry[withoutCountry.length - 1].replace(/\d+/g, "").trim() : "",
        country: addr.country || "India",
        pincode,
      };
    }

    return {
      street: area,
      city,
      state,
      country: addr.country || "India",
      pincode,
    };
  } catch {
    return { street: "", city: "", state: "", country: "", pincode: "" };
  }
}
