/** Cashfree Drop.js v3 integration */

type CashfreeCheckoutResult =
  | { error: { message: string; type?: string }; redirect?: undefined; paymentDetails?: undefined }
  | { redirect: boolean; error?: undefined; paymentDetails?: undefined }
  | { paymentDetails: { paymentMessage: string }; error?: undefined; redirect?: undefined };

type CashfreeInstance = {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank";
  }) => Promise<CashfreeCheckoutResult>;
};

declare global {
  interface Window {
    Cashfree?: (config: { mode: string }) => Promise<CashfreeInstance>;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Cashfree));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openCashfreeCheckout(params: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
}): Promise<void> {
  const loaded = await loadCashfreeScript();
  if (!loaded || !window.Cashfree) {
    throw new Error("Could not load Cashfree checkout. Check your network connection.");
  }

  const cashfree = await window.Cashfree({ mode: params.mode });
  const result = await cashfree.checkout({
    paymentSessionId: params.paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result.error) {
    throw new Error(result.error.message || "Cashfree payment failed");
  }
  // result.redirect means user cancelled or was sent away
  if (result.redirect) {
    throw new Error("Payment cancelled");
  }
  // result.paymentDetails → payment captured, proceed to backend verification
}
