/** @format */
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getHomeCarousel } from "@/lib/api/userClient";
import {
  type HomeCarouselSlide,
  DEFAULT_CAROUSEL_SLIDES,
  parseHomeCarousel,
  carouselImageUrl,
  carouselCtaHref,
  carouselGradient,
} from "@/lib/homeCarousel";

const AUTO_MS = 5000;
const SLIDE_HEIGHT = "min-h-[280px] sm:min-h-[300px]";

type Props = {
  onLoginClick?: () => void;
};

function CarouselSlide({
  slide,
  onLoginClick,
  isFirst = false,
}: {
  slide: HomeCarouselSlide;
  onLoginClick?: () => void;
  isFirst?: boolean;
}) {
  const imgUrl = carouselImageUrl(slide.image);
  const href = carouselCtaHref(slide);
  const isExternal = /^https?:\/\//i.test(href);

  const CtaButton = ({ className }: { className: string }) => {
    const inner = (
      <>
        {slide.button_text} <ArrowRight size={15} />
      </>
    );
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {inner}
        </a>
      );
    }
    if (href === "/services" && !slide.button_action.value && onLoginClick) {
      return (
        <button type="button" onClick={onLoginClick} className={className}>
          {inner}
        </button>
      );
    }
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl text-[#ffffff] ${SLIDE_HEIGHT}`}
      style={{ background: carouselGradient(slide.background_color) }}
    >
      {imgUrl && (
        <Image
          src={imgUrl}
          alt=""
          fill
          className="object-cover"
          priority={isFirst}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      )}

      {/* Left scrim so text stays readable over the background image */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0.08) 68%, transparent 100%)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden
      />

      <div className={`relative z-10 flex h-full flex-col justify-between p-5 lg:p-6 max-w-[72%] sm:max-w-[62%]`}>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffffff]/25 bg-[#ffffff]/15 px-3 py-1 backdrop-blur-sm">
          <Star size={12} className="text-[#fcd34d]" fill="currentColor" />
          <span className="text-[12px] font-bold text-[#ffffff]">4.8/5</span>
          <span className="text-[11px] text-[#ffffff]/70">|</span>
          <span className="text-[12px] font-semibold text-[#ffffff]/90">25K+ Happy Customers</span>
        </div>

        <div className="my-3 flex-1">
          <h2 className="text-[22px] font-black leading-tight text-[#ffffff] sm:text-[26px] lg:text-[30px]">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="mt-1.5 text-[13px] font-semibold text-[#fcd34d]">{slide.subtitle}</p>
          )}
          {slide.description && (
            <p className="mt-1 text-[12px] text-[#ffffff]/75 leading-relaxed line-clamp-2">
              {slide.description}
            </p>
          )}
        </div>

        <CtaButton className="flex w-fit items-center gap-2 rounded-xl bg-[#ffffff] px-5 py-2.5 text-[13.5px] font-black text-[#2563eb] shadow-[0_4px_16px_rgba(0,0,0,0.20)] hover:bg-[#eff6ff] transition-colors" />
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return <div className={`animate-pulse rounded-2xl bg-[#e5e7eb] ${SLIDE_HEIGHT}`} />;
}

export default function HomeBannerCarousel({ onLoginClick }: Props) {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>(DEFAULT_CAROUSEL_SLIDES);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = (await getHomeCarousel()) as {
          status?: boolean;
          result?: unknown;
          data?: unknown;
        };
        if (!cancelled && res.status !== false) {
          const parsed = parseHomeCarousel(res.result ?? res.data);
          if (parsed.length > 0) setSlides(parsed);
        }
      } catch {
        /* keep defaults */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (loading) return <CarouselSkeleton />;

  return (
    <div className={`relative ${SLIDE_HEIGHT}`}>
      <div className="relative h-full overflow-hidden rounded-2xl">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={i !== active}
          >
            <CarouselSlide slide={slide} onLoginClick={onLoginClick} isFirst={i === 0} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-[#ffffff]" : "w-1.5 bg-[#ffffff]/50 hover:bg-[#ffffff]/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}