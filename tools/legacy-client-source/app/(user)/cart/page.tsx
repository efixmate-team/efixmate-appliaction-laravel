"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { CartDrawer } from "@/components/booking/CartDrawer";

export default function CartPage() {
  const { lines } = useCartStore();
  const router = useRouter();

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef4ff] mb-5">
          <ShoppingCart size={36} className="text-[#0e55d9]" />
        </div>
        <h1 className="text-[22px] font-black text-[#0f172a] mb-2">Your cart is empty</h1>
        <p className="text-[14px] text-[#64748b] max-w-xs mb-8">
          Browse our services and add one to get started.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-[#0e55d9] px-6 py-3.5 text-[14px] font-black text-white shadow-[0_4px_16px_rgba(14,85,217,0.28)] transition-transform active:scale-[0.98]"
        >
          Browse Services
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-[22px] font-black text-[#0f172a]">Cart</h1>
        <p className="text-[13px] text-[#64748b] mt-0.5">
          Review your services, choose address, date, and time slot, then proceed to payment.
        </p>
      </div>
      <CartDrawer onClose={() => router.back()} />
    </div>
  );
}
