import { placeDetailsGET } from "@/lib/places/placeDetails";

export async function GET(req: Parameters<typeof placeDetailsGET>[0]) {
  return placeDetailsGET(req);
}
