import { resolveUploadUrl } from "@/lib/api/coreClient";

export type HomeCarouselSlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_action: { type: string; value: string };
  image: string;
  background_color: string;
};

export const DEFAULT_CAROUSEL_SLIDES: HomeCarouselSlide[] = [
  {
    id: 0,
    title: "AC Service in 30 Minutes",
    subtitle: "Fast. Reliable. Affordable.",
    description: "Book trusted technicians at your convenience.",
    button_text: "Book Now",
    button_action: { type: "OPEN_CATEGORY", value: "" },
    image: "",
    background_color: "#0a3fd4",
  },
  {
    id: 1,
    title: "Deep Cleaning",
    subtitle: "Professional Home Cleaning",
    description: "Kitchen, bathroom, sofa and more by verified pros.",
    button_text: "Explore",
    button_action: { type: "OPEN_CATEGORY", value: "" },
    image: "",
    background_color: "#1B5E20",
  },
];

export function parseHomeCarousel(raw: unknown): HomeCarouselSlide[] {
  const rows = Array.isArray(raw) ? raw : [];
  const items: HomeCarouselSlide[] = [];

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? "");
    if (!title) continue;

    const action = (r.button_action ?? r.action) as Record<string, unknown> | undefined;
    items.push({
      id: Number(r.id ?? r.announcement_id ?? items.length),
      title,
      subtitle: String(r.subtitle ?? ""),
      description: String(r.description ?? r.message ?? ""),
      button_text: String(r.button_text ?? r.cta_text ?? "Explore"),
      button_action: {
        type: String(action?.type ?? r.cta_action_type ?? "category"),
        value: String(action?.value ?? r.cta_value ?? ""),
      },
      image: String(r.image ?? r.mobile_image_url ?? ""),
      background_color: String(r.background_color ?? "#0D47A1"),
    });
  }

  return items;
}

export function carouselImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith("/")) return image;
  if (/^https?:\/\//i.test(image)) return image;
  return resolveUploadUrl(image);
}

export function carouselCtaHref(slide: HomeCarouselSlide): string {
  const { type, value } = slide.button_action;
  const t = type.toUpperCase();

  if (t === "OPEN_SERVICE" && value) return `/service/${encodeURIComponent(value)}`;
  if ((t === "OPEN_CATEGORY" || t === "CATEGORY") && value) {
    return `/services?category_id=${encodeURIComponent(value)}`;
  }
  if (t === "OPEN_OFFER" || t === "COUPON") {
    return value ? `/offers?coupon=${encodeURIComponent(value)}` : "/offers";
  }
  if (t === "URL" || t === "EXTERNAL" || t === "WEB") {
    if (/^https?:\/\//i.test(value)) return value;
  }
  if (value && /^\//.test(value)) return value;
  return "/services";
}

export function carouselGradient(color: string): string {
  const base = color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#0a3fd4";
  return `linear-gradient(135deg, ${base} 0%, ${base}dd 45%, ${base}bb 100%)`;
}
