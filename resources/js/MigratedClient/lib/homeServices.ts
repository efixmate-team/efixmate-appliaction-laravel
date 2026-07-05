/** Parse and map user service list API rows for the home screen. */

import { resolveServiceImageUrl } from "@/lib/serviceImage";

export type HomeBookingType = { id: number; name: string };
export type HomeUnit = {
  unit_id: number;
  name: string;
  type?: string;
  price_per_unit?: number | null;
};

export type HomeServiceItem = {
  service_id?: number;
  label: string;
  price: number;
  rating: number;
  reviews: number;
  time: string;
  badge: string | null;
  image: string | null;
  booking_types?: HomeBookingType[];
  units?: HomeUnit[];
  category_id?: number;
};

export type HomeServiceCollection = {
  title: string;
  category_id?: number;
  items: HomeServiceItem[];
};

export function formatServiceDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 hr";
  if (minutes % 60 === 0) return `${minutes / 60} hrs`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins >= 30 ? `${hrs + 0.5} hrs` : `${hrs} hr ${mins} min`;
}

export function parseServiceList(raw: unknown): HomeServiceItem[] {
  const rows = extractServiceRows(raw);
  const items: HomeServiceItem[] = [];
  for (const row of rows) {
    const mapped = mapApiServiceRow(row);
    if (mapped) items.push(mapped);
  }
  return items;
}

function extractServiceRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.result)) return o.result;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

export function mapApiServiceRow(row: unknown): HomeServiceItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const serviceId = r.service_id != null ? Number(r.service_id) : null;
  const label = String(r.title ?? r.service ?? "").trim();
  if (!label) return null;

  const price = Number(r.base_price ?? r.price ?? 0);
  const ratingRaw = Number(r.rating ?? r.rating_avg ?? 0);
  const durationRaw = r.duration_minutes ?? r.duration;
  const durationMinutes =
    typeof durationRaw === "number"
      ? durationRaw
      : typeof durationRaw === "string"
        ? parseInt(durationRaw.replace(/[^\d]/g, ""), 10) || null
        : null;

  const booking_types = Array.isArray(r.booking_types)
    ? (r.booking_types as HomeBookingType[]).filter((bt) => bt?.id && bt?.name)
    : undefined;
  const units = Array.isArray(r.units)
    ? (r.units as HomeUnit[]).filter((u) => u?.unit_id && u?.name)
    : undefined;

  return {
    ...(serviceId != null && Number.isFinite(serviceId) ? { service_id: serviceId } : {}),
    label,
    price: Number.isFinite(price) ? price : 0,
    rating: Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : 0,
    reviews: Number(r.review_count ?? r.reviews ?? 0) || 0,
    time: formatServiceDuration(durationMinutes),
    badge: null,
    image:
      resolveServiceImageUrl(
        (r.image_url as string) ?? (r.service_icon as string) ?? (r.image as string),
      ),
    ...(booking_types?.length ? { booking_types } : {}),
    ...(units?.length ? { units } : {}),
    ...(r.category_id != null ? { category_id: Number(r.category_id) } : {}),
  };
}

export type ServiceCategoryRow = {
  category_id: number;
  category_name: string;
};

export function parseServiceCategories(raw: unknown): ServiceCategoryRow[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const data = o.data;
  let rows: unknown[] = [];
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === "object" && Array.isArray((data as { categories?: unknown[] }).categories)) {
    rows = (data as { categories: unknown[] }).categories;
  } else if (Array.isArray(o.result)) {
    rows = o.result;
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const category_id = Number(r.category_id ?? r.id);
      const category_name = String(r.category_name ?? r.title ?? "").trim();
      if (!Number.isFinite(category_id) || !category_name) return null;
      return { category_id, category_name };
    })
    .filter((c): c is ServiceCategoryRow => c != null);
}

const SERVICE_ICON_IMAGE_BASE = "/services-icons/service";

