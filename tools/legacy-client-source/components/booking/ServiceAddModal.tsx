"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, MapPin, Wrench, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/modals/Modal";
import { addCartLine, ensureCart } from "@/lib/api/userClient";
import { parseCartSummary } from "@/lib/booking";
import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import {
  defaultServiceConfig,
  ServiceConfigPanel,
  type ServiceConfig,
} from "./ServiceConfigPanel";
import { AnimatedAmount } from "./AnimatedAmount";
import type { CatalogService } from "./bookingTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  service: CatalogService;
  onAdded?: () => void;
};

export function ServiceAddModal({ open, onClose, service, onAdded }: Props) {
  const router = useRouter();
  const { token } = useUserAuthStore();
  const { setLines, setQuote, addLocalLine } = useCartStore();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [needsAddress, setNeedsAddress] = useState(false);
  const [config, setConfig] = useState<ServiceConfig>(() =>
    defaultServiceConfig(
      service.booking_types ?? [],
      service.units ?? [],
      service.price
    )
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    setNeedsAddress(false);
    setConfig(
      defaultServiceConfig(
        service.booking_types ?? [],
        service.units ?? [],
        service.price
      )
    );
  }, [open, service]);

  const handleConfirmAdd = useCallback(async () => {
    setAdding(true);
    setError("");
    setNeedsAddress(false);
    try {
      // Guest path: add directly to local Zustand store, synced to backend after login
      if (!token) {
        const unitPrice = config.quantity > 0
          ? Math.round((config.lineTotal / config.quantity) * 100) / 100
          : service.price;
        addLocalLine({
          service_id: service.service_id,
          service_name: service.title,
          booking_type_id: config.bookingTypeId,
          unit_id: config.unitId ?? undefined,
          quantity: config.quantity,
          unit_price: unitPrice,
          line_total: config.lineTotal,
        });
        onAdded?.();
        onClose();
        return;
      }

      const cartRes = await ensureCart() as { status: boolean; message?: string; code?: string };
      if (!cartRes.status) {
        const noAddress = cartRes.code === "NO_ADDRESS" || cartRes.code === "NO_COORDS";
        setNeedsAddress(noAddress);
        setError(
          noAddress
            ? "Add a service address first."
            : cartRes.message || "Could not prepare cart. Try again."
        );
        return;
      }
      const lineRes = await addCartLine({
        service_id: service.service_id,
        booking_type_id: config.bookingTypeId,
        unit_id: config.unitId,
        quantity: config.quantity,
      }) as { status: boolean; message?: string; lines?: unknown[]; quote?: unknown };
      if (!lineRes.status) {
        setError(lineRes.message || "Could not add to cart. Try again.");
        return;
      }
      const { lines: apiLines, quote } = parseCartSummary(lineRes);
      if (apiLines.length) setLines(apiLines);
      if (quote) setQuote(quote);
      onAdded?.();
      onClose();
    } catch {
      setError("Could not add to cart. Try again.");
    } finally {
      setAdding(false);
    }
  }, [token, config, addLocalLine, onAdded, onClose, service, setLines, setQuote]);

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  return (
    <Modal openModal={open} setOpenModal={handleOpenChange} panelClassName="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1f5f9]">
              {service.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Wrench size={28} className="text-[#cbd5e1]" strokeWidth={1.2} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] font-bold leading-snug text-[#111827] line-clamp-2">
                {service.title}
              </h2>
              {service.price > 0 ? (
                <p className="mt-0.5 text-[14px] font-black text-[#111827]">
                  â‚¹{service.price}
                  <span className="ml-1 text-[11px] font-normal text-[#9ca3af]">onwards</span>
                </p>
              ) : (
                <p className="mt-0.5 text-[12px] font-semibold text-[#344352]">
                  Price on inspection
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#4b5563]"
          >
            <X size={18} />
          </button>
        </div>

        <ServiceConfigPanel
          bookingTypes={service.booking_types ?? []}
          units={service.units ?? []}
          basePrice={service.price}
          value={config}
          onChange={setConfig}
        />

        {error && (
          <div className="flex items-start gap-1.5 rounded-lg border border-[#fee2e2] bg-[#fff5f5] px-3 py-2 text-[12px] text-[#b91c1c]">
            {needsAddress ? <MapPin size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            <span>
              {error}{" "}
              {needsAddress && (
                <Link href="/profile" onClick={onClose} className="font-semibold underline">
                  Go to Profile →
                </Link>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={adding}
            onClick={handleConfirmAdd}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3 text-[14px] font-black text-[#ffffff] shadow-[0_4px_14px_rgba(14,85,217,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {adding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Add to cart Â·{" "}
                <AnimatedAmount value={config.lineTotal} className="font-black" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/cart");
            }}
            className="rounded-xl border border-[#0e55d9] px-4 py-3 text-[13px] font-bold text-[#0e55d9] transition-colors hover:bg-[#eef4ff] sm:shrink-0"
          >
            View cart
          </button>
        </div>
      </div>
    </Modal>
  );
}