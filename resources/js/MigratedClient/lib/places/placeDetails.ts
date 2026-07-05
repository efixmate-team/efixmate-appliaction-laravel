import { NextRequest, NextResponse } from "next/server";

function apiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function coordsFromPrefixedId(placeId: string): { lat: number; lng: number } | null {
  const m = placeId.match(/^(?:nominatim|geocode|photon):(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function resolvePlaceCoords(placeId: string): Promise<{ lat: number; lng: number } | null> {
  const fromPrefix = coordsFromPrefixedId(placeId);
  if (fromPrefix) return fromPrefix;

  const key = apiKey();
  if (!key) return null;

  const id = placeId.replace(/^places\//, "");
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "location",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    location?: { latitude?: number; longitude?: number };
  };

  const { latitude, longitude } = data.location ?? {};
  if (latitude == null || longitude == null) return null;
  return { lat: latitude, lng: longitude };
}

export async function placeDetailsGET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const coords = await resolvePlaceCoords(placeId);
  if (!coords) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  return NextResponse.json(coords);
}
