"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getHomeOffers } from "@/lib/api/userClient";
import {
  type HomeCarouselSlide,
  DEFAULT_CAROUSEL_SLIDES,
  parseHomeCarousel,
  carouselImageUrl,
  carouselCtaHref,
  carouselGradient,
} from "@/lib/homeCarousel";

const DEFAULT_OFFER_BANNER: HomeCarouselSlide = {
  id: 0,
  title: "Save More on Every Service",
  subtitle: "Exclusive deals",
  description: "Apply coupon codes at checkout and save instantly.",
  button_text: "Explore Offers",
  button_action: { type: "OPEN_CATEGORY", value: "" },
  image: "",
  background_color: "#1E3A8A",
};

function BannerSkeleton() {
  return (
    <div className="mb-6 h-[140px] animate-pulse rounded-2xl bg-[#dbeafe]/60 sm:h-[156px]" />
  );
}

export function OffersHeroBanner() {
  const [slide, setSlide] = useState<HomeCarouselSlide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await getHomeOffers()) as {
          status?: boolean;
          result?: unknown;
          data?: unknown;
        };
        if (!cancelled && res.status !== false) {
          const parsed = parseHomeCarousel(res.result ?? res.data);
          if (parsed.length > 0) setSlide(parsed[0]);
        }
      } catch {
        /* keep default */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <BannerSkeleton />;

  const active = slide ?? DEFAULT_OFFER_BANNER;
  const imgUrl = carouselImageUrl(active.image);
  const href = carouselCtaHref(active);

  return (
    <Link
      href={href}
      className="relative mb-6 flex h-[140px] overflow-hidden rounded-2xl shadow-md sm:h-[156px]"
      style={{ background: carouselGradient(active.background_color) }}
    >
      {/* Background image */}
      {imgUrl && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imgUrl})` }}
          aria-hidden
        />
      )}

      {/* Left-to-right scrim for text readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.08) 76%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Subtle dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex max-w-[72%] flex-col justify-center gap-0.5 px-5 py-4 sm:px-6">
        {active.subtitle && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fcd34d]">
            {active.subtitle}
          </span>
        )}
        <h2 className="text-[17px] font-black leading-tight text-[#ffffff] sm:text-[19px]">
          {active.title}
        </h2>
        {active.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-[#ffffff]/75">
            {active.description}
          </p>
        )}
        <div className="mt-3">
          <span
            className="inline-flex items-center gap-1 rounded-lg bg-[#ffffff] px-3 py-1.5 text-[11px] font-black"
            style={{ color: active.background_color || "#1E3A8A" }}
          >
            {active.button_text}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
