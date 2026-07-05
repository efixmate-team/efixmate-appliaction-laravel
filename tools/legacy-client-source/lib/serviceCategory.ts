import {
  AirVent, AlertCircle, Archive, Award, Bath, Bed, Bell, Bolt, Briefcase,
  Bug, Building, Building2, Camera, Car, CheckCircle, ClipboardList,
  Computer, Cpu, Droplet, Droplets, Fan, Flame, Flashlight, Hammer,
  Home, Layers, LayoutGrid, LucideIcon, Monitor, Package, PaintBucket,
  Plug, RefreshCw, Settings, Settings2, Shield, ShoppingBag, Sofa,
  Sparkles, Star, Tag, ThermometerSun, Truck, Tv, Utensils, Wind,
  Wrench, Zap,
} from "lucide-react";

/** Lookup map for dynamic icon-name resolution from DB category_icon strings. */
const ICON_MAP: Record<string, LucideIcon> = {
  AirVent, AlertCircle, Archive, Award, Bath, Bed, Bell, Bolt, Briefcase,
  Bug, Building, Building2, Camera, Car, CheckCircle, ClipboardList,
  Computer, Cpu, Droplet, Droplets, Fan, Flame, Hammer,
  Home, Layers, LayoutGrid, Monitor, Package, PaintBucket,
  Plug, RefreshCw, Settings, Settings2, Shield, ShoppingBag, Sofa,
  Sparkles, Star, Tag, ThermometerSun, Truck, Tv, Utensils, Wind, Wrench, Zap,
};
import { resolveUploadUrl } from "@/lib/api/coreClient";

export type HomeServiceCategory = {
  id: number | null;
  title: string;
  subtitle: string;
  icon: string;
  color: string | null;
  is_more: boolean;
  action?: { type: string; value: string };
  /** Static link for guest/default tiles (no category id). */
  href?: string;
};

export const SERVICES_ICONS_BASE = "/Services/Categories";
const LEGACY_SERVICES_ICONS_BASE = "/services-icons";

/** PNG files in client/public/Services/Categories — set `category_icon` in DB to one of these keys. */
export const SERVICE_CATEGORY_ICON_KEYS = [
  "AC.webp",
  "ELECTRIC.webp",
  "PLUMBER.webp",
  "APPLIANCE.webp",
  "CLEANING.webp",
  "CARPENTER.webp",
  "PAINTING.webp",
  "PEST.webp",
] as const;

export type ServiceCategoryIconKey = (typeof SERVICE_CATEGORY_ICON_KEYS)[number];

/** Maps DB `category_icon` values (PNG key or legacy Lucide name) → PNG filename. */
const DB_ICON_TO_FILE: Record<string, ServiceCategoryIconKey> = {
  AC: "AC.webp",
  "AC.webp": "AC.webp",
  AirVent: "AC.webp",
  Wind: "AC.webp",
  ELECTRIC: "ELECTRIC.webp",
  "ELECTRIC.webp": "ELECTRIC.webp",
  Electric: "ELECTRIC.webp",
  Electrician: "ELECTRIC.webp",
  Zap: "ELECTRIC.webp",
  PLUMBER: "PLUMBER.webp",
  "PLUMBER.webp": "PLUMBER.webp",
  Plumber: "PLUMBER.webp",
  Plumbing: "PLUMBER.webp",
  Droplets: "PLUMBER.webp",
  APPLIANCE: "APPLIANCE.webp",
  "APPLIANCE.webp": "APPLIANCE.webp",
  Appliance: "APPLIANCE.webp",
  Settings2: "APPLIANCE.webp",
  CLEANING: "CLEANING.webp",
  "CLEANING.webp": "CLEANING.webp",
  Cleaning: "CLEANING.webp",
  Sparkles: "CLEANING.webp",
  CARPENTER: "CARPENTER.webp",
  "CARPENTER.webp": "CARPENTER.webp",
  Carpenter: "CARPENTER.webp",
  Carpentry: "CARPENTER.webp",
  Hammer: "CARPENTER.webp",
  PAINTING: "PAINTING.webp",
  "PAINTING.webp": "PAINTING.webp",
  Painting: "PAINTING.webp",
  PaintBucket: "PAINTING.webp",
  Brush: "PAINTING.webp",
  PEST: "PEST.webp",
  "PEST.webp": "PEST.webp",
  Pest: "PEST.webp",
  Bug: "PEST.webp",
};

