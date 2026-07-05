"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Tag } from "lucide-react";
import { getCoupons } from "@/lib/api/userClient";
import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import { CouponCard } from "./_components/CouponCard";
import { OffersHeroBanner } from "./_components/OffersHeroBanner";
import { OffersSidebar } from "./_components/OffersSidebar";
import {
  DEMO_OFFERS,
  filterByTab,
  OFFER_TABS,
  parseApiCoupons,
  type OfferCoupon,
  type OfferTabId,
} from "./_lib/offersData";

function CouponCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#ffffff] shadow-sm">
      <div className="flex items-center">
        <div className="h-[90px] w-[90px] shrink-0 animate-pulse bg-[#e5e7eb] sm:w-[100px]" />
        <div className="flex min-w-0 flex-1 items-center gap-3 p-4 sm:gap-5 sm:pr-5">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-20 animate-pulse rounded-full bg-[#f3f4f6]" />
            <div className="h-5 w-44 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-[#f3f4f6]" />
            <div className="flex gap-4">
              <div className="h-3 w-20 animate-pulse rounded bg-[#f3f4f6]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[#f3f4f6]" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:w-[136px] sm:items-stretch">
            <div className="h-6 w-24 animate-pulse rounded-full bg-[#f3f4f6]" />
            <div className="h-9 w-28 animate-pulse rounded-xl bg-[#e5e7eb] sm:w-full" />
            <div className="h-4 w-20 animate-pulse self-center rounded bg-[#f3f4f6]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OffersPageSkeleton() {
  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-[#e5e7eb]" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e5e7eb]" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded bg-[#f3f4f6]" />
          </div>
        </div>
      </header>
      <div className="mb-6 h-44 animate-pulse rounded-2xl bg-[#dbeafe]/50" />
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[#f3f4f6]" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <CouponCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function OffersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightCode = (searchParams.get("coupon") ?? "").trim().toUpperCase();

  const { token, isHydrated } = useUserAuthStore();
  const setCoupon = useCartStore((s) => s.setCoupon);

  const [activeTab, setActiveTab] = useState<OfferTabId>("all");
  const [coupons, setCoupons] = useState<OfferCoupon[]>(DEMO_OFFERS);
  const [loading, setLoading] = useState(true);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!token) {
        if (!cancelled) {
          setCoupons(DEMO_OFFERS);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await getCoupons();
        const parsed = parseApiCoupons(res);
        if (!cancelled) {
          setCoupons(parsed.length > 0 ? parsed : DEMO_OFFERS);
        }
      } catch {
        if (!cancelled) setCoupons(DEMO_OFFERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isHydrated]);

  const visible = useMemo(
    () => filterByTab(coupons, activeTab),
    [coupons, activeTab]
  );

  const handleApply = useCallback(
    (code: string, maxSavings: number) => {
      if (!token) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/offers?coupon=${code}`)}`
        );
        return;
      }
      setApplyingCode(code);
      setCoupon(code, maxSavings);
      setToast(`${code} added — complete checkout in your cart.`);
      setApplyingCode(null);
      router.push("/");
    },
    [token, router, setCoupon]
  );

  useEffect(() => {
    if (!highlightCode || !isHydrated) return;
    const match = coupons.find((c) => c.code === highlightCode);
    if (match) {
      const tab =
        match.tabs.find((t) => t !== "all") ?? ("all" as OfferTabId);
      setActiveTab(tab);
    }
  }, [highlightCode, coupons, isHydrated]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:py-8">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#111827] px-5 py-3 text-[13px] font-semibold text-[#ffffff] shadow-xl lg:bottom-8"
        >
          <Check className="h-4 w-4 shrink-0 text-[#34d399]" />
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb] text-[#ffffff] shadow-md">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[16px] font-black  text-[#111827] sm:text-[20px]">
              Coupons &amp; Offers
            </h1>
            <p className="mt-0.5 text-[14px] text-[#6b7280]">
              Save more on your home services
            </p>
          </div>
        </div>
      </header>

      <OffersHeroBanner />

      {/* Tab navigation */}
      <nav
        className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        aria-label="Coupon categories"
      >
        {OFFER_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                active
                  ? "bg-[#2563eb] text-[#ffffff] shadow-sm"
                  : "bg-[#ffffff] text-[#6b7280] ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb] hover:text-[#374151]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <CouponCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-[#ffffff] px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f6]">
                <Tag className="h-6 w-6 text-[#9ca3af]" />
              </div>
              <p className="text-[15px] font-bold text-[#1f2937]">
                No coupons in this category
              </p>
              <p className="mt-1 text-[13px] text-[#9ca3af]">
                Try another tab or check back soon for new offers.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="mt-4 rounded-full bg-[#eff6ff] px-5 py-2 text-[13px] font-bold text-[#2563eb] hover:bg-[#dbeafe]"
              >
                View all coupons
              </button>
            </div>
          ) : (
            visible.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onApply={handleApply}
                applying={applyingCode === coupon.code}
                highlighted={!!highlightCode && coupon.code === highlightCode}
              />
            ))
          )}

          {!token && !loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#dbeafe] bg-[#eff6ff]/50 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                <Tag className="h-4 w-4" />
              </div>
              <p className="text-[12px] text-[#6b7280]">
                <Link
                  href="/login"
                  className="font-bold text-[#2563eb] hover:underline"
                >
                  Sign in
                </Link>{" "}
                to see personalised coupons and apply them at checkout.
              </p>
            </div>
          )}
        </section>

        <OffersSidebar />
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<OffersPageSkeleton />}>
      <OffersPageContent />
    </Suspense>
  );
}
