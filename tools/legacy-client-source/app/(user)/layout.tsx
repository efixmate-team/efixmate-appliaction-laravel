"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronDown, Gift, Headphones, Home, Loader2, MapPin, ShoppingCart, Tag, User } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useUserAuthStore } from "@/store/userAuth.store";
import { useLocationStore } from "@/store/location.store";
import { useCartStore } from "@/store/cart.store";
import { getCart } from "@/lib/api/userClient";
import { parseCartSummary } from "@/lib/booking";
import UserAuthProvider from "@/providers/UserAuthProvider";
import LocationProvider from "@/providers/LocationProvider";
import dynamic from "next/dynamic";
import { StickyCartBar } from "@/components/booking/StickyCartBar";

// Lazy-load the modal so it doesn't block initial render
const LocationModal = dynamic(
  () => import("./_components/LocationModal"),
  { ssr: false }
);

// ─── User Header (matches home screen SiteHeader) ─────────────────────────────

function UserHeader() {
  const { customer, token, isHydrated } = useUserAuthStore();
  const loggedIn = isHydrated && !!token;
  const { location, isDetecting, openModal } = useLocationStore();
  const cartCount = useCartStore((s) => s.lines.length);
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-[#f3f4f6] bg-[#ffffff] transition-shadow ${
        scrolled ? "shadow-[0_1px_8px_rgba(0,0,0,0.08)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[52px] min-w-0 max-w-[1440px] items-center gap-2 px-3 sm:h-[56px] sm:gap-3 sm:px-4 lg:px-8">

        {/* Logo */}
        <Link href="/" className="mr-1 flex shrink-0 items-center gap-1.5 sm:mr-3">
          <BrandLogo width={28} height={28} className="h-7 w-7" />
          <span className="hidden text-[17px] font-black  text-[#2563eb] sm:block sm:text-[18px]">
            eFixMate
          </span>
        </Link>

        {/* Location */}
        <button
          type="button"
          onClick={openModal}
          className="flex min-w-0 max-w-[36vw] items-center gap-1 text-[12px] font-semibold text-[#1f2937] transition-colors hover:text-[#2563eb] sm:max-w-[130px] sm:gap-1.5 sm:text-[13px]"
        >
          {isDetecting ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-[#2563eb]" />
          ) : (
            <MapPin size={14} className="shrink-0 text-[#2563eb]" />
          )}
          <span className="truncate">{location?.displayName ?? "Select location"}</span>
          <ChevronDown size={13} className="shrink-0 text-[#9ca3af]" />
        </button>

        <div className="min-w-0 flex-1" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
            <Link
            href="/offers"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#fff1f2]"
          >
            <Gift size={15} className="shrink-0" />
            Offers
          </Link>
          {loggedIn && (
            <Link
              href="/bookings"
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] hover:text-[#2563eb]"
            >
              <CalendarDays size={15} className="shrink-0" />
              My Bookings
            </Link>
          )}
          <Link
            href="/contact"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] hover:text-[#2563eb]"
          >
            <Headphones size={15} className="shrink-0" />
            Support
          </Link>
        </nav>

        <div className="mx-2 hidden h-5 w-px bg-[#e5e7eb] lg:block" />

        {/* Cart */}
        <Link
          href="/cart"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e5e7eb] bg-[#f9fafb] transition-colors hover:border-[#93c5fd] hover:bg-[#eff6ff]"
        >
          <ShoppingCart size={17} className="text-[#374151]" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-[9px] font-black text-[#ffffff]">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>

        {/* Desktop: profile / login */}
        <div className="hidden items-center lg:flex">
          {loggedIn ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] px-3.5 py-1.5 text-[13px] font-semibold text-[#374151] transition-colors hover:border-[#93c5fd] hover:text-[#2563eb]"
            >
              <UserAvatar customer={customer} size="sm" className="ring-0" />
              {customer?.first_name ?? "Profile"}
              <ChevronDown size={12} className="text-[#9ca3af]" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full border border-[#d1d5db] bg-[#ffffff] px-4 py-2 text-[13px] font-semibold text-[#1f2937] transition-colors hover:border-[#eff6ff] hover:text-[#2563eb]"
            >
              <User size={14} className="shrink-0 text-[#344352]" />
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile: avatar or login icon */}
        <div className="flex shrink-0 items-center lg:hidden">
          {loggedIn ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-[#e5e7eb]"
            >
              <UserAvatar customer={customer} size="sm" className="ring-0" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              aria-label="Login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] text-[#4b5563]"
            >
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/",          Icon: Home,         label: "Home", authOnly: false },
  { href: "/bookings",  Icon: CalendarDays,  label: "Bookings", authOnly: true },
  { href: "/offers",    Icon: Tag,           label: "Offers", authOnly: false },
  { href: "/profile",   Icon: User,          label: "Profile", authOnly: true },
] as const;

function BottomNav() {
  const pathname = usePathname();
  const { token, isHydrated } = useUserAuthStore();
  const loggedIn = isHydrated && !!token;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e2e8f0] bg-[#ffffff]/96 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around px-2 pb-2 pt-1.5">
        {NAV_ITEMS.filter((item) => !item.authOnly || loggedIn).map(({ href, Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${active ? "bg-[#eef4ff]" : ""}`}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.7}
                  className={active ? "text-[#0e55d9]" : "text-[#94a3b8]"} />
              </div>
              <span className={`text-[9.5px] font-semibold ${active ? "text-[#0e55d9]" : "text-[#94a3b8]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Cart sync ────────────────────────────────────────────────────────────────

function CartHydrator() {
  const { token, isHydrated } = useUserAuthStore();
  const { setLines, setCartId, setQuote, syncFromSummary } = useCartStore();

  useEffect(() => {
    if (!isHydrated || !token) return;
    (async () => {
      try {
        const res = await getCart();
        const { summary, lines, quote } = parseCartSummary(res);
        if (lines.length) setLines(lines);
        if (summary) {
          setCartId(summary.cart_id);
          syncFromSummary(summary);
        }
        if (quote) setQuote(quote);
      } catch {
        /* guest or no cart */
      }
    })();
  }, [isHydrated, token, setLines, setCartId, setQuote, syncFromSummary]);

  return null;
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useUserAuthStore();
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    const requiresAuth = ["/bookings", "/profile", "/payment"].some((p) => pathname.startsWith(p));
    if (requiresAuth && !token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, token, pathname]);

  return <>{children}</>;
}


// ─── Layout ───────────────────────────────────────────────────────────────────

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { isModalOpen } = useLocationStore();

  return (
    <UserAuthProvider>
      <LocationProvider>
        <AuthGuard>
          <CartHydrator />
          <div className="flex min-h-screen flex-col bg-[#f0f4ff]">
            <UserHeader />
            {isModalOpen && <LocationModal />}
            <main className="mx-auto w-full max-w-7xl flex-1">
              {children}
            </main>
            <SiteFooter mobileNav />
            <BottomNav />
            <StickyCartBar />
          </div>
        </AuthGuard>
      </LocationProvider>
    </UserAuthProvider>
  );
}