/** Shown on home when the user is not logged in (uses same DB icon keys). */
export const DEFAULT_HOME_CATEGORIES: HomeServiceCategory[] = [
  { id: null, title: "AC Repair",        subtitle: "Installation & Service",  icon: "AC.webp",        color: "#0284c7", is_more: false, href: "/services" },
  { id: null, title: "Electrical",       subtitle: "Wiring, Switch & Fan",    icon: "ELECTRIC.webp",  color: "#d97706", is_more: false, href: "/services" },
  { id: null, title: "Plumbing",         subtitle: "Leakage & Pipe Fixing",   icon: "PLUMBER.webp",   color: "#2563eb", is_more: false, href: "/services" },
  { id: null, title: "Appliance Repair", subtitle: "Repair & Installation",   icon: "APPLIANCE.webp", color: "#7c3aed", is_more: false, href: "/services" },
  { id: null, title: "Cleaning",         subtitle: "Home & Office",           icon: "CLEANING.webp",  color: "#059669", is_more: false, href: "/services" },
  { id: null, title: "Carpentry",        subtitle: "Wood Work & Fixing",      icon: "CARPENTER.webp", color: "#ea580c", is_more: false, href: "/services" },
  { id: null, title: "Painting",         subtitle: "Wall & Texture Paint",    icon: "PAINTING.webp",  color: "#db2777", is_more: false, href: "/services" },
  { id: null, title: "More Services",    subtitle: "And many more",           icon: "LayoutGrid",    color: "#4E4848", is_more: true, href: "/services" },
];

const KEYWORD_ICONS: Array<{ match: RegExp; Icon: LucideIcon }> = [
  { match: /electric|wiring|switch/i, Icon: Zap },
  { match: /ac|air|cool|hvac|wind/i, Icon: Wind },
  { match: /plumb|pipe|water|leak|droplet/i, Icon: Droplets },
  { match: /appli|repair|machine|geyser|fridge|wash/i, Icon: Settings2 },
  { match: /clean|sanit/i, Icon: Sparkles },
  { match: /carpent|wood|door|furniture/i, Icon: Hammer },
  { match: /paint|wall/i, Icon: PaintBucket },
  { match: /cctv|camera|security/i, Icon: Camera },
  { match: /pest|bug/i, Icon: Bug },
  { match: /tv|lcd|screen/i, Icon: Tv },
  { match: /office|commercial|b2b/i, Icon: Building2 },
  { match: /ro|purif/i, Icon: Droplet },
];

const FALLBACK_BG = ["#e0f2fe", "#fef3c7", "#dbeafe", "#ede9fe", "#d1fae5", "#ffedd5", "#fce7f3", "#ecfccb"];
const FALLBACK_FG = ["#0284c7", "#d97706", "#2563eb", "#7c3aed", "#059669", "#ea580c", "#db2777", "#65a30d"];

export function parseHomeCategories(raw: unknown): HomeServiceCategory[] {
  if (!Array.isArray(raw)) return [];
  const items: HomeServiceCategory[] = [];
  for (const row of raw) {
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? r.category_name ?? "");
    if (!title) continue;
    items.push({
      id: r.id != null ? Number(r.id) : r.category_id != null ? Number(r.category_id) : null,
      title,
      subtitle: String(r.subtitle ?? r.description ?? ""),
      icon: String(r.icon ?? r.category_icon ?? ""),
      color: r.color != null ? String(r.color) : r.category_color != null ? String(r.category_color) : null,
      is_more: Boolean(r.is_more),
      ...(r.action ? { action: r.action as HomeServiceCategory["action"] } : {}),
    });
  }
  return items;
}

export function isCategoryImageIcon(icon?: string): boolean {
  if (!icon) return false;
  if (
    icon.startsWith(`${SERVICES_ICONS_BASE}/`) ||
    icon.startsWith("Services/Categories/") ||
    icon.startsWith(`${LEGACY_SERVICES_ICONS_BASE}/`) ||
    icon.startsWith("services-icons/")
  ) return true;
  if (resolveDbCategoryIconFile(icon)) return true;
  return icon.includes("/") || /^https?:\/\//i.test(icon) || icon.startsWith("assets");
}

