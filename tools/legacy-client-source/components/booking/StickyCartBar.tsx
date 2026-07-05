"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { AnimatedAmount } from "./AnimatedAmount";

type Props = {
  /** Extra bottom offset when mobile bottom nav is visible (px class) */
  bottomClass?: string;
  hiddenOnPaths?: string[];
};

export function StickyCartBar({
  bottomClass = "bottom-16",
  hiddenOnPaths = ["/payment"],
}: Props) {
  const pathname = usePathname();
  const { lines, quote } = useCartStore();

  if (!lines.length) return null;
  if (hiddenOnPaths.some((p) => pathname.startsWith(p))) return null;

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = quote?.total ?? lines.reduce((s, l) => s + l.line_total, 0);

  return (
    <div
      className={`fixed left-0 right-0 z-[45] transition-transform duration-300 ease-out ${bottomClass}`}
    >
      <div className="mx-auto max-w-7xl px-3 pb-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#0e55d9]/20 bg-[#ffffff]/95 px-4 py-3 shadow-[0_8px_32px_rgba(14,85,217,0.18)] backdrop-blur-md">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]">
            <ShoppingCart size={18} className="text-[#0e55d9]" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e55d9] px-1 text-[9px] font-black text-[#ffffff]">
              {itemCount}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[#64748b]">
              {itemCount} service{itemCount !== 1 ? "s" : ""} added
            </p>
            <AnimatedAmount
              value={subtotal}
              className="text-[17px] font-black text-[#0f172a]"
            />
          </div>

          <Link
            href="/cart"
            className="hidden shrink-0 text-[12px] font-bold text-[#0e55d9] sm:block"
          >
            View Details
          </Link>

          <Link
            href="/cart"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0e55d9] px-4 py-2.5 text-[13px] font-black text-[#ffffff] shadow-[0_4px_16px_rgba(14,85,217,0.3)] transition-transform active:scale-[0.98]"
          >
            Proceed
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
