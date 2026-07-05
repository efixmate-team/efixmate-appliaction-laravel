/**
 * Shared utilities for programmatic SEO pages.
 * Fetches sitemap data and resolves city/service/area slugs to real records.
 */

import { cache } from "react";

// ── slug helper (must match sitemap.ts exactly) ──────────────────────────────
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── types ────────────────────────────────────────────────────────────────────
export type SeoService = {
  service_id: number;
  service_name: string;
  category_name: string | null;
  slug: string;
};
export type SeoCity = {
  city_id: number;
  city_name: string;
  slug: string;
};
export type SeoArea = {
  area_id: number;
  area_name: string;
  city_id: number;
  city_name: string | null;
  slug: string;
};
export type SitemapData = {
  services: SeoService[];
  cities: SeoCity[];
  areas: SeoArea[];
};

// ── API base ─────────────────────────────────────────────────────────────────
function apiBase(): string {
  const raw =
    process.env.INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5000";
  if (raw.startsWith("/")) return "http://localhost:5000";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

// ── Memoized sitemap data fetch (once per server request) ────────────────────
export const fetchSitemapData = cache(async function (): Promise<SitemapData> {
  const empty: SitemapData = { services: [], cities: [], areas: [] };
  try {
    const res = await fetch(`${apiBase()}/public/webapp/sitemap-data`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;
    const json = await res.json() as {
      status: boolean;
      services?: Array<{ service_id: number; service_name: string; category_name: string | null }>;
      cities?: Array<{ city_id: number; city_name: string }>;
      areas?: Array<{ area_id: number; area_name: string; city_id: number; city_name: string | null }>;
    };
    if (!json.status) return empty;

    // Build slug-disambiguated service list (same logic as sitemap.ts)
    const slugCount = new Map<string, number>();
    const services: SeoService[] = (json.services ?? []).map((s) => {
      const base = toSlug(s.service_name) || `service-${s.service_id}`;
      const count = slugCount.get(base) ?? 0;
      const slug = count === 0 ? base : `${base}-${count}`;
      slugCount.set(base, count + 1);
      return { ...s, slug };
    });

    const cities: SeoCity[] = (json.cities ?? []).map((c) => ({
      ...c,
      slug: toSlug(c.city_name) || `city-${c.city_id}`,
    }));

    const areas: SeoArea[] = (json.areas ?? []).map((a) => ({
      ...a,
      slug: toSlug(a.area_name) || `area-${a.area_id}`,
    }));

    return { services, cities, areas };
  } catch {
    return empty;
  }
});

// ── Lookup helpers ───────────────────────────────────────────────────────────
export function findCityBySlug(data: SitemapData, slug: string): SeoCity | null {
  return data.cities.find((c) => c.slug === slug) ?? null;
}
export function findServiceBySlug(data: SitemapData, slug: string): SeoService | null {
  return data.services.find((s) => s.slug === slug) ?? null;
}
export function findAreaBySlug(data: SitemapData, slug: string): SeoArea | null {
  return data.areas.find((a) => a.slug === slug) ?? null;
}
export function areasForCity(data: SitemapData, cityId: number): SeoArea[] {
  return data.areas.filter((a) => a.city_id === cityId);
}
export function relatedServices(data: SitemapData, service: SeoService, limit = 6): SeoService[] {
  return data.services
    .filter((s) => s.service_id !== service.service_id && s.category_name === service.category_name)
    .slice(0, limit);
}

// ── Full service detail (for price / description) ────────────────────────────
export type ServiceDetail = {
  service_id: number;
  service?: string;
  title?: string;
  description?: string;
  base_price?: number;
  price?: number;
  rating?: number;
  rating_count?: number;
  category_name?: string;
  duration_minutes?: number;
  image_url?: string | null;
};

export const fetchServiceDetail = cache(async function (serviceId: number): Promise<ServiceDetail | null> {
  try {
    const res = await fetch(`${apiBase()}/user/services/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: serviceId }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json() as { status: boolean; data?: ServiceDetail; result?: ServiceDetail };
    return json.data ?? json.result ?? null;
  } catch {
    return null;
  }
});
