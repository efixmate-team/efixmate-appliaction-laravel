import { MetadataRoute } from "next";

export const revalidate = 86400; // re-generate sitemap once per day

const BASE = "https://efixmate.com";

// --- internal server-to-server URL (Docker network or localhost in dev) ------
function backendUrl(): string {
  const raw = process.env.BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

// --- slug helper -------------------------------------------------------------
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// --- API types ---------------------------------------------------------------
type SitemapService = { service_id: number; service_name: string; category_name: string | null };
type SitemapCity    = { city_id: number; city_name: string };
type SitemapArea    = { area_id: number; area_name: string; city_id: number; city_name: string | null };

type SitemapDataResponse = {
  status: boolean;
  services?: SitemapService[];
  cities?: SitemapCity[];
  areas?: SitemapArea[];
};

async function fetchSitemapData(): Promise<{ services: SitemapService[]; cities: SitemapCity[]; areas: SitemapArea[] }> {
  const empty = { services: [], cities: [], areas: [] };
  try {
    const res = await fetch(`${backendUrl()}/public/webapp/sitemap-data`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;
    const data: SitemapDataResponse = await res.json();
    return {
      services: data.services ?? [],
      cities:   data.cities   ?? [],
      areas:    data.areas    ?? [],
    };
  } catch {
    return empty;
  }
}

// --- static pages ------------------------------------------------------------
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE,                                       priority: 1.0, changeFrequency: "daily"   },
  { url: `${BASE}/services`,                         priority: 0.9, changeFrequency: "weekly"  },
  { url: `${BASE}/services-in`,                      priority: 0.8, changeFrequency: "weekly"  },
  { url: `${BASE}/offers`,                           priority: 0.8, changeFrequency: "daily"   },
  { url: `${BASE}/about-us`,                         priority: 0.7, changeFrequency: "monthly" },
  { url: `${BASE}/contact-us`,                       priority: 0.7, changeFrequency: "monthly" },
  { url: `${BASE}/privacy-policy`,                   priority: 0.3, changeFrequency: "yearly"  },
  { url: `${BASE}/terms-and-conditions`,             priority: 0.3, changeFrequency: "yearly"  },
  { url: `${BASE}/refund-policy`,                    priority: 0.3, changeFrequency: "yearly"  },
  { url: `${BASE}/cancellation-policy`,              priority: 0.3, changeFrequency: "yearly"  },
  { url: `${BASE}/service-partner-agreement`,        priority: 0.3, changeFrequency: "yearly"  },
];

// --- sitemap -----------------------------------------------------------------
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, cities, areas } = await fetchSitemapData();

  const now = new Date();
  const stamp = (entry: Omit<MetadataRoute.Sitemap[number], "lastModified">) =>
    ({ ...entry, lastModified: now } as MetadataRoute.Sitemap[number]);

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(stamp);

  if (!services.length && !cities.length) {
    return entries;
  }

  // Deduplicated slug maps ─ two services with the same slug get a numeric suffix
  const serviceSlugMap = new Map<number, string>();
  const slugCount = new Map<string, number>();
  for (const s of services) {
    const base = toSlug(s.service_name) || `service-${s.service_id}`;
    const count = slugCount.get(base) ?? 0;
    const slug  = count === 0 ? base : `${base}-${count}`;
    slugCount.set(base, count + 1);
    serviceSlugMap.set(s.service_id, slug);
  }

  // city-id → slug map
  const citySlugMap = new Map<number, string>();
  for (const c of cities) {
    citySlugMap.set(c.city_id, toSlug(c.city_name) || `city-${c.city_id}`);
  }

  // area-id → slug map
  const areaSlugMap = new Map<number, string>();
  for (const a of areas) {
    areaSlugMap.set(a.area_id, toSlug(a.area_name) || `area-${a.area_id}`);
  }

  // ── 1. Service-level pages (no geo) ────────────────────────────────────────
  //    /services-in/all/{service-slug}
  for (const s of services) {
    const sSlug = serviceSlugMap.get(s.service_id)!;
    entries.push(stamp({
      url: `${BASE}/services-in/all/${sSlug}`,
      priority: 0.7,
      changeFrequency: "weekly",
    }));
  }

  // ── 2. City pages ──────────────────────────────────────────────────────────
  //    /services-in/{city}
  for (const city of cities) {
    const cSlug = citySlugMap.get(city.city_id)!;
    entries.push(stamp({
      url: `${BASE}/services-in/${cSlug}`,
      priority: 0.8,
      changeFrequency: "weekly",
    }));

    // ── 3. City × service ────────────────────────────────────────────────────
    //    /services-in/{city}/{service-slug}
    for (const s of services) {
      const sSlug = serviceSlugMap.get(s.service_id)!;
      entries.push(stamp({
        url: `${BASE}/services-in/${cSlug}/${sSlug}`,
        priority: 0.9,
        changeFrequency: "weekly",
      }));
    }
  }

  // ── 4. Area × service ──────────────────────────────────────────────────────
  //    /services-in/{city}/{area}/{service-slug}
  const areasByCityId = new Map<number, SitemapArea[]>();
  for (const a of areas) {
    const list = areasByCityId.get(a.city_id) ?? [];
    list.push(a);
    areasByCityId.set(a.city_id, list);
  }

  for (const city of cities) {
    const cSlug    = citySlugMap.get(city.city_id)!;
    const cityAreas = areasByCityId.get(city.city_id) ?? [];
    for (const area of cityAreas) {
      const aSlug = areaSlugMap.get(area.area_id)!;

      // Area hub page
      entries.push(stamp({
        url: `${BASE}/services-in/${cSlug}/${aSlug}`,
        priority: 0.75,
        changeFrequency: "weekly",
      }));

      // Area × service combos (highest intent — "AC repair in Koramangala")
      for (const s of services) {
        const sSlug = serviceSlugMap.get(s.service_id)!;
        entries.push(stamp({
          url: `${BASE}/services-in/${cSlug}/${aSlug}/${sSlug}`,
          priority: 0.85,
          changeFrequency: "weekly",
        }));
      }
    }
  }

  return entries;
}
