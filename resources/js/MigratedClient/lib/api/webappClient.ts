/**
 * Webapp-specific API client — public endpoints for popular services and search
 * (no location filter), plus an authenticated cart serviceability check.
 */

import { BASE_URL } from "./coreClient";
import { resolveServiceImageUrl } from "@/lib/serviceImage";
import type { CatalogService } from "@/components/booking/bookingTypes";

async function publicGet<T = unknown>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, { method: "GET" });
  const json = await res.json().catch(() => ({ status: false }));
  return json as T;
}

async function authGet<T = unknown>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, { method: "GET", credentials: "include" });
  const json = await res.json().catch(() => ({ status: false }));
  return json as T;
}

type ServiceListResponse = {
  status: boolean;
  result?: RawService[];
  data?: RawService[] | { services?: RawService[]; result?: RawService[] };
  message?: string;
};

type RawService = {
  service_id: number;
  title?: string;
  service?: string;
  image?: string | null;
  image_url?: string | null;
  service_icon?: string | null;
  price?: number;
  base_price?: number;
  rating?: number;
  category_id?: number | null;
  booking_types?: { id: number; name: string }[];
  units?: { unit_id: number; name: string; type?: string }[];
};

function extractServiceRows(raw: ServiceListResponse): RawService[] {
  if (Array.isArray(raw.result)) return raw.result;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && typeof raw.data === "object") {
    if (Array.isArray(raw.data.services)) return raw.data.services;
    if (Array.isArray(raw.data.result)) return raw.data.result;
  }
  return [];
}

function parseServiceList(raw: RawService[]): CatalogService[] {
  return (raw ?? []).filter((r) => r?.service_id).map((r) => ({
    service_id: Number(r.service_id),
    title: r.title ?? r.service ?? "",
    image: resolveServiceImageUrl(r.image ?? r.image_url ?? r.service_icon ?? null),
    price: Number(r.price ?? r.base_price ?? 0),
    rating: Number(r.rating ?? 0),
    category_id: r.category_id ? Number(r.category_id) : undefined,
    booking_types: (r.booking_types ?? []).map((bt) => ({ id: bt.id, name: bt.name })),
    units: (r.units ?? []).map((u) => ({
      unit_id: u.unit_id,
      name: u.name,
      type: u.type ?? "",
    })),
  }));
}

export type CatalogCategory = {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string | null;
  category_route: string | null;
  description: string;
  order_seq: number;
};

export type PublicCatalog = {
  categories: CatalogCategory[];
  services: CatalogService[];
};

/** GET /public/webapp/catalog — all active categories + services, no city/area filter */
export async function getWebappCatalog(): Promise<PublicCatalog> {
  const res = await publicGet<{ status: boolean; categories?: CatalogCategory[]; services?: RawService[] }>('/public/webapp/catalog');
  return {
    categories: res.categories ?? [],
    services: parseServiceList(res.services ?? []),
  };
}

/** GET /public/webapp/emergency-services — services with is_emergency=true */
export async function getWebappEmergencyServices(): Promise<CatalogService[]> {
  const res = await publicGet<ServiceListResponse>('/public/webapp/emergency-services');
  return parseServiceList(extractServiceRows(res));
}

/** GET /public/webapp/popular-services?limit=N&category_id=X — no auth, no location filter */
export async function getWebappPopularServices(limit = 12, categoryId?: number): Promise<CatalogService[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (categoryId) params.set("category_id", String(categoryId));
  const res = await publicGet<ServiceListResponse>(`/public/webapp/popular-services?${params}`);
  return parseServiceList(extractServiceRows(res));
}

/** GET /public/webapp/search-services?q=...&limit=N — no auth, no location filter */
export async function searchWebappServices(
  q: string,
  limit = 10
): Promise<CatalogService[]> {
  if (!q.trim()) return [];
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  const res = await publicGet<ServiceListResponse>(
    `/public/webapp/search-services?${params}`
  );
  return parseServiceList(extractServiceRows(res));
}

export type WebappSearchCategory = {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_route: string | null;
};

export type WebappSearchResult = {
  categories: WebappSearchCategory[];
  services: CatalogService[];
};

type SearchResponse = {
  status: boolean;
  categories?: WebappSearchCategory[];
  services?: RawService[];
  message?: string;
};

/**
 * GET /public/webapp/search?q=...&limit=N
 * Unified search returning both matching categories and services in one call.
 */
export async function searchWebapp(
  q: string,
  limit = 12
): Promise<WebappSearchResult> {
  if (!q.trim()) return { categories: [], services: [] };
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  const res = await publicGet<SearchResponse>(`/public/webapp/search?${params}`);
  return {
    categories: res.categories ?? [],
    services: parseServiceList(res.services ?? []),
  };
}

export type QuickGridItem = {
  label: string;
  match: string[];
};

export type QuickGrid = {
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  items: QuickGridItem[];
};

/** GET /public/webapp/quick-grids — quick home grid config from DB */
export async function getWebappQuickGrids(): Promise<QuickGrid[]> {
  const res = await publicGet<{ status: boolean; result?: QuickGrid[] }>("/public/webapp/quick-grids");
  return res.result ?? [];
}

export type ServiceAvailability = {
  service_id: number;
  is_available: boolean;
};

/** GET /user/booking/cart/lines-availability — auth required */
export async function checkCartLinesAvailability(): Promise<ServiceAvailability[]> {
  const res = await authGet<{ status: boolean; result?: ServiceAvailability[] }>(
    `/user/booking/cart/lines-availability`
  );
  return res.result ?? [];
}