const SERVICE_IMAGE = {
  ac: `${SERVICE_ICON_IMAGE_BASE}/AC.webp`,
  acGas: `${SERVICE_ICON_IMAGE_BASE}/AC GAS FILLING.webp`,
  cctv: `${SERVICE_ICON_IMAGE_BASE}/CCTV.webp`,
  cleaning: `${SERVICE_ICON_IMAGE_BASE}/DEEP CLEANING.webp`,
  doorLock: `${SERVICE_ICON_IMAGE_BASE}/DOOR LOCK.webp`,
  electrical: `${SERVICE_ICON_IMAGE_BASE}/ELECTRIC.webp`,
  fan: `${SERVICE_ICON_IMAGE_BASE}/FAN INSTALL.webp`,
  fridge: `${SERVICE_ICON_IMAGE_BASE}/FRIDGE REPAIR.webp`,
  geyser: `${SERVICE_ICON_IMAGE_BASE}/GEYSER INSTRALL.webp`,
  microwave: `${SERVICE_ICON_IMAGE_BASE}/MICROWAVE REPAIR.webp`,
  officeElectrical: `${SERVICE_ICON_IMAGE_BASE}/OFFICE ELECTRICAL.webp`,
  pest: `${SERVICE_ICON_IMAGE_BASE}/PEST CONTROL.webp`,
  pipeLeak: `${SERVICE_ICON_IMAGE_BASE}/PIP LEAKEZ FIX.webp`,
  switchRepair: `${SERVICE_ICON_IMAGE_BASE}/SWITCH REPAIR.webp`,
  tile: `${SERVICE_ICON_IMAGE_BASE}/TILE REPAIR.webp`,
  wallPutty: `${SERVICE_ICON_IMAGE_BASE}/WALL PUTTY.webp`,
  washingMachine: `${SERVICE_ICON_IMAGE_BASE}/WASHING MACHINE.webp`,
  waterPurifier: `${SERVICE_ICON_IMAGE_BASE}/WATER PURIFIER.webp`,
} as const;

/** Guest fallback when the user is not logged in or the API is unavailable. */
export const DEFAULT_POPULAR: HomeServiceItem[] = [
  { label: "Switch Repair", price: 149, rating: 4.9, reviews: 841, time: "60 min", badge: "Bestseller", image: SERVICE_IMAGE.switchRepair },
  { label: "AC Gas Filling", price: 399, rating: 4.8, reviews: 512, time: "90 min", badge: null, image: SERVICE_IMAGE.acGas },
  { label: "Geyser Install", price: 449, rating: 4.9, reviews: 334, time: "2 hrs", badge: "Fast", image: SERVICE_IMAGE.geyser },
  { label: "Pipe Leakage Fix", price: 249, rating: 4.7, reviews: 620, time: "1.5 hrs", badge: null, image: SERVICE_IMAGE.pipeLeak },
  { label: "Fan Installation", price: 129, rating: 4.8, reviews: 1200, time: "45 min", badge: "Popular", image: SERVICE_IMAGE.fan },
  { label: "Washing Machine", price: 299, rating: 4.7, reviews: 289, time: "2 hrs", badge: null, image: SERVICE_IMAGE.washingMachine },
];

