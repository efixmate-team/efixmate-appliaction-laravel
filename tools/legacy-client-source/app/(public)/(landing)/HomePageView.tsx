/** @format */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Clock4,
  Droplets,
  Flame,
  Gift,
  Headphones,
  Heart,
  IndianRupee,
  Instagram,
  LayoutGrid,
  Linkedin,
  Loader2,
  MapPin,
  Plus,
  Quote,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Thermometer,
  ThumbsUp,
  Truck,
  Twitter,
  User,
  Users,
  Wrench,
  X,
  Zap,
  Phone,
  Mail,
  MapPinOff,
} from "lucide-react";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  ArrowRight, Award, BadgeCheck, CalendarDays, CheckCircle, ClipboardCheck,
  Clock, Clock4, Droplets, Flame, Gift, Headphones, Heart, IndianRupee,
  LayoutGrid, Loader2, MapPin, Plus, RefreshCw, Search, ShieldCheck, Sparkles,
  Star, Thermometer, ThumbsUp, Truck, User, Users, Wrench, Zap,
};

import { createElement, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicHeader } from "@/components/PublicHeader";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useUserAuthStore } from "@/store/userAuth.store";
import { useLocationStore } from "@/store/location.store";
import {
  getHomeCarousel,
} from "@/lib/api/userClient";
import {
  getWebappCatalog,
  getWebappQuickGrids,
  getWebappPopularServices,
  getWebappEmergencyServices,
  searchWebapp,
  searchWebappServices,
  type QuickGrid,
  type WebappSearchCategory,
} from "@/lib/api/webappClient";
import { CartDrawer } from "@/components/booking/CartDrawer";
import {
  type HomeCarouselSlide,
  DEFAULT_CAROUSEL_SLIDES,
  parseHomeCarousel,
  carouselImageUrl,
  carouselCtaHref,
  carouselGradient,
} from "@/lib/homeCarousel";
import {
  type HomeServiceCollection,
  type HomeServiceItem,
  DEFAULT_POPULAR,
  DEFAULT_COLLECTIONS,
} from "@/lib/homeServices";
import { resolveServiceImageUrl } from "@/lib/serviceImage";
import {
  type HomeServiceCategory,
  parseHomeCategories,
  resolveCategoryIcon,
  categoryColors,
  categoryIconUrl,
  categoryHref,
  DEFAULT_HOME_CATEGORIES,
} from "@/lib/serviceCategory";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ExpandableServiceCard } from "@/components/booking/ExpandableServiceCard";
import { defaultServiceConfig } from "@/components/booking/ServiceConfigPanel";
import { StickyCartBar } from "@/components/booking/StickyCartBar";
import { LandingFooter } from "./_components/LandingFooter";
import type { CatalogService } from "@/components/booking/bookingTypes";
import { useCartStore, type CartLine, type PriceQuote } from "@/store/cart.store";
import { addCartLine, ensureCart, getCart } from "@/lib/api/userClient";
import { parseCartSummary } from "@/lib/booking";

const LocationModal = dynamic(
  () => import("../../(user)/_components/LocationModal"),
  { ssr: false },
);
const UserLoginModal = dynamic(
  () => import("@/components/user/UserLoginModal"),
  { ssr: false },
);
const HomeBannerCarousel = dynamic(
  () => import("./_components/HomeBannerCarousel"),

);

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { FooterLink, SocialLink } from "./_components/LandingChromeProvider";
export interface ServiceCard { icon: string; title: string; desc: string; href: string }
export interface StatItem { id?: number; iconName: string; value: string; label: string }
export interface PromiseItem { icon: string; title: string; desc: string }
export interface StepItem { title: string; desc: string }
export interface CustomerType { icon: string; label: string }
export interface Testimonial { text: string; name: string; city: string }
export type HomeHeroProps = {
  heading: string; subheading: string; badge_items: string[];
  cta_primary: string; cta_secondary: string;
};
export type HomeRatingProps = { value: string; label: string };
export type ContactBannerProps = {
  heading: string; subtext: string; phone: string; cta_call: string; cta_chat: string;
};
export interface EmergencyServiceItem {
  iconName: string;
  label: string;
  sub: string;
  color: string;
}
export type TechnicianBannerProps = {
  badge?: string;
  heading?: string;
  subtext?: string;
  cta_primary?: string;
  cta_secondary?: string;
};
export interface HomePageViewProps {
  hero: HomeHeroProps;
  rating: HomeRatingProps;
  contactBanner: ContactBannerProps;
  serviceCards: ServiceCard[];
  stats: StatItem[];
  promiseItems: PromiseItem[];
  steps: StepItem[];
  customerTypes: CustomerType[];
  testimonials: Testimonial[];
  serviceAreas?: Array<{ name: string; active: boolean }>;
  emergencyServices?: EmergencyServiceItem[];
  technicianBanner?: TechnicianBannerProps;
}

const EMERGENCY = [
  { Icon: Zap, label: "Power Failure", sub: "Help in 30 min", color: "#f59e0b" },
  { Icon: Droplets, label: "Water Leakage", sub: "Help in 30 min", color: "#3b82f6" },
  { Icon: Thermometer, label: "AC Not Cooling", sub: "Help in 60 min", color: "#0ea5e9" },
  { Icon: Flame, label: "Short Circuit", sub: "Help in 30 min", color: "#ef4444" },
] as const;

const NAV_ITEMS = [
  { label: "Offers", href: "/offers" },
  { label: "My Bookings", href: "/bookings" },
  { label: "Support", href: "/contact-us" },
] as const;

// ─── Category card ────────────────────────────────────────────────────────────

