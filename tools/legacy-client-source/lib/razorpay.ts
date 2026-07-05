/** Razorpay Checkout.js integration for the user payment page. */

export type RazorpayCheckoutResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayHandlerResponse = RazorpayCheckoutResult;

type RazorpayCheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayHandlerResponse) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export type OpenRazorpayParams = {
  keyId: string;
  orderId: string;
  amountInr: number;
  bookingId: number | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

export function openRazorpayCheckout(params: OpenRazorpayParams): Promise<RazorpayCheckoutResult> {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      reject(new Error("Could not load Razorpay checkout. Check your network connection."));
      return;
    }

    const amountPaise = Math.round(params.amountInr * 100);

    const rzp = new window.Razorpay({
      key: params.keyId,
      order_id: params.orderId,
      amount: amountPaise,
      currency: "INR",
      name: "eFixMate",
      description: `Booking #${params.bookingId}`,
      prefill: {
        name: params.customerName || undefined,
        email: params.customerEmail || undefined,
        contact: params.customerPhone || undefined,
      },
      theme: { color: "#0e55d9" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
      handler: (response) => {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
    });

    rzp.on("payment.failed", (resp: unknown) => {
      const r = resp as { error?: { description?: string; reason?: string } };
      reject(new Error(r?.error?.description || r?.error?.reason || "Payment failed"));
    });

    rzp.open();
  });
}