export const DEFAULT_COLLECTIONS: HomeServiceCollection[] = [
  {
    title: "Appliance Services",
    items: [
      { label: "AC Service", price: 399, rating: 4.8, reviews: 1341, time: "2 hrs", badge: "Trending", image: SERVICE_IMAGE.ac },
      { label: "AC Gas Filling", price: 399, rating: 4.8, reviews: 512, time: "90 min", badge: null, image: SERVICE_IMAGE.acGas },
      { label: "Fridge Repair", price: 349, rating: 4.7, reviews: 512, time: "2 hrs", badge: null, image: SERVICE_IMAGE.fridge },
      { label: "Microwave Repair", price: 249, rating: 4.6, reviews: 219, time: "1 hr", badge: null, image: SERVICE_IMAGE.microwave },
      { label: "Washing Machine", price: 299, rating: 4.7, reviews: 388, time: "2 hrs", badge: null, image: SERVICE_IMAGE.washingMachine },
      { label: "Geyser Install", price: 449, rating: 4.9, reviews: 334, time: "2 hrs", badge: "Fast", image: SERVICE_IMAGE.geyser },
      { label: "Water Purifier", price: 199, rating: 4.5, reviews: 178, time: "1 hr", badge: null, image: SERVICE_IMAGE.waterPurifier },
      { label: "Water Purifier Service", price: 149, rating: 4.5, reviews: 142, time: "45 min", badge: null, image: SERVICE_IMAGE.waterPurifier },
    ],
  },
  {
    title: "Home Repair",
    items: [
      { label: "Switch Repair", price: 149, rating: 4.9, reviews: 1841, time: "45 min", badge: "Most Booked", image: SERVICE_IMAGE.switchRepair },
      { label: "Fan Installation", price: 129, rating: 4.8, reviews: 1221, time: "45 min", badge: null, image: SERVICE_IMAGE.fan },
      { label: "Pipe Leakage Fix", price: 249, rating: 4.7, reviews: 620, time: "2 hrs", badge: null, image: SERVICE_IMAGE.pipeLeak },
      { label: "Door / Lock Repair", price: 199, rating: 4.6, reviews: 410, time: "1 hr", badge: null, image: SERVICE_IMAGE.doorLock },
      { label: "Wall Putty", price: 599, rating: 4.5, reviews: 212, time: "Half day", badge: null, image: SERVICE_IMAGE.wallPutty },
      { label: "Tile Fixing", price: 399, rating: 4.6, reviews: 185, time: "3 hrs", badge: null, image: SERVICE_IMAGE.tile },
      { label: "Electrical Wiring", price: 349, rating: 4.7, reviews: 298, time: "2 hrs", badge: null, image: SERVICE_IMAGE.electrical },
      { label: "CCTV Installation", price: 1499, rating: 4.8, reviews: 124, time: "4 hrs", badge: null, image: SERVICE_IMAGE.cctv },
    ],
  },
  {
    title: "Cleaning Services",
    items: [
      { label: "Deep Cleaning", price: 799, rating: 4.8, reviews: 643, time: "4 hrs", badge: "Popular", image: SERVICE_IMAGE.cleaning },
      { label: "Pest Control", price: 599, rating: 4.7, reviews: 421, time: "2 hrs", badge: null, image: SERVICE_IMAGE.pest },
      { label: "Office Deep Clean", price: 1199, rating: 4.7, reviews: 98, time: "Half day", badge: null, image: SERVICE_IMAGE.cleaning },
      { label: "Pest Control (Office)", price: 999, rating: 4.7, reviews: 72, time: "3 hrs", badge: null, image: SERVICE_IMAGE.pest },
    ],
  },
  {
    title: "Office & Commercial",
    items: [
      { label: "Office Electrical", price: 499, rating: 4.9, reviews: 88, time: "3 hrs", badge: "B2B", image: SERVICE_IMAGE.officeElectrical },
      { label: "AC Servicing x2", price: 699, rating: 4.8, reviews: 56, time: "4 hrs", badge: "B2B", image: SERVICE_IMAGE.ac },
      { label: "CCTV Setup", price: 1499, rating: 4.8, reviews: 124, time: "4 hrs", badge: null, image: SERVICE_IMAGE.cctv },
      { label: "Office Deep Clean", price: 1199, rating: 4.7, reviews: 98, time: "Half day", badge: "B2B", image: SERVICE_IMAGE.cleaning },
      { label: "Pest Control (Office)", price: 999, rating: 4.7, reviews: 72, time: "3 hrs", badge: "B2B", image: SERVICE_IMAGE.pest },
      { label: "Office Wiring", price: 799, rating: 4.8, reviews: 64, time: "4 hrs", badge: "B2B", image: SERVICE_IMAGE.electrical },
      { label: "Switch Board Setup", price: 349, rating: 4.7, reviews: 48, time: "2 hrs", badge: "B2B", image: SERVICE_IMAGE.switchRepair },
      { label: "Water Cooler Service", price: 299, rating: 4.6, reviews: 37, time: "1 hr", badge: "B2B", image: SERVICE_IMAGE.waterPurifier },
    ],
  },
];
