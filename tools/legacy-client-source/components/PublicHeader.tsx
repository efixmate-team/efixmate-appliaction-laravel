"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, Headphones, Loader2, MapPin, Menu, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useLocationStore } from "@/store/location.store";
import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";

export type PublicNavItem = { label: string; href: string };
export type PublicHeaderCta = { label: string; href: string };

const DEFAULT_NAV: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Services by City", href: "/services-in" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
];

export type PublicHeaderProps = {
  activePath?: string;
  navItems?: PublicNavItem[];
  cta?: PublicHeaderCta | null;
  showBrandName?: boolean;
  showNav?: boolean;
  showCta?: boolean;
  showMobileCta?: boolean;
  showLocation?: boolean;
  showLogin?: boolean;
  showCart?: boolean;
  showBookingsLink?: boolean;
  showSupportLink?: boolean;
  onLoginClick?: () => void;
  rightSlot?: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function PublicHeader({
  activePath = "",
  navItems = DEFAULT_NAV,
  cta = { label: "Book a Service", href: "/services" },
  showBrandName = true,
  showNav = true,
  showCta = true,
  showMobileCta = true,
  showLocation = false,
  showLogin = false,
  showCart = false,
  showBookingsLink = false,
  showSupportLink = false,
  onLoginClick,
  rightSlot,
  className = "",
  containerClassName = "max-w-[1440px]",
}: PublicHeaderProps) {
  const { token, customer } = useUserAuthStore();
  const { location, isDetecting, openModal } = useLocationStore();
  const cartLines = useCartStore((state) => state.lines);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const visibleItems = showNav ? navItems : [];
  const cartItemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (!activePath) return false;
    return activePath === href || (href !== "/" && activePath.startsWith(href));
  };

  return (
    <header
      className={`sticky top-0 z-50 shrink-0 border-b border-[#e2e8f0] bg-[#ffffff]/95 transition-shadow backdrop-blur ${
        scrolled ? "shadow-[0_12px_30px_rgba(15,41,92,0.08)]" : ""
      } ${className}`}
    >
      <div className={`mx-auto flex h-[48px] min-w-0 w-[90%] ${containerClassName} items-center gap-2 sm:h-[52px] sm:gap-3`}>
        <Link href="/" className="mr-1 flex min-w-0 shrink-0 items-center gap-1.5 sm:mr-3" aria-label="eFixMate home">
          <BrandLogo width={24} height={24} className="h-6 w-6" priority />
          {showBrandName && (
            <span className="hidden text-[16px] font-semibold text-[#0f172a] sm:block sm:text-[17px]">
              eFixMate
            </span>
          )}
        </Link>

        {showLocation && (
          <button
            type="button"
            onClick={openModal}
            className="flex min-w-0 max-w-[38vw] items-center gap-1 text-[12px] font-medium text-[#475569] transition-colors hover:text-[#1d4ed8] sm:max-w-[150px] sm:gap-1.5 sm:text-[13px]"
          >
            {isDetecting ? (
              <Loader2 size={14} className="shrink-0 animate-spin text-[#1d4ed8]" />
            ) : (
              <MapPin size={14} className="shrink-0 text-[#1d4ed8]" />
            )}
            <span className="truncate">{location?.displayName ?? "Select location"}</span>
            <ChevronDown size={13} className="shrink-0 text-[#94a3b8]" />
          </button>
        )}

        <div className="min-w-0 flex-1" />

        {visibleItems.length > 0 && (
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#eef5ff] text-[#0e55d9]"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showBookingsLink && token && (
              <Link
                href="/bookings"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <CalendarDays size={14} className="shrink-0" />
                My Bookings
              </Link>
            )}
            {showSupportLink && (
              <Link
                href="/contact-us"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <Headphones size={14} className="shrink-0" />
                Support
              </Link>
            )}
          </nav>
        )}

        {(showLogin || showCart || rightSlot || (showCta && cta)) && (
          <div className="mx-2 hidden h-5 w-px bg-[#e2e8f0] lg:block" />
        )}

        <div className="hidden items-center gap-3 lg:flex">
          {rightSlot}
          {showLogin && (
            token ? (
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
            )
          )}
          {showCart && (
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
          )}
          {showCta && cta && (
            <Link
              href={cta.href}
              className="rounded-[8px] bg-[#0e55d9] px-4 py-2 text-[13px] font-bold text-[#ffffff] transition hover:bg-[#0b44b0]"
            >
              {cta.label}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {showLogin && (
            token ? (
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
            )
          )}
          {showCart && (
            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#475569]"
              aria-label="Cart"
            >
              <ShoppingCart size={16} />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e55d9] px-1 text-[9px] font-black text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {(visibleItems.length > 0 || showBookingsLink || showSupportLink || (showMobileCta && cta)) && (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#dbe6ff] text-[#0e55d9] lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-[#edf2ff] bg-[#ffffff] px-5 py-4 shadow-[0_16px_32px_rgba(15,41,92,0.12)] lg:hidden">
          <div className={`mx-auto flex w-[90%] ${containerClassName} flex-col gap-1`}>
            {visibleItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-[14px] font-semibold ${
                  isActive(item.href) ? "bg-[#eef5ff] text-[#0e55d9]" : "text-[#06113f]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showBookingsLink && token && (
              <Link
                href="/bookings"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-semibold text-[#06113f]"
              >
                My Bookings
              </Link>
            )}
            {showSupportLink && (
              <Link
                href="/contact-us"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-semibold text-[#06113f]"
              >
                Support
              </Link>
            )}
            {showMobileCta && cta && (
              <Link
                href={cta.href}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-[8px] bg-[#0e55d9] px-4 py-3 text-center text-[13px] font-bold text-[#ffffff]"
              >
                {cta.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
