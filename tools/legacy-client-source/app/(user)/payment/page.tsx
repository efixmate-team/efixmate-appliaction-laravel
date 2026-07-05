"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import {
  lockCart,
  checkout,
  applyCouponToLocks,
  createPaymentOrder,
  verifyPayment,
  clearCart,
} from "@/lib/api/userClient";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { parseCheckoutResult, parseLockResult } from "@/lib/booking";
import { useCartStore } from "@/store/cart.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { AnimatedAmount } from "@/components/booking/AnimatedAmount";
import { TrustBar } from "@/components/booking/TrustBar";

type Step = "select" | "processing" | "gateway" | "success" | "failed";

function ProcessingModal({
  bookingId,
  amount,
  steps,
}: {
  bookingId: string | null;
  amount: number;
  steps: Array<{ title: string; subtitle?: string; state?: string }>;
}) {
  const defaultSteps = [
    { title: "Verifying payment details", state: "active" },
    { title: "Processing payment", state: "pending" },
    { title: "Finalizing booking", state: "pending" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/60 backdrop-blur-md px-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#ffffff] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef4ff]">
          <Loader2 size={36} className="animate-spin text-[#0e55d9]" />
        </div>
        <h3 className="text-[18px] font-black text-[#0f172a]">Processing payment</h3>
        <p className="mt-2 text-[22px] font-black text-[#0e55d9]">₹{amount.toLocaleString("en-IN")}</p>
        <p className="mt-3 rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-3 py-2 text-[11.5px] font-semibold text-[#92400e]">
          Do not close the app or press back
        </p>
        {bookingId && (
          <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
            <p className="text-[11px] text-[#94a3b8]">Booking ID</p>
            <p className="font-mono text-[13px] font-black text-[#0e55d9]">{bookingId}</p>
          </div>
        )}
        <div className="mt-5 space-y-2.5 text-left">
          {(steps.length ? steps : defaultSteps).map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {s.state === "done" || s.state === "completed" ? (
                <CheckCircle size={16} className="shrink-0 text-[#16a34a]" />
              ) : s.state === "active" || s.state === "in_progress" ? (
                <Loader2 size={16} className="shrink-0 animate-spin text-[#0e55d9]" />
              ) : (
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[#e2e8f0]" />
              )}
              <div>
                <p className="text-[12.5px] font-semibold text-[#0f172a]">{s.title}</p>
                {s.subtitle && <p className="text-[11px] text-[#94a3b8]">{s.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  bookingId,
  bookingUid,
  total,
  serviceCount,
}: {
  bookingId: string;
  bookingUid?: string;
  total: number;
  serviceCount: number;
}) {
  const displayId = bookingUid || bookingId;
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full opacity-60"
            style={{
              background: ["#0e55d9", "#10b981", "#f59e0b", "#ec4899"][i % 4],
              left: `${8 + (i * 7) % 85}%`,
              top: `${10 + (i * 11) % 40}%`,
              animation: `bounce ${1.2 + (i % 3) * 0.3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mb-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#ecfdf5] ring-8 ring-[#d1fae5]/60">
          <CheckCircle size={56} className="text-[#16a34a]" />
        </div>
      </div>
      <h2 className="relative text-[24px] font-black text-[#0f172a]">Booking confirmed!</h2>
      <p className="relative mt-2 max-w-sm text-[14px] text-[#64748b]">
        Payment received for {serviceCount} service{serviceCount !== 1 ? "s" : ""}. A verified technician will be assigned shortly.
      </p>

      <div className="relative mt-5 w-full max-w-xs rounded-2xl border border-[#e2e8f0] bg-[#ffffff] px-6 py-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Booking ID</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <p className="font-mono text-[17px] font-black text-[#0e55d9]">{displayId}</p>
          <button
            type="button"
            onClick={copyId}
            className="rounded-lg border border-[#e2e8f0] p-1.5 text-[#64748b] hover:text-[#0e55d9]"
          >
            {copied ? <Check size={14} className="text-[#16a34a]" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="mt-2 text-[13px] font-bold text-[#0f172a]">Paid ₹{total.toLocaleString("en-IN")}</p>
      </div>

      <p className="relative mt-4 flex items-center justify-center gap-2 text-[12px] text-[#64748b]">
        <Smartphone size={14} />
        Confirmation sent to your registered mobile number
      </p>

      <div className="relative mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href={`/bookings/${bookingId}/track`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[14px] font-black text-[#ffffff] shadow-[0_6px_20px_rgba(14,85,217,0.28)]"
        >
          <MapPin size={16} /> Track booking
        </Link>
        <Link
          href={`/bookings/${bookingId}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#ffffff] py-3.5 text-[13px] font-semibold text-[#374151]"
        >
          <CalendarDays size={16} /> View booking
        </Link>
        <Link href="/" className="text-[12.5px] font-semibold text-[#64748b] hover:text-[#0e55d9]">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function PaymentGatewayCard() {
  const options = [
    { Icon: Smartphone, label: "UPI" },
    { Icon: CreditCard, label: "Cards" },
    { Icon: Landmark, label: "Net banking" },
    { Icon: Wallet, label: "Wallets" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff]">
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <p className="text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">Payment gateway</p>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-[#eef4ff] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffffff] shadow-sm ring-1 ring-[#e2e8f0]">
            <ShieldCheck size={22} className="text-[#0e55d9]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-black text-[#0f172a]">Secure checkout with Razorpay</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">
              Tap pay below to open the secure payment window. Choose UPI, card, net banking, or wallet there.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {options.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-[#f1f5f9] bg-[#fafbff] px-2 py-2.5"
            >
              <Icon size={18} className="text-[#0e55d9]" strokeWidth={1.8} />
              <span className="text-[10px] font-semibold text-[#64748b]">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
          <Lock size={12} className="shrink-0" />
          256-bit encrypted · PCI-DSS compliant payments
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const {
    quote,
    lines,
    couponCode,
    clearCart: clearLocalCart,
    setLockIds,
    slotLabel,
    scheduledDate,
    scheduledTime,
  } = useCartStore();
  useUserAuthStore();
  const [step, setStep] = useState<Step>("select");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingUid, setBookingUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [processSteps, setProcessSteps] = useState<
    Array<{ title: string; subtitle?: string; state?: string }>
  >([]);
  const [payBusy, setPayBusy] = useState(false);

  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.line_total, 0);
  const platformFee = quote?.platform_fee ?? 29;
  const tax = quote?.tax ?? Math.round(subtotal * 0.18);
  const discount = quote?.coupon_discount ?? 0;
  const total = quote?.total ?? subtotal + platformFee + tax - discount;

  useEffect(() => {
    const midPayment =
      step === "processing" || step === "gateway" || bookingId != null;
    if (!lines.length && !midPayment) {
      router.replace("/cart");
    }
  }, [lines.length, router, step, bookingId]);

  const handlePay = async () => {
    if (payBusy) return;
    setPayBusy(true);
    setError("");
    setStep("processing");
    setProcessSteps([
      { title: "Locking service prices", state: "active" },
      { title: "Creating your booking", state: "pending" },
      { title: "Opening payment gateway", state: "pending" },
      { title: "Confirming payment", state: "pending" },
    ]);

    try {
      // 1. Lock prices
      const lockRes = await lockCart();
      if ((lockRes as { status?: boolean }).status === false) {
        throw new Error((lockRes as { message?: string }).message || "Could not lock prices. Try another slot.");
      }
      const lock = parseLockResult(lockRes);
      if (!lock?.lock_ids.length) {
        throw new Error((lockRes as { message?: string }).message || "Could not lock prices. Try another slot.");
      }
      setLockIds(lock.lock_ids);

      let lockIds = lock.lock_ids;
      if (couponCode) {
        const couponRes = (await applyCouponToLocks(couponCode, lockIds)) as { status?: boolean; message?: string };
        if (couponRes.status === false) throw new Error(couponRes.message || "Coupon could not be applied.");
      }

      setProcessSteps((s) => s.map((x, i) => ({ ...x, state: i === 0 ? "done" : i === 1 ? "active" : x.state })));

      // 2. Checkout → booking created
      const checkoutRes = await checkout(lockIds);
      const booked = parseCheckoutResult(checkoutRes);
      if (!booked) throw new Error((checkoutRes as { message?: string }).message || "Checkout failed");

      const bId = String(booked.booking_id);
      setBookingId(bId);
      if (booked.booking_uid) setBookingUid(booked.booking_uid);

      setProcessSteps((s) => s.map((x, i) => ({ ...x, state: i <= 1 ? "done" : i === 2 ? "active" : x.state })));

      // 3. Create gateway order (backend picks the active gateway)
      type OrderData = {
        order_id?: number | string;
        gateway_order_id?: string;
        provider?: string;
        // Razorpay
        razorpay_key_id?: string;
        currency?: string;
        // Cashfree
        cashfree_payment_session_id?: string;
        cashfree_env?: string;
        // Stripe
        stripe_client_secret?: string;
        stripe_publishable_key?: string;
        // PhonePe
        phonepe_redirect_url?: string;
      };
      const orderRes = (await createPaymentOrder(booked.booking_id)) as {
        status?: boolean;
        message?: string;
        data?: OrderData;
      };
      if (orderRes.status === false) throw new Error(orderRes.message || "Could not create payment order");

      const od = orderRes.data ?? {};
      const { order_id, provider } = od;
      if (!provider) throw new Error("Payment gateway not configured. Please contact support.");

      // 4. Open the correct gateway checkout
      setStep("gateway");

      let verifyPayload: Parameters<typeof verifyPayment>[0] = {
        orderId: order_id!,
        gatewayPaymentId: "pending",
        booking_id: booked.booking_id,
        amount: total,
      };

      if (provider === "razorpay") {
        if (!od.razorpay_key_id || !od.gateway_order_id) throw new Error("Razorpay not configured");
        const rzp = await openRazorpayCheckout({
          keyId: od.razorpay_key_id,
          orderId: od.gateway_order_id,
          amountInr: total,
          bookingId: booked.booking_id,
        });
        verifyPayload = {
          orderId: order_id!,
          gatewayPaymentId: rzp.razorpay_payment_id,
          gatewaySignature: rzp.razorpay_signature,
          razorpay_order_id: rzp.razorpay_order_id,
          booking_id: booked.booking_id,
          amount: total,
        };
      } else if (provider === "cashfree") {
        if (!od.cashfree_payment_session_id) throw new Error("Cashfree not configured");
        await openCashfreeCheckout({
          paymentSessionId: od.cashfree_payment_session_id,
          mode: (od.cashfree_env === "production" ? "production" : "sandbox"),
        });
        // Backend verifies via Cashfree API — no extra payload needed from client
        verifyPayload = { orderId: order_id!, gatewayPaymentId: "cashfree_pending", booking_id: booked.booking_id, amount: total };
      } else if (provider === "stripe") {
        // Stripe: redirect to Stripe Checkout or handle Payment Intent on a dedicated page
        // For now, signal to the user to complete in the opened window
        throw new Error("Stripe payments require setup. Contact support.");
      } else if (provider === "phonepe") {
        if (!od.phonepe_redirect_url) throw new Error("PhonePe redirect URL not received");
        // PhonePe uses a full-page redirect — user returns via /payment/callback
        window.location.href = od.phonepe_redirect_url;
        return; // navigation takes over
      } else {
        throw new Error(`Unknown payment gateway: ${provider}`);
      }

      // 5. Verify with backend
      setStep("processing");
      setProcessSteps([
        { title: "Locking service prices", state: "done" },
        { title: "Creating your booking", state: "done" },
        { title: "Opening payment gateway", state: "done" },
        { title: "Confirming payment", state: "active" },
      ]);

      const verifyRes = (await verifyPayment(verifyPayload)) as {
        status?: boolean;
        message?: string;
        data?: { booking_uid?: string };
      };
      if (verifyRes.status === false) throw new Error(verifyRes.message || "Payment verification failed");
      if (verifyRes.data?.booking_uid) setBookingUid(verifyRes.data.booking_uid);

      await clearCart().catch(() => null);
      clearLocalCart();
      setStep("success");
    } catch (e: unknown) {
      setStep("failed");
      setError(e instanceof Error ? e.message : "Payment failed. Please try again.");
    } finally {
      setPayBusy(false);
    }
  };

  if (step === "processing") {
    return <ProcessingModal bookingId={bookingId} amount={total} steps={processSteps} />;
  }
  if (step === "success" && bookingId) {
    return (
      <SuccessScreen
        bookingId={bookingId}
        bookingUid={bookingUid ?? undefined}
        total={total}
        serviceCount={lines.length}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-32 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:px-6 lg:py-6 lg:pb-6">
      <div className="space-y-4 px-4 pt-4 lg:px-0 lg:pt-0">
        <div className="flex items-center gap-2 rounded-xl border border-[#d1fae5] bg-[#ecfdf5] px-4 py-2.5">
          <ShieldCheck size={15} className="shrink-0 text-[#059669]" />
          <p className="text-[12px] font-semibold text-[#047857]">
            Secure checkout · prices locked for 10 minutes at payment
          </p>
        </div>

        {step === "failed" && error && (
          <div className="flex items-start gap-2 rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#dc2626]" />
            <div>
              <p className="text-[12.5px] text-[#dc2626]">{error}</p>
              <button
                type="button"
                onClick={() => setStep("select")}
                className="mt-2 text-[12px] font-semibold text-[#b91c1c] underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
          <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">
            Booking summary
          </p>
          {slotLabel && (
            <p className="mb-2 flex items-center gap-2 text-[12.5px] text-[#374151]">
              <Clock size={14} className="text-[#0e55d9]" />
              {slotLabel}
              {scheduledDate ? ` · ${scheduledDate}` : ""}
              {scheduledTime ? ` · ${scheduledTime}` : ""}
            </p>
          )}
          {lines.map((l) => (
            <div key={l.line_id} className="flex justify-between py-1.5 text-[13px]">
              <span className="text-[#374151]">
                {l.service_name} × {l.quantity}
              </span>
              <span className="font-semibold text-[#0f172a]">₹{l.line_total}</span>
            </div>
          ))}
          <Link href="/cart" className="mt-2 inline-flex text-[12px] font-bold text-[#0e55d9]">
            Have a coupon? Apply on cart
          </Link>
        </div>

        <PaymentGatewayCard />

        <div className="lg:hidden">
          <PriceBreakdown
            subtotal={subtotal}
            platformFee={platformFee}
            tax={tax}
            couponDiscount={discount}
            couponCode={couponCode}
            total={total}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <PriceBreakdown
            subtotal={subtotal}
            platformFee={platformFee}
            tax={tax}
            couponDiscount={discount}
            couponCode={couponCode}
            total={total}
          />
          <button
            type="button"
            onClick={handlePay}
            disabled={payBusy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[14px] font-black text-[#ffffff] shadow-[0_6px_20px_rgba(14,85,217,0.28)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payBusy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            Pay ·{" "}<AnimatedAmount value={total} className="font-black" />
          </button>
          <TrustBar />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[#e2e8f0] bg-[#ffffff] px-4 py-3 lg:hidden">
        <TrustBar className="mb-2 !py-2" />
        <button
          type="button"
          onClick={handlePay}
          disabled={payBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[14px] font-black text-[#ffffff] shadow-[0_4px_16px_rgba(14,85,217,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {payBusy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
          Pay · ₹{total.toLocaleString("en-IN")}
        </button>
      </div>
    </div>
  );
}
