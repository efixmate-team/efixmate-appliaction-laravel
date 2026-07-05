"use client";

import { useState } from "react";
import { Plus, Check, Star, Wrench, ShoppingBag, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { addCartLine, ensureCart } from "@/lib/api/userClient";
import { parseCartSummary } from "@/lib/booking";
import { useUserAuthStore } from "@/store/userAuth.store";
import { defaultServiceConfig } from "./ServiceConfigPanel";
import type { CatalogService } from "./bookingTypes";

type Props = {
  service: CatalogService;
  variant?: "card" | "row";
  onAdded?: () => void;
  onLoginRequired?: () => void;
  isLoggedIn?: boolean;
};

export function ExpandableServiceCard({
  service,
  variant = "card",
  onAdded,
  onLoginRequired,
}: Props) {
  const router = useRouter();
  const { token } = useUserAuthStore();
  const { lines, setLines, setQuote } = useCartStore();
  const inCart = lines.some((l) => String(l.service_id) === String(service.service_id));
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    if (!token) {
      onLoginRequired?.();
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const config = defaultServiceConfig(
        service.booking_types ?? [],
        service.units ?? [],
        service.price,
      );
      const cartRes = await ensureCart() as { status: boolean; message?: string; code?: string };
      if (!cartRes.status) {
        if (cartRes.message?.toLowerCase().includes("session") || cartRes.code === "UNAUTH") {
          onLoginRequired?.();
        } else {
          setAddError(cartRes.message ?? "Could not create cart. Try again.");
        }
        return;
      }
      const lineRes = await addCartLine({
        service_id: service.service_id,
        booking_type_id: config.bookingTypeId,
        unit_id: config.unitId,
        quantity: config.quantity,
      }) as { status: boolean; message?: string; lines?: unknown[]; quote?: unknown };
      if (!lineRes.status) {
        setAddError(lineRes.message ?? "Could not add service. Try again.");
        return;
      }
      const { lines: apiLines, quote } = parseCartSummary(lineRes);
      if (apiLines.length) setLines(apiLines);
      if (quote) setQuote(quote);
      onAdded?.();
    } catch {
      setAddError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const isCard = variant === "card";

  const detailHref = `/service/${service.service_id}`;

  return (
    <>
      <Link
        href={detailHref}
        className={`group self-start overflow-hidden border bg-white transition-all duration-200 ${
          isCard
            ? "w-[245px] shrink-0 rounded-2xl border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md"
            : "w-full rounded-xl border-slate-100 p-3.5 hover:border-slate-200 hover:bg-slate-50/40"
        }`}
      >
        <div className={isCard ? "flex h-[124px]" : "flex items-center gap-4"}>
          {/* Image Thumbnail Container */}
          <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-slate-50 transition-colors group-hover:bg-slate-100/70 ${
              isCard
                ? "h-full w-[95px]"
                : "h-16 w-16 rounded-xl border border-slate-100"
            }`}
          >
            {service.image ? (
              <img
                src={service.image}
                alt={service.title || ""}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <Wrench
                size={isCard ? 28 : 22}
                className="text-slate-300 transition-transform duration-300 group-hover:rotate-12"
                strokeWidth={1.5}
              />
            )}
          </div>

          {/* Content Pane */}
          <div className={`flex flex-1 flex-col ${isCard ? "justify-between p-3" : "min-w-0"}`}>
            <div>
              <p
                className={`font-bold leading-snug text-slate-800 line-clamp-2 transition-colors group-hover:text-slate-900 ${
                  isCard ? "text-[13px]" : "text-[15px]"
                }`}
              >
                {service.title}
              </p>

              {/* Conditional Inline Metadata for Rows */}
              {!isCard && service.rating && (
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{service.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div
              className={`flex items-end justify-between ${isCard ? "mt-2" : "mt-3"}`}
              onClick={(e) => e.preventDefault()}
            >
              {/* Pricing Section */}
              {service.price > 0 ? (
                <p className="font-extrabold text-slate-900 text-[15px] tracking-tight">
                  ₹{service.price}
                  <span className="ml-1 text-[10px] font-normal text-slate-400 lowercase">
                    onwards
                  </span>
                </p>
              ) : (
                <p className="text-xs font-semibold text-slate-500">
                  Price on inspection
                </p>
              )}

              {/* Action Buttons Container */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  {inCart && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); router.push("/cart"); }}
                      className="flex h-7 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none"
                    >
                      <ShoppingBag size={12} />
                      Cart
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={adding}
                    className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all focus-visible:outline-none ${
                      inCart
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10 hover:bg-blue-700"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-600 active:scale-95 disabled:opacity-60"
                    }`}
                  >
                    {adding ? (
                      <>
                        Adding <Loader2 size={12} className="animate-spin" />
                      </>
                    ) : inCart ? (
                      <>
                        Added <Check size={12} strokeWidth={3} />
                      </>
                    ) : (
                      <>
                        Add <Plus size={12} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
                {addError && (
                  <p className="text-[10px] font-medium text-red-500 text-right leading-tight max-w-[130px]">
                    {addError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