function HomeCategoryCard({
  item,
  index,
}: {
  item: HomeServiceCategory;
  index: number;
}) {
  const { fg } = categoryColors(item.color, index);
  const imgUrl = categoryIconUrl(item.icon);
  const fallbackIcon = createElement(
    item.is_more ? LayoutGrid : resolveCategoryIcon(item.icon, item.title),
    { size: 26, style: { color: fg }, strokeWidth: 1.5 },
  );

  const inner = (
    <>
      <div className="flex w-2/3 flex-col justify-center px-3 py-3">
        <p className="text-[13px] font-semibold leading-tight text-[#0f172a]">
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#94a3b8]">
          {item.subtitle || (item.is_more ? "Browse all" : "Book now")}
        </p>
      </div>
      <div className="relative w-1/3 self-stretch overflow-hidden">
        {imgUrl && !item.is_more ? (
          <Image
            src={imgUrl}
            alt=""
            fill
            unoptimized
            className="object-contain"
            sizes="(max-width: 640px) 33vw, 96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {fallbackIcon}
          </div>
        )}
      </div>
    </>
  );

  return (
    <Link
      href={categoryHref(item)}
      className="group flex overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff] transition-all hover:border-[#cbd5e1] hover:shadow-sm text-left w-full"
    >
      {inner}
    </Link>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="flex h-[72px] overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff]">
      <div className="flex w-2/3 flex-col justify-center gap-2 px-3 py-3">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#e2e8f0]" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#f1f5f9]" />
      </div>
      <div className="w-1/3 animate-pulse bg-[#f1f5f9]" />
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="w-[240px] shrink-0 overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff]">
      <div className="flex h-[120px]">
        <div className="w-[90px] shrink-0 animate-pulse bg-[#e2e8f0]" />
        <div className="flex flex-1 flex-col justify-between px-3 py-2.5">
          <div className="space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-[#e2e8f0]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#f1f5f9]" />
          </div>
          <div className="h-2.5 w-16 animate-pulse rounded bg-[#f1f5f9]" />
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-12 animate-pulse rounded bg-[#f1f5f9]" />
            <div className="h-6 w-14 animate-pulse rounded-md bg-[#e2e8f0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceRowSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {[...Array(cards)].map((_, i) => <ServiceCardSkeleton key={i} />)}
    </div>
  );
}

function HomePageSkeleton({ showCollections = true }: { showCollections?: boolean }) {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="space-y-2">
            <div className="h-7 w-[min(100%,280px)] animate-pulse rounded-lg bg-[#e2e8f0]" />
            <div className="h-4 w-[min(100%,200px)] animate-pulse rounded bg-[#f1f5f9]" />
          </div>
          <div className="h-12 animate-pulse rounded-lg bg-[#e2e8f0]" />
          <div className="hidden gap-2 lg:flex">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-[#f1f5f9]" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[...Array(8)].map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        </div>
        <div className="min-h-[280px] animate-pulse rounded-xl bg-[#e2e8f0] sm:min-h-[300px]" />
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-[#e2e8f0]" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#f1f5f9]" />
        </div>
        <ServiceRowSkeleton />
      </div>

      {showCollections && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[228px] shrink-0 rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-[#e2e8f0]" />
                <div className="h-3 w-14 animate-pulse rounded bg-[#f1f5f9]" />
              </div>
              <div className="grid grid-cols-4 gap-x-1.5 gap-y-2.5">
                {[...Array(4)].map((__, j) => (
                  <div key={j} className="flex flex-col items-center gap-1.5">
                    <div className="w-full animate-pulse rounded-md bg-[#f1f5f9]" style={{ aspectRatio: "2/1" }} />
                    <div className="h-2.5 w-9 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function toCatalogService(item: HomeServiceItem): CatalogService | null {
  if (!item.service_id) return null;
  return {
    service_id: item.service_id,
    title: item.label,
    image: item.image,
    price: item.price,
    rating: item.rating,
    booking_types: item.booking_types,
    units: item.units,
    category_id: item.category_id,
  };
}

async function addServiceToCartNow({
  service,
  token,
  setLines,
  setQuote,
}: {
  service: CatalogService;
  token: string | null;
  setLines: (lines: CartLine[]) => void;
  setQuote: (quote: PriceQuote | null) => void;
}) {
  const config = defaultServiceConfig(
    service.booking_types ?? [],
    service.units ?? [],
    service.price,
  );

  if (!token) return { status: false, message: "Login required." };

  const cartRes = await ensureCart() as { status: boolean; message?: string };
  if (!cartRes.status) {
    return { status: false, message: cartRes.message || "Could not prepare cart." };
  }

  const lineRes = await addCartLine({
    service_id: service.service_id,
    booking_type_id: config.bookingTypeId,
    unit_id: config.unitId,
    quantity: config.quantity,
  }) as { status: boolean; message?: string; lines?: unknown[]; quote?: unknown };

  if (!lineRes.status) {
    return { status: false, message: lineRes.message || "Could not add to cart." };
  }

  const { lines: apiLines, quote } = parseCartSummary(lineRes);
  if (apiLines.length) setLines(apiLines);
  if (quote) setQuote(quote);
  return { status: true };
}

async function resolveCatalogForCart(item: HomeServiceItem): Promise<CatalogService | null> {
  const direct = toCatalogService(item);
  if (direct) return direct;

  const results = await searchWebappServices(item.label, 5);
  const normalizedLabel = item.label.trim().toLowerCase();
  return (
    results.find((service) => service.title.trim().toLowerCase() === normalizedLabel) ??
    results[0] ??
    null
  );
}

function HomeCartHydrator() {
  const { token, isHydrated } = useUserAuthStore();
  const { setLines, setCartId, setQuote, syncFromSummary } = useCartStore();
  useEffect(() => {
    if (!isHydrated || !token) return;
    (async () => {
      try {
        const res = await getCart();
        const { summary, lines, quote } = parseCartSummary(res);
        if (lines.length) setLines(lines);
        if (summary) { setCartId(summary.cart_id); syncFromSummary(summary); }
        if (quote) setQuote(quote);
      } catch { /* no cart */ }
    })();
  }, [isHydrated, token, setLines, setCartId, setQuote, syncFromSummary]);
  return null;
}

// ─── Service card (logged-out or fallback) ────────────────────────────────────

function HomeServiceCard({
  item, token, onLogin, onBook, isAdding, inCart,
}: {
  item: HomeServiceItem;
  token: boolean;
  onLogin: () => void;
  onBook: () => void;
  isAdding?: boolean;
  inCart?: boolean;
}) {
  const catalog = toCatalogService(item);
  if (token && catalog) {
    return <ExpandableServiceCard service={catalog} isLoggedIn={!!token} onLoginRequired={onLogin} />;
  }
  return <ServiceCard item={item} onBook={onBook} isAdding={isAdding} inCart={inCart} />;
}

function ServiceCard({
  item, onBook, isAdding = false, inCart = false,
}: {
  item: HomeServiceItem;
  onBook: () => void;
  isAdding?: boolean;
  inCart?: boolean;
}) {
  const { label, price, rating, reviews, time, badge, image } = item;
  const fmtReviews = reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}K` : String(reviews);
  return (
    <div className="w-[240px] shrink-0 self-start overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff] shadow-sm transition-shadow hover:shadow">
      <div className="flex h-[120px]">
        <div className="relative w-[90px] shrink-0 overflow-hidden bg-[#f8fafc] flex items-center justify-center">
          {image ? (
            <Image src={image} alt="" fill unoptimized className="object-contain" sizes="90px" />
          ) : (
            <Wrench size={32} className="text-[#cbd5e1]" strokeWidth={1.2} />
          )}
          {badge && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-[#1d4ed8] px-1.5 py-0.5 text-[8.5px] font-semibold text-white uppercase tracking-wide leading-none">
              {badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between px-3 py-2.5">
          <p className="text-[13px] font-semibold leading-snug text-[#0f172a] line-clamp-2">{label}</p>

          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={11} className="text-[#fbbf24] shrink-0" fill="currentColor" />
              <span className="text-[12px] font-semibold text-[#0f172a]">{rating.toFixed(1)}</span>
              {reviews > 0 && (
                <span className="text-[11px] text-[#94a3b8]">({fmtReviews})</span>
              )}
            </div>
          )}

          <div>
            {price > 0 ? (
              <>
                <p className="text-[15px] font-bold leading-none text-[#0f172a]">₹{price}</p>
                <p className="mt-0.5 text-[10px] text-[#94a3b8]">Starting Price</p>
              </>
            ) : (
              <p className="text-[12px] font-medium text-[#475569]">Price on inquiry</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10.5px] text-[#94a3b8]">
              <Clock4 size={10} /> {time}
            </span>
            <button
              type="button"
              onClick={onBook}
              disabled={isAdding}
              className={`flex items-center gap-0.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-60 ${
                inCart
                  ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
                  : "border-[#e2e8f0] bg-[#ffffff] text-[#475569] hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
              }`}
            >
              {isAdding ? (
                <><span>Adding</span><Loader2 size={12} className="animate-spin" /></>
              ) : inCart ? (
                <><span>Added</span><CheckCircle size={12} strokeWidth={2.5} /></>
              ) : (
                <>Add <Plus size={12} strokeWidth={2.5} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sticky Header ────────────────────────────────────────────────────────────

function SiteHeader({ onLoginClick }: { onLoginClick: () => void }) {
  const { token, customer } = useUserAuthStore();
  const { location, isDetecting, openModal } = useLocationStore();
  const cartLines = useCartStore((s) => s.lines);
  const cartItemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-[#ffffff] transition-shadow ${scrolled ? "shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : ""} border-b border-[#e2e8f0]`}
    >
      <div className="mx-auto flex h-[48px] min-w-0 max-w-[1440px] items-center gap-2 px-3 sm:h-[52px] sm:gap-0 sm:px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="mr-1 flex shrink-0 items-center gap-1.5 sm:mr-3 lg:mr-4">
          <BrandLogo width={24} height={24} className="h-6 w-6" />
          <span className="hidden text-[16px] font-semibold text-[#0f172a] sm:block sm:text-[17px]">
            eFixMate
          </span>
        </Link>

        {/* Location selector */}
        <button
          type="button"
          onClick={openModal}
          className="flex min-w-0 max-w-[38vw] items-center gap-1 text-[12px] font-medium text-[#475569] transition-colors hover:text-[#1d4ed8] sm:max-w-[130px] sm:gap-1.5 sm:text-[13px]"
        >
          {isDetecting ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-[#1d4ed8]" />
          ) : (
            <MapPin size={14} className="shrink-0 text-[#1d4ed8]" />
          )}
          <span className="truncate">{location?.displayName ?? "Select location"}</span>
          <ChevronDown size={13} className="shrink-0 text-[#94a3b8]" />
        </button>

        <div className="min-w-0 flex-1" />

        {/* Nav items — desktop only */}
        <nav className="hidden items-center gap-1 lg:flex">
          {token && (
            <Link
              href="/bookings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
            >
              <CalendarDays size={14} className="shrink-0" />
              My Bookings
            </Link>
          )}
          <Link
            href="/contact-us"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
          >
            <Headphones size={14} className="shrink-0" />
            Support
          </Link>
        </nav>

        <div className="mx-3 hidden h-5 w-px bg-[#e2e8f0] lg:block" />

        {/* Login / Profile — desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          {token ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] px-3 py-1.5 text-[12.5px] font-medium text-[#475569] transition-colors hover:border-[#cbd5e1] hover:text-[#0f172a]"
            >
              <UserAvatar customer={customer} size="sm" className="ring-0" />
              {customer?.first_name ?? "Profile"}
              <ChevronDown size={12} className="text-[#94a3b8]" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#ffffff] px-3.5 py-1.5 text-[12.5px] font-medium text-[#475569] transition-colors hover:border-[#cbd5e1] hover:text-[#0f172a]"
            >
              <User size={14} className="shrink-0 text-[#64748b]" />
              Login / Sign Up
              <ChevronDown size={12} className="shrink-0 text-[#94a3b8]" />
            </button>
          )}

          {/* Cart icon */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#ffffff] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            aria-label="Cart"
          >
            <ShoppingCart size={16} className="text-[#475569]" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e55d9] px-1 text-[9px] font-black text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Profile / login — mobile */}
        <div className="flex shrink-0 items-center lg:hidden">
          {token ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-[#e2e8f0]"
            >
              <UserAvatar customer={customer} size="sm" className="ring-0" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              aria-label="Login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b]"
            >
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Promo poster banner ──────────────────────────────────────────────────────

function HomePosterBanner({ slide }: { slide: HomeCarouselSlide }) {
  const imgUrl = carouselImageUrl(slide.image);
  const href = carouselCtaHref(slide);

  return (
    <Link
      href={href}
      className="relative flex h-[128px] overflow-hidden rounded-xl sm:h-[140px]"
      style={{ background: carouselGradient(slide.background_color) }}
    >
      {imgUrl && (
        <Image
          src={imgUrl}
          alt=""
          fill
          unoptimized
          className="object-cover pointer-events-none"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.06) 76%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex max-w-[70%] flex-col justify-center gap-0.5 px-5 py-4">
        {slide.subtitle && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#fcd34d]">
            {slide.subtitle}
          </span>
        )}
        <h3 className="text-[17px] font-bold leading-tight text-white sm:text-[19px]">
          {slide.title}
        </h3>
        {slide.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/70">{slide.description}</p>
        )}
        <div className="mt-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold"
            style={{ color: slide.background_color || "#1D4ED8" }}
          >
            {slide.button_text}
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type QuickGridConfig = QuickGrid;

const DEFAULT_QUICK_GRIDS: QuickGridConfig[] = [
  {
    title: "Quick fixes for today",
    subtitle: "Fast-moving home services in one tap",
    badge: "Same day",
    accent: "#16a34a",
    items: [
      { label: "Switch Repair", match: ["switch"] },
      { label: "Fan Installation", match: ["fan"] },
      { label: "Pipe Leakage Fix", match: ["pipe", "leak"] },
      { label: "AC Not Cooling", match: ["ac service", "ac gas", "ac"] },
      { label: "Geyser Install", match: ["geyser"] },
      { label: "Door / Lock Repair", match: ["door", "lock"] },
      { label: "Water Purifier", match: ["water purifier"] },
      { label: "CCTV Setup", match: ["cctv"] },
    ],
  },
  {
    title: "Appliance care corner",
    subtitle: "Repair, install, service and maintain",
    badge: "Popular",
    accent: "#db2777",
    items: [
      { label: "AC Service", match: ["ac service", "ac"] },
      { label: "Fridge Repair", match: ["fridge"] },
      { label: "Washing Machine", match: ["washing"] },
      { label: "Microwave Repair", match: ["microwave"] },
      { label: "Deep Cleaning", match: ["deep cleaning"] },
      { label: "Pest Control", match: ["pest"] },
      { label: "Tile Fixing", match: ["tile"] },
      { label: "Wall Putty", match: ["wall putty"] },
    ],
  },
];

function uniqServices(items: HomeServiceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.service_id ? `id-${item.service_id}` : item.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findQuickService(
  livePool: HomeServiceItem[],
  fallbackPool: HomeServiceItem[],
  match: string[],
  label: string,
) {
  const findIn = (pool: HomeServiceItem[]) =>
    pool.find((service) => {
      const serviceLabel = service.label.toLowerCase();
      return match.some((term) => serviceLabel.includes(term.toLowerCase()));
    });

  return findIn(livePool) ?? findIn(fallbackPool) ?? {
    label,
    price: 0,
    rating: 0,
    reviews: 0,
    time: "Flexible",
    badge: null,
    image: null,
  };
}

function QuickHomeGrids({
  grids,
  popular,
  collections,
  onSelect,
  onLogin,
}: {
  grids: QuickGridConfig[];
  popular: HomeServiceItem[];
  collections: HomeServiceCollection[];
  onSelect: (service: HomeServiceItem) => void;
  onLogin: () => void;
}) {
  const cartLines = useCartStore((s) => s.lines);
  const setCartLines = useCartStore((s) => s.setLines);
  const setCartQuote = useCartStore((s) => s.setQuote);
  const { token } = useUserAuthStore();
  const [addingServiceId, setAddingServiceId] = useState<string | number | null>(null);
  const livePool = uniqServices([
    ...popular,
    ...collections.flatMap((collection) => collection.items),
  ]);
  const fallbackPool = uniqServices([
    ...DEFAULT_POPULAR,
    ...DEFAULT_COLLECTIONS.flatMap((collection) => collection.items),
  ]);

  return (
    <div className="mt-4 grid gap-3">
      {grids.map((grid) => (
        <section
          key={grid.title}
          className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff] shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#f1f5f9] px-3.5 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-semibold text-[#0f172a]">
                {grid.title}
              </h2>
              <p className="mt-0.5 truncate text-[11.5px] text-[#64748b]">
                {grid.subtitle}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white"
              style={{ backgroundColor: grid.accent }}
            >
              {grid.badge}
            </span>
          </div>

          <div className="grid grid-cols-4 lg:grid-cols-8 gap-px bg-[#e2e8f0]">
            {grid.items.map((slot) => {
              const service = findQuickService(livePool, fallbackPool, slot.match, slot.label);
              const catalog = toCatalogService(service);
              const inCart = catalog
                ? cartLines.some((line) => String(line.service_id) === String(catalog.service_id))
                : false;
              const addKey = catalog?.service_id ?? `${grid.title}-${slot.label}`;
              const isAdding = String(addingServiceId) === String(addKey);
              const handleAdd = async () => {
                if (isAdding) {
                  return;
                }
                if (!token) {
                  onLogin();
                  return;
                }
                setAddingServiceId(addKey);
                try {
                  const serviceForCart = await resolveCatalogForCart(service);
                  if (!serviceForCart) return;
                  await addServiceToCartNow({
                    service: serviceForCart,
                    token,
                    setLines: setCartLines,
                    setQuote: setCartQuote,
                  });
                } finally {
                  setAddingServiceId(null);
                }
              };

              return (
                <div
                  key={`${grid.title}-${slot.label}`}
                  className="group flex min-h-[164px] flex-col bg-white p-2.5 text-left transition-colors hover:bg-[#f8fafc]"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(service)}
                    className="flex flex-1 flex-col text-left"
                  >
                    <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-[#f1f5f9]">
                      {service.image ? (
                        <Image
                          src={service.image}
                          alt=""
                          fill
                          unoptimized
                          className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                          sizes="(max-width: 640px) 25vw, 140px"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-[#94a3b8]">
                          <Wrench size={22} strokeWidth={1.6} />
                        </div>
                      )}
                    </div>
                    <span className="line-clamp-2 min-h-[30px] text-[11px] font-semibold leading-tight text-[#0f172a]">
                      {service.label}
                    </span>
                    <span className="mt-auto flex items-center justify-between gap-1 pt-2 text-[10.5px] text-[#64748b]">
                      <span className="font-bold text-[#0f172a]">
                        {service.price > 0 ? `Rs ${service.price}` : "View"}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock4 size={10} />
                        {service.time}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isAdding}
                    className={`mt-2 flex h-7 w-full items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-bold transition-colors ${
                      inCart
                        ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
                        : "border-[#cbd5e1] bg-white text-[#334155] hover:border-[#1d4ed8] hover:text-[#1d4ed8] disabled:opacity-60"
                    }`}
                  >
                    {isAdding ? (
                      <>
                        Adding <Loader2 size={12} className="animate-spin" />
                      </>
                    ) : inCart ? (
                      <>
                        Added <CheckCircle size={12} strokeWidth={2.5} />
                      </>
                    ) : (
                      <>
                        Add <Plus size={12} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function HomePageView(props: HomePageViewProps) {
  const { stats, promiseItems, steps, customerTypes, testimonials, serviceAreas, contactBanner, rating, emergencyServices, technicianBanner } = props;
  const router = useRouter();
  const { token, customer, hydrate: hydrateAuth, isHydrated } = useUserAuthStore();
  const { location, isDetecting, isModalOpen, openModal, hydrate, serviceability } = useLocationStore();
  const cartLines = useCartStore((s) => s.lines);
  const setCartLines = useCartStore((s) => s.setLines);
  const setCartQuote = useCartStore((s) => s.setQuote);
  const [showLogin, setShowLogin] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogService[]>([]);
  const [searchCats, setSearchCats] = useState<WebappSearchCategory[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [categories, setCategories] = useState<HomeServiceCategory[]>(DEFAULT_HOME_CATEGORIES);
  const [catLoading, setCatLoading] = useState(true);
  const [popular, setPopular] = useState<HomeServiceItem[]>(DEFAULT_POPULAR);
  const [collections, setCollections] = useState<HomeServiceCollection[]>(DEFAULT_COLLECTIONS);
  const [quickGrids, setQuickGrids] = useState<QuickGridConfig[]>(DEFAULT_QUICK_GRIDS);
  const [emergencySvcs, setEmergencySvcs] = useState<CatalogService[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);

  const EMERGENCY_COLORS = ["#f59e0b", "#3b82f6", "#0ea5e9", "#ef4444", "#8b5cf6", "#10b981"] as const;
  const resolvedEmergency: Array<{
    Icon: typeof Zap;
    label: string;
    sub: string;
    color: string;
    service?: CatalogService;
  }> = emergencyServices
    ? emergencyServices.map(({ iconName, label, sub, color }) => ({
        Icon: (ICON_MAP[iconName] ?? Zap) as typeof Zap,
        label, sub, color,
      }))
    : emergencySvcs.length > 0
      ? emergencySvcs.map((svc, i) => ({
          Icon: (ICON_MAP[svc.title.split(" ")[0]] ?? Zap) as typeof Zap,
          label: svc.title,
          sub: svc.price > 0 ? `₹${svc.price}` : "Quick response",
          color: EMERGENCY_COLORS[i % EMERGENCY_COLORS.length],
          service: svc,
        }))
      : EMERGENCY.map((e) => ({ ...e }));
  const [promoBanner, setPromoBanner] = useState<HomeCarouselSlide>(DEFAULT_CAROUSEL_SLIDES[0]);
  const [addingServiceId, setAddingServiceId] = useState<string | number | null>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { hydrate(); hydrateAuth(); }, []);

  // Load catalog — categories + service collections (grouped by category)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatLoading(true);
      try {
        const { categories: catRows, services } = await getWebappCatalog();
        if (!cancelled) {
          if (catRows.length > 0) setCategories(parseHomeCategories(catRows));
          if (services.length > 0) {
            const toItem = (s: CatalogService): HomeServiceItem => ({
              service_id: s.service_id,
              label: s.title,
              image: resolveServiceImageUrl(s.image) ?? null,
              price: s.price ?? 0,
              rating: s.rating ?? 0,
              reviews: 0,
              time: "30–60 min",
              badge: "",
              booking_types: s.booking_types,
              units: s.units,
              category_id: s.category_id,
            });
            const byCat = new Map<number, CatalogService[]>();
            for (const s of services) {
              if (s.category_id) {
                const arr = byCat.get(s.category_id) ?? [];
                arr.push(s);
                byCat.set(s.category_id, arr);
              }
            }
            const collRows: HomeServiceCollection[] = [];
            for (const [catId, svcs] of byCat) {
              if (collRows.length >= 3) break;
              if (svcs.length >= 2) {
                const catName = catRows.find((c) => c.category_id === catId)?.category_name;
                collRows.push({
                  title: catName ? catName + " Services" : svcs[0].title.split(" ")[0] + " Services",
                  category_id: catId,
                  items: svcs.slice(0, 6).map(toItem),
                });
              }
            }
            if (collRows.length > 0) setCollections(collRows);
          }
        }
      } catch { /* keep defaults */ }
      finally { if (!cancelled) setCatLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load most-booked services via dedicated popular-services endpoint
  useEffect(() => {
    let cancelled = false;
    setSvcLoading(true);
    getWebappPopularServices(12).then((svcs) => {
      if (!cancelled && svcs.length > 0) {
        setPopular(svcs.map((s) => ({
          service_id: s.service_id,
          label: s.title,
          image: resolveServiceImageUrl(s.image) ?? null,
          price: s.price ?? 0,
          rating: s.rating ?? 0,
          reviews: 0,
          time: "30–60 min",
          badge: "",
          booking_types: s.booking_types,
          units: s.units,
          category_id: s.category_id,
        })));
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setSvcLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Load emergency services from backend (is_emergency=true); fallback to hardcoded EMERGENCY
  useEffect(() => {
    let cancelled = false;
    getWebappEmergencyServices().then((svcs) => {
      if (!cancelled && svcs.length > 0) setEmergencySvcs(svcs);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load quick grids from backend (fallback to hardcoded defaults)
  useEffect(() => {
    let cancelled = false;
    getWebappQuickGrids().then((grids) => {
      if (!cancelled && grids.length > 0) setQuickGrids(grids);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchVal.trim()) { setSearchOpen(false); setSearchResults([]); setSearchCats([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchOpen(true);
      try {
        const { categories, services } = await searchWebapp(searchVal.trim(), 12);
        if (!cancelled) { setSearchResults(services); setSearchCats(categories); }
      } catch {
        if (!cancelled) { setSearchResults([]); setSearchCats([]); }
      }
      finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchVal]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await getHomeCarousel()) as { status?: boolean; result?: unknown; data?: unknown };
        if (!cancelled && res.status !== false) {
          const raw = Array.isArray(res.result ?? res.data) ? ((res.result ?? res.data) as Record<string, unknown>[]) : [];
          const bannerOnly = raw.filter((r) => String(r.announcement_type ?? r.promo_type ?? "").toUpperCase() === "BANNER");
          const parsed = parseHomeCarousel(bannerOnly);
          if (parsed.length > 0) setPromoBanner(parsed[0]);
        }
      } catch { /* keep default */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const triggerLogin = () => setShowLogin(true);
  // Fallback handler for ServiceCard (renders when catalog isn't loaded yet or service_id is missing)
  const handleBookService = async (item: HomeServiceItem) => {
    if (!token) { triggerLogin(); return; }
    const addKey = String(item.service_id ?? item.label);
    setAddingServiceId(addKey);
    try {
      const serviceForCart = await resolveCatalogForCart(item);
      if (serviceForCart) {
        await addServiceToCartNow({ service: serviceForCart, token, setLines: setCartLines, setQuote: setCartQuote });
        return;
      }
      if (item.service_id) {
        router.push(`/service/${item.service_id}`);
      } else {
        setSearchVal(item.label);
        setSearchOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setAddingServiceId(null);
    }
  };
  const handleQuickServiceSelect = (item: HomeServiceItem) => {
    if (item.service_id) {
      router.push(`/service/${item.service_id}`);
      return;
    }
    setSearchVal(item.label);
    setSearchOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openServiceSuggestions = () => {
    if (!searchVal.trim()) return;
    setSearchOpen(true);
  };
  const cityLabel = location?.city ?? "your area";
  const scroll = (key: string, dir: "l" | "r") => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: dir === "l" ? -280 : 280, behavior: "smooth" });
  };
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const homeContentLoading = catLoading && svcLoading;

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif" }}
    >
      <PublicHeader
        activePath="/"
        navItems={[
          { label: "Services", href: "/services" },
          { label: "Services by City", href: "/services-in" },
          { label: "Become a Partner", href: "/become-a-partner" },
        ]}
        showLocation
        showLogin
        showCart
        showBookingsLink
        showSupportLink
        showCta={false}
        showMobileCta={false}
        onLoginClick={triggerLogin}
      />
      <HomeCartHydrator />
      {showLogin && <UserLoginModal onClose={() => setShowLogin(false)} />}
      {isModalOpen && <LocationModal />}

      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-5">
        {/* Cart sidebar layout: flex row on desktop when cart has items */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            {homeContentLoading ? (
              <HomePageSkeleton showCollections={true} />
            ) : (
              <>
                {/* ── Row 1: Search + Promo ── */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-3">

                    {/* Greeting */}
                    <div>
                      {token ? (
                        <>
                          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#0f172a] leading-tight">
                            {greeting()},{" "}
                            <span className="text-[#1d4ed8]">{customer?.first_name ?? "there"}</span>
                          </h1>
                          <p className="mt-0.5 text-[13px] text-[#64748b]">
                            What service do you need today?
                          </p>
                        </>
                      ) : (
                        <>
                          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#0f172a] leading-tight">
                            Professional home services
                          </h1>
                          <p className="mt-0.5 text-[13px] text-[#64748b]">
                            in{" "}
                            <button
                              type="button"
                              onClick={openModal}
                              className="font-semibold text-[#1d4ed8] hover:underline"
                            >
                              {isDetecting ? "detecting…" : (location?.displayName ?? cityLabel)}
                            </button>
                          </p>
                        </>
                      )}
                    </div>

                    {/* Out-of-coverage banner */}
                    {serviceability?.checked && !serviceability.serviceable && (
                      <div className="flex items-center gap-3 rounded-lg border-l-4 border-[#d97706] bg-[#fffbeb] px-3 py-2.5">
                        <MapPinOff size={16} className="shrink-0 text-[#d97706]" />
                        <p className="flex-1 text-[12.5px] font-medium text-[#92400e]">
                          eFixMate doesn&apos;t serve{" "}
                          <span className="font-bold">{location?.displayName ?? "your area"}</span>{" "}
                          yet.
                        </p>
                        <button
                          type="button"
                          onClick={openModal}
                          className="shrink-0 text-[12px] font-bold text-[#d97706] hover:underline"
                        >
                          Change →
                        </button>
                      </div>
                    )}

                    {/* Search bar */}
                    <div className="relative" ref={searchRef}>
                      <div className="flex items-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff] shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/10 transition-all">
                        <Search size={15} className="ml-4 shrink-0 text-[#94a3b8]" />
                        <input
                          type="text"
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                          onFocus={() => { if (searchVal.trim()) setSearchOpen(true); }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") { setSearchOpen(false); setSearchVal(""); }
                            if (e.key === "Enter") openServiceSuggestions();
                          }}
                          placeholder="Search for AC repair, electrician, plumber..."
                          className="flex-1 bg-transparent px-3 py-3 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none"
                        />
                        {searchVal && (
                          <button
                            type="button"
                            onClick={() => { setSearchVal(""); setSearchOpen(false); }}
                            className="flex items-center justify-center self-stretch px-3 text-[#94a3b8] hover:text-[#475569]"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openServiceSuggestions}
                          className="flex items-center justify-center self-stretch bg-[#1d4ed8] px-5 hover:bg-[#1e40af] transition-colors"
                        >
                          <Search size={15} className="text-white" />
                        </button>
                      </div>

                      {/* Search results dropdown */}
                      {searchOpen && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
                          {searchLoading ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#64748b]">
                              <Loader2 size={14} className="animate-spin" />
                              Searching…
                            </div>
                          ) : searchCats.length > 0 || searchResults.length > 0 ? (
                            <div className="flex flex-col">
                              {searchCats.length > 0 && (
                                <div>
                                  <p className="px-4 pb-1.5 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                                    Categories
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
                                    {searchCats.map((cat) => (
                                      <button
                                        key={cat.category_id}
                                        type="button"
                                        onClick={() => {
                                          setSearchOpen(false);
                                          setSearchVal("");
                                          router.push(`/services?category_id=${cat.category_id}`);
                                        }}
                                        className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[12px] font-semibold text-[#334155] transition-colors hover:border-[#0e55d9] hover:bg-[#eef4ff] hover:text-[#0e55d9]"
                                      >
                                        {cat.category_name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {searchResults.length > 0 && (
                                <div className={`flex flex-col divide-y divide-[#f1f5f9] ${searchCats.length > 0 ? "border-t border-[#f1f5f9]" : ""}`}>
                                  <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                                    <span>Services</span>
                                    <span>{searchResults.length} found</span>
                                  </div>
                                  {searchResults.map((svc) => (
                                    <ExpandableServiceCard
                                      key={svc.service_id}
                                      service={svc}
                                      variant="row"
                                      isLoggedIn={!!token}
                                      onLoginRequired={triggerLogin}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="px-4 py-3 text-[13px] text-[#64748b]">
                              No results found for &ldquo;{searchVal}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Filter chips */}
                    {categories.length > 0 && (
                      <div className="hidden lg:flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                        {categories
                          .filter((c) => !c.is_more)
                          .slice(0, 6)
                          .map((item, i) => {
                            const { fg } = categoryColors(item.color, i);
                            const Icon = resolveCategoryIcon(item.icon, item.title);
                            return (
                              <Link
                                key={`${item.title}-${i}`}
                                href={categoryHref(item)}
                                className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#ffffff] px-3.5 py-1.5 text-[12px] font-medium hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-colors"
                                style={{ color: fg }}
                              >
                                <Icon size={13} strokeWidth={2} />
                                {item.title}
                              </Link>
                            );
                          })}
                      </div>
                    )}

                    {/* Category cards grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {categories.length > 0 ? (
                        categories.map((item, i) => (
                          <HomeCategoryCard
                            key={`${item.title}-${item.id ?? "more"}`}
                            item={item}
                            index={i}
                          />
                        ))
                      ) : (
                        <p className="col-span-full rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                          No service categories available yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Promo carousel */}
                  <HomeBannerCarousel onLoginClick={triggerLogin} />
                </div>

                {/* ── Row 2: Popular Services ── */}
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-[#0f172a]">Most Popular Services</h2>
                      <span className="rounded-full border border-[#e2e8f0] bg-[#ffffff] px-2 py-0.5 text-[10.5px] font-medium text-[#475569]">
                        Top booked
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scroll("popular", "l")}
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#e2e8f0] bg-[#ffffff] text-[#475569] hover:bg-[#f8fafc]"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scroll("popular", "r")}
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#e2e8f0] bg-[#ffffff] text-[#475569] hover:bg-[#f8fafc]"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <div
                    ref={(el) => { scrollRefs.current.popular = el; }}
                    className="flex items-start gap-3 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {popular.length > 0 ? (
                      popular.map((s, i) => {
                        const addKey = String(s.service_id ?? `${s.label}-${i}`);
                        return (
                          <HomeServiceCard
                            key={s.service_id ?? `${s.label}-${i}`}
                            item={s}
                            token={!!token}
                            onLogin={triggerLogin}
                            onBook={() => handleBookService(s)}
                            isAdding={String(addingServiceId) === addKey}
                            inCart={cartLines.some((l) => String(l.service_id) === String(s.service_id))}
                          />
                        );
                      })
                    ) : (
                      <p className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#ffffff] px-4 py-6 text-[13px] text-[#64748b]">
                        No popular services available. Try searching above.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Promo Poster Banner ── */}
                <div className="mt-4">
                  <HomePosterBanner slide={promoBanner} />
                </div>

                <QuickHomeGrids
                  grids={quickGrids}
                  popular={popular}
                  collections={collections}
                  onSelect={handleQuickServiceSelect}
                  onLogin={triggerLogin}
                />

                {/* Emergency Services */}
                <section className="mt-4 overflow-hidden rounded-lg border border-[#fecaca] bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_42%,#eff6ff_100%)] p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-semibold text-[#0f172a]">
                        Emergency Services
                      </h2>
                      <p className="mt-0.5 text-[11.5px] text-[#64748b]">
                        Priority help for urgent home issues
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#fecaca] bg-[linear-gradient(135deg,#fee2e2,#ffedd5)] px-2 py-0.5 text-[10.5px] font-semibold text-[#b91c1c]">
                      Fast response
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {resolvedEmergency.map((item) => {
                      const { Icon, label, sub, color, service } = item;
                      const cardStyle = {
                        background: `linear-gradient(135deg, ${color}1f 0%, #ffffff 54%, ${color}0f 100%)`,
                        borderColor: `${color}42`,
                      };

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            handleQuickServiceSelect({
                              service_id: service?.service_id,
                              label,
                              price: service?.price ?? 0,
                              rating: service?.rating ?? 0,
                              reviews: 0,
                              time: "30 min",
                              badge: "Emergency",
                              image: service?.image ?? null,
                              booking_types: service?.booking_types,
                              units: service?.units,
                              category_id: service?.category_id,
                            })
                          }
                          className="group flex min-h-[92px] items-center gap-3 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                          style={cardStyle}
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                            style={{ backgroundColor: color }}
                          >
                            <Icon size={20} strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[#0f172a]">
                              {label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-[#64748b]">
                              {sub}
                            </span>
                          </span>
                          <ChevronRight
                            size={15}
                            className="shrink-0 text-[#94a3b8] transition-colors group-hover:text-[#0f172a]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── Row 4: Service Collections ── */}
                {collections.length > 0 && (
                  <div className="w-full py-4">
                    <div
                      className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {collections.map((col) => (
                        <div
                          key={col.title}
                          className="min-w-[85vw] sm:min-w-[460px] max-w-[90vw] sm:max-w-[480px] shrink-0 snap-start rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-3 shadow-sm"
                        >
                          <div className="mb-2.5">
                            <h2 className="truncate text-[13px] font-semibold text-[#0f172a]">
                              {col.title}
                            </h2>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {col.items.map((s, i) => {
                              const catalog = toCatalogService(s);
                              const inCart = catalog
                                ? cartLines.some((line) => String(line.service_id) === String(catalog.service_id))
                                : false;
                              const addKey = catalog?.service_id ?? `${col.title}-${s.label}-${i}`;
                              const isAdding = String(addingServiceId) === String(addKey);
                              const handleAddToCart = async () => {
                                if (isAdding) {
                                  return;
                                }
                                if (!token) {
                                  triggerLogin();
                                  return;
                                }
                                setAddingServiceId(addKey);
                                try {
                                  const serviceForCart = await resolveCatalogForCart(s);
                                  if (!serviceForCart) return;
                                  await addServiceToCartNow({
                                    service: serviceForCart,
                                    token,
                                    setLines: setCartLines,
                                    setQuote: setCartQuote,
                                  });
                                } finally {
                                  setAddingServiceId(null);
                                }
                              };
                              const inner = (
                                <>
                                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-[#f1f5f9] bg-[#f1f5f9]">
                                    {s.image ? (
                                      <Image
                                        src={s.image}
                                        alt={s.label || ""}
                                        fill
                                        unoptimized
                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 640px) 25vw, 100px"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Wrench size={18} className="text-[#94a3b8]" strokeWidth={2} />
                                      </div>
                                    )}
                                  </div>
                                  <span className="line-clamp-2 h-7 w-full text-[10px] font-medium leading-tight text-[#475569]">
                                    {s.label}
                                  </span>
                                  <span className="flex h-4 w-full items-center justify-between gap-1 text-[9.5px] leading-none">
                                    <span className="truncate font-bold text-[#0f172a]">
                                      {s.price > 0 ? `Rs ${s.price}` : "View price"}
                                    </span>
                                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[#64748b]">
                                      <Clock4 size={9} />
                                      {s.time}
                                    </span>
                                  </span>
                                </>
                              );

                              return (
                                <div
                                  key={s.service_id ?? `${s.label}-${i}`}
                                  className="group flex min-w-0 flex-col gap-1.5 rounded-md p-1 text-center transition-colors hover:bg-[#f8fafc]"
                                >
                                  {s.service_id ? (
                                    <Link
                                      href={`/service/${s.service_id}`}
                                      className="flex min-w-0 flex-col items-center gap-1.5"
                                    >
                                      {inner}
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleBookService(s)}
                                      className="flex min-w-0 flex-col items-center gap-1.5"
                                    >
                                      {inner}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    className={`flex h-7 w-full items-center justify-center gap-1 rounded-md border px-1.5 text-[10.5px] font-bold transition-colors ${
                                      inCart
                                        ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
                                        : "border-[#cbd5e1] bg-white text-[#334155] hover:border-[#1d4ed8] hover:text-[#1d4ed8] disabled:opacity-60"
                                    }`}
                                  >
                                    {isAdding ? (
                                      <>
                                        Adding <Loader2 size={12} className="animate-spin" />
                                      </>
                                    ) : inCart ? (
                                      <>
                                        Added <CheckCircle size={12} strokeWidth={2.5} />
                                      </>
                                    ) : (
                                      <>
                                        Add <Plus size={12} strokeWidth={2.5} />
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technician Join Banner */}
                <section className="mt-6 overflow-hidden rounded-lg border border-[#bbf7d0] bg-[#052e16] shadow-sm">
                  <div className="grid min-h-[260px] lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-10">
                      <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#86efac]/40 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#bbf7d0]">
                        <ShieldCheck size={13} />
                        {technicianBanner?.badge ?? "Partner with eFixMate"}
                      </div>
                      <h2 className="max-w-xl text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[1.875rem]">
                        {technicianBanner?.heading ?? "Skilled technician? Grow your monthly income with verified service jobs."}
                      </h2>
                      <p className="mt-3 max-w-lg text-[14px] leading-[1.8] text-[#dcfce7]/80">
                        {technicianBanner?.subtext ?? "Join the eFixMate partner network, complete OTP-based registration, and start receiving nearby service requests after approval."}
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/technician/login"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-6 text-[14px] font-semibold text-[#14532d] shadow-sm transition hover:bg-[#f0fdf4]"
                        >
                          {technicianBanner?.cta_primary ?? "Join as Technician"}
                          <ArrowRight size={16} />
                        </Link>
                        <Link
                          href="/technician"
                          className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 px-6 text-[14px] font-medium text-white transition hover:bg-white/10"
                        >
                          {technicianBanner?.cta_secondary ?? "View partner details"}
                        </Link>
                      </div>
                    </div>

                    <Link
                      href="/technician/login"
                      aria-label="Join as Technician"
                      className="relative min-h-[240px] overflow-hidden bg-[#064e3b] lg:min-h-full"
                    >
                      <Image
                        src="/asssets/landing/home/technician-join-banner.webp"
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#052e16]/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#052e16]/30 lg:to-transparent" />
                    </Link>
                  </div>
                </section>
              </>
            )}

            {/* Services by city redirect */}
            <section className="mt-6 border-t border-[#f1f5f9] px-4 py-6 sm:px-6">
              <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-black text-[#0f172a]">Services by city</p>
                  <p className="mt-0.5 text-[12px] text-[#64748b]">
                    Browse all city-wise eFixMate service pages in one place.
                  </p>
                </div>
                <Link
                  href="/services-in"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0e55d9] px-4 text-[12px] font-black text-[#ffffff] shadow-sm transition-colors hover:bg-[#0a46b8]"
                >
                  View city pages <ArrowRight size={14} />
                </Link>
              </div>
            </section>

            {/* ── Footer ── */}
          </div>{/* end flex-1 main content */}

          {/* Cart sidebar — desktop only, visible when cart has items */}
          {cartLines.length > 0 && (
            <div className={`hidden lg:block shrink-0 self-stretch transition-[width] duration-200 ${cartSidebarOpen ? "w-[380px]" : "w-9"}`}>
              <div className="sticky top-[56px]">
                {cartSidebarOpen ? (
                  <>
                    <button
                      onClick={() => setCartSidebarOpen(false)}
                      className="mb-1.5 ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    >
                      <ChevronRight size={13} />
                      <span>Hide</span>
                    </button>
                    <div className="max-h-[calc(100vh-80px)] overflow-y-auto">
                      <CartDrawer />
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setCartSidebarOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-[#0e55d9] px-2.5 py-3 text-white shadow-md hover:bg-[#0a47c0]"
                  >
                    <ShoppingCart size={15} />
                    <span className="text-[10px] font-black leading-none">
                      {cartLines.reduce((s, l) => s + l.quantity, 0)}
                    </span>
                    <ChevronLeft size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>{/* end flex row */}
      </div>

      {/* Mobile: floating cart bar (desktop uses the sidebar instead) */}
      <div className="lg:hidden">
        <StickyCartBar bottomClass="bottom-16" hiddenOnPaths={["/payment"]} />
      </div>
      <LandingFooter />
    </div>
  );
}
