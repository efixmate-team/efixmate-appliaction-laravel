import { BadgeIndianRupee, CircleDot, GitMerge, Layers, Package, Search } from "lucide-react";
import { resolveServiceImageUrl } from "@/lib/serviceImage";

export type CatalogBookingType = { id: number; name: string };
export type CatalogUnit = {
  unit_id: number;
  name: string;
  type?: string;
  price_per_unit?: number | null;
};

export type CatalogService = {
  service_id: number;
  title: string;
  image?: string | null;
  price: number;
  base_price?: number;
  duration_minutes?: number | null;
  rating?: number;
  booking_types?: CatalogBookingType[];
  units?: CatalogUnit[];
  category_id?: number;
};

const BOOKING_TYPE_META: Record<
  string,
  { icon: typeof CircleDot; title: string; description: string }
> = {
  unit: {
    icon: Layers,
    title: "Unit Base",
    description: "Per item / property size pricing",
  },
  fixed: {
    icon: BadgeIndianRupee,
    title: "Fixed",
    description: "Flat fixed price for the service",
  },
  package: {
    icon: Package,
    title: "Package",
    description: "Predefined bundled service",
  },
  inspection: {
    icon: Search,
    title: "Inspection",
    description: "Technician visits first, then quotes",
  },
  hybrid: {
    icon: GitMerge,
    title: "Hybrid",
    description: "Inspection + partial predefined pricing",
  },
};

export function bookingTypeMeta(name: string) {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, meta] of Object.entries(BOOKING_TYPE_META)) {
    if (key.includes(k)) return meta;
  }
  return {
    icon: CircleDot,
    title: name,
    description: "Select how this service is priced",
  };
}

export function resolveUnitPrice(
  basePrice: number,
  unit: CatalogUnit | undefined,
  qty: number
): number {
  if (unit?.price_per_unit != null && Number.isFinite(Number(unit.price_per_unit))) {
    return Number(unit.price_per_unit) * qty;
  }
  return basePrice * qty;
}

export function normalizeCatalogService(row: unknown): CatalogService | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const service_id = Number(r.service_id ?? r.id);
  const title = String(r.title ?? r.service ?? "").trim();
  if (!Number.isFinite(service_id) || !title) return null;

  const price = Number(r.price ?? r.base_price ?? 0);
  const booking_types = Array.isArray(r.booking_types)
    ? (r.booking_types as CatalogBookingType[]).filter((bt) => bt?.id && bt?.name)
    : [];
  const units = Array.isArray(r.units)
    ? (r.units as CatalogUnit[]).filter((u) => u?.unit_id && u?.name)
    : [];

  return {
    service_id,
    title,
    image: resolveServiceImageUrl(
      (r.image_url as string) ?? (r.service_icon as string) ?? (r.image as string),
    ),
    price: Number.isFinite(price) ? price : 0,
    base_price: Number(r.base_price ?? price) || 0,
    duration_minutes:
      typeof r.duration_minutes === "number"
        ? r.duration_minutes
        : null,
    rating: Number(r.rating ?? 0) || undefined,
    booking_types,
    units,
    category_id: r.category_id != null ? Number(r.category_id) : undefined,
  };
}
