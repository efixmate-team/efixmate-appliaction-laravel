import { NextRequest, NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/places/searchProviders";

export type { PlaceSearchResult } from "@/lib/places/searchProviders";

/** @deprecated Prefer /geo/places/search — kept for backwards compatibility. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "12", 10) || 12, 1),
    20
  );

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchAllProviders(q, limit);
  return NextResponse.json(results);
}