function resolveDbCategoryIconFile(icon?: string): ServiceCategoryIconKey | null {
  if (!icon?.trim()) return null;
  const trimmed = icon.trim();
  const mapped = DB_ICON_TO_FILE[trimmed] ?? DB_ICON_TO_FILE[trimmed.toUpperCase()];
  if (mapped) return mapped;
  if (SERVICE_CATEGORY_ICON_KEYS.includes(trimmed as ServiceCategoryIconKey)) {
    return trimmed as ServiceCategoryIconKey;
  }
  return null;
}

export function resolveCategoryIcon(icon?: string, title?: string): LucideIcon {
  if (resolveDbCategoryIconFile(icon)) return Wrench;
  const key = icon?.trim();
  if (key) {
    const fromLucide = ICON_MAP[key];
    if (fromLucide) return fromLucide;
  }
  const text = `${title ?? ""} ${icon ?? ""}`;
  for (const { match, Icon } of KEYWORD_ICONS) {
    if (match.test(text)) return Icon;
  }
  return Wrench;
}

export function categoryColors(color: string | null | undefined, index: number) {
  const fg = color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : FALLBACK_FG[index % FALLBACK_FG.length];
  const bg = `${fg}18`;
  return { fg, bg };
}

/**
 * Normalize admin input: filename (`AC.webp`), path (`/Services/Categories/AC.webp`),
 * Lucide name (`Zap`), or full URL.
 */
export function normalizeCategoryIconInput(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();

  if (trimmed.startsWith(`${SERVICES_ICONS_BASE}/`)) return trimmed;
  if (trimmed.startsWith("Services/Categories/")) return `/${trimmed}`;
  if (trimmed.startsWith(`${LEGACY_SERVICES_ICONS_BASE}/`)) return trimmed;
  if (trimmed.startsWith("services-icons/")) return `/${trimmed}`;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads") || trimmed.startsWith("/api/")) {
    return trimmed;
  }

  const file = resolveDbCategoryIconFile(trimmed);
  if (file) return `${SERVICES_ICONS_BASE}/${file}`;

  if (trimmed.includes("/")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  if (/\.(png|jpe?g|svg|webp)$/i.test(trimmed)) {
    return `${SERVICES_ICONS_BASE}/${trimmed}`;
  }

  return trimmed;
}

/** Resolve `category_icon` from DB to a display URL. Does not guess from category title. */
export function categoryIconUrl(icon?: string): string | null {
  if (!icon?.trim()) return null;
  const trimmed = icon.trim();

  // Legacy paths — already at correct location in public/services-icons/
  if (trimmed.startsWith(`${LEGACY_SERVICES_ICONS_BASE}/`)) return trimmed;
  if (trimmed.startsWith("services-icons/")) return `/${trimmed}`;

  // /Services/Categories/X.webp → /services-icons/X.webp (actual file location)
  if (trimmed.startsWith(`${SERVICES_ICONS_BASE}/`)) {
    return `/services-icons/${trimmed.slice(SERVICES_ICONS_BASE.length + 1)}`;
  }
  if (trimmed.startsWith("Services/Categories/")) {
    return `/services-icons/${trimmed.slice("Services/Categories/".length)}`;
  }

  const file = resolveDbCategoryIconFile(trimmed);
  if (file) return `/services-icons/${file}`;

  if (trimmed.includes("/") || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("assets")) {
    return resolveUploadUrl(trimmed);
  }

  return null;
}

export function categoryHref(item: HomeServiceCategory): string {
  if (item.href) return item.href;
  if (item.is_more) return "/services";
  if (item.action?.type === "/MoreServicesPage") return "/services";
  const id =
    item.action?.type === "OPEN_CATEGORY" && item.action.value
      ? item.action.value
      : item.action?.value || (item.id != null ? String(item.id) : "");
  if (id) return `/services?category_id=${encodeURIComponent(id)}`;
  return "/services";
}
