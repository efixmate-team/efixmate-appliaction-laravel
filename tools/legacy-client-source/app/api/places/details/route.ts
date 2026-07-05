import { placeDetailsGET } from "@/lib/places/placeDetails";

/** @deprecated Prefer /geo/places/details */
export async function GET(req: Parameters<typeof placeDetailsGET>[0]) {
  return placeDetailsGET(req);
}
