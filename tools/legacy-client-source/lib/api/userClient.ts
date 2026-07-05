/**
 * User API Client — auth is handled via httpOnly cookie (efm_u_token) set by the server.
 * credentials: "include" ensures the cookie is sent on every request automatically.
 * No token is ever read from or written to localStorage.
 */

import { BASE_URL } from "./coreClient";

async function userRequest<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  data?: unknown,
  options?: { idempotencyKey?: string }
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include", // sends the httpOnly efm_u_token cookie automatically
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });

  const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
  if (!res.ok) {
    return { status: false, message: json?.message || res.statusText, code: json?.code } as T;
  }
  if (json.status === undefined) json.status = true;
  return json as T;
}

async function userFormRequest<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
  if (!res.ok) return { status: false, message: json?.message || res.statusText } as T;
  if (json.status === undefined) json.status = true;
  return json as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const sendOtp = (mobileNumber: string) =>
  userRequest("/user/send-otp", "POST", { mobileNumber, mobile_number: mobileNumber });

export const verifyOtp = (
  loginId: string | number,
  otp: string,
  policy?: { accepted: boolean; version?: string }
) =>
  userRequest("/user/verify-otp", "POST", {
    login_id: loginId,
    otp,
    ...(policy ? { policyAccepted: policy.accepted, policyVersion: policy.version ?? "2026-06" } : {}),
    source: "web",
  });

export const logoutUser = () =>
  userRequest("/user/logout", "POST");

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getUserProfile = () =>
  userRequest("/user/profile");

export const updateProfile = (data: Record<string, unknown>) =>
  userRequest("/user/update-profile", "POST", data);

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  email?: string;
  photo?: File | null;
};

/** Update profile — uses multipart when a photo file is included. */
export const updateProfileWithPhoto = (data: UpdateProfilePayload) => {
  if (data.photo) {
    const form = new FormData();
    form.append("firstName", data.firstName);
    form.append("lastName", data.lastName);
    if (data.email) form.append("email", data.email);
    form.append("profile_pitcher", data.photo);
    return userFormRequest("/user/update-profile", form);
  }
  return updateProfile({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  });
};

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getAddresses = () =>
  userRequest("/user/address");

export const upsertAddress = (data: Record<string, unknown>) =>
  userRequest("/user/address", "POST", data);

export const activateAddress = (addressId: number) =>
  userRequest("/user/activate-address", "POST", { addressId, address_id: addressId });

export const deleteAddress = (addressId: number) =>
  userRequest("/user/delete-address", "POST", { addressId, address_id: addressId });

// ─── Services Discovery ───────────────────────────────────────────────────────

export const getServiceCategories = () =>
  userRequest("/user/services/categories");

/** Public home-screen category grid (top 7 + "More Services" tile). */
export const getHomeServiceCategories = () =>
  userRequest("/user/service-category/home");

export const getServices = (categoryId: number | string) =>
  userRequest(`/user/services/list?category_id=${categoryId}`);

export const getServiceDetails = (serviceId: number | string) =>
  userRequest("/user/services/details", "POST", { service_id: serviceId });

// ─── Promotions ───────────────────────────────────────────────────────────────

export const getHomeCarousel = (screen = "HOME") =>
  userRequest(`/user/promotions/home/carousel?screen=${encodeURIComponent(screen)}`);

export const getHomeOffers = () =>
  userRequest("/user/promotions/home/offers");

export const getCoupons = () =>
  userRequest("/user/coupons");

export const getReferral = () =>
  userRequest("/user/referral");

export const applyReferralCode = (referralCode: string) =>
  userRequest("/user/referral/apply", "POST", { referral_code: referralCode });

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const openCart = () =>
  userRequest("/user/booking/cart", "POST", {});

/** Get existing active cart or create one — never wipes existing lines. Use this for "Add to Cart". */
export const ensureCart = () =>
  userRequest("/user/booking/cart/ensure", "POST", {});

/** Dev/test only: create order + dummy payment + confirm booking in one call (PAYMENT_MODE=mock). */
export const instantConfirmPayment = (bookingId: number | string) =>
  userRequest("/user/payment/instant-confirm", "POST", { booking_id: bookingId });

export const getCart = () =>
  userRequest("/user/booking/cart");

export const patchCart = (data: Record<string, unknown>) =>
  userRequest("/user/booking/cart", "PATCH", data);

export const clearCart = () =>
  userRequest("/user/booking/cart", "DELETE");

export const getCartSlots = () =>
  userRequest("/user/booking/cart/slots");

export const getCartSlotsByAddress = (addressId: number | string, date?: string) => {
  const params = new URLSearchParams({ address_id: String(addressId) });
  if (date) params.set("date", date);
  return userRequest(`/user/booking/cart/slots-by-address?${params.toString()}`);
};

export const getCartQuote = (data: Record<string, unknown>) =>
  userRequest("/user/booking/cart/quote", "POST", data);

export const lockCart = () =>
  userRequest("/user/booking/cart/lock", "POST", {});

// Cart lines
export const addCartLine = (data: Record<string, unknown>) =>
  userRequest("/user/booking/cart/lines", "POST", data);

export const updateCartLine = (lineId: number | string, data: Record<string, unknown>) =>
  userRequest(`/user/booking/cart/lines/${lineId}`, "PATCH", data);

export const removeCartLine = (lineId: number | string) =>
  userRequest(`/user/booking/cart/lines/${lineId}`, "DELETE");

export const addCartLinePhotos = (lineId: number | string, formData: FormData) =>
  userFormRequest(`/user/booking/cart/lines/${lineId}/photos`, formData);

export const removeCartLinePhoto = (lineId: number | string, url: string) =>
  userRequest(
    `/user/booking/cart/lines/${lineId}/photos?url=${encodeURIComponent(url)}`,
    "DELETE"
  );

/** Preview coupon on quote, or apply to locks after lockCart (requires lock_ids). */
export const applyCouponToLocks = (couponCode: string, lockIds: string[]) =>
  userRequest("/user/booking/cart/apply-coupon", "POST", {
    coupon_code: couponCode,
    lock_ids: lockIds,
  });

/** @deprecated Use applyCouponToLocks after lock, or coupon_code in getCartQuote for preview. */
export const applyCoupon = (couponCode: string) =>
  userRequest("/user/booking/cart/apply-coupon", "POST", { coupon_code: couponCode });

// ─── Checkout & Bookings ──────────────────────────────────────────────────────

export const checkout = (lockIds: string[]) =>
  userRequest("/user/booking/checkout", "POST", { lock_ids: lockIds });

export const confirmBooking = (bookingId: number | string) =>
  userRequest("/user/booking/confirm", "POST", { booking_id: bookingId });

export const getBookings = () =>
  userRequest("/user/bookings");

export const getBookingDetail = (bookingId: number | string) =>
  userRequest("/user/bookings/" + bookingId);

export const getBookingPaymentSummary = (bookingId: number | string) =>
  userRequest(`/user/bookings/${bookingId}/payment-summary`);

export const getBookingConfirmation = (bookingId: number | string) =>
  userRequest(`/user/bookings/${bookingId}/confirmation`);

export const trackBooking = (bookingId: number | string) =>
  userRequest(`/user/bookings/${bookingId}/track`);

// ─── Payment ──────────────────────────────────────────────────────────────────

export const getPaymentMethods = () =>
  userRequest("/user/payment/methods");

export const createPaymentOrder = (bookingId: number | string, paymentMode?: string) =>
  userRequest("/user/payment/create-order", "POST", {
    booking_id: bookingId,
    ...(paymentMode ? { payment_mode: paymentMode } : {}),
  });

export const verifyPayment = (payload: {
  orderId: number | string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  razorpay_order_id?: string;
  amount?: number;
  booking_id?: number | string;
}) =>
  userRequest("/user/payment/verify", "POST", {
    orderId: payload.orderId,
    gatewayPaymentId: payload.gatewayPaymentId,
    gatewaySignature: payload.gatewaySignature,
    razorpay_signature: payload.gatewaySignature,
    razorpay_payment_id: payload.gatewayPaymentId,
    razorpay_order_id: payload.razorpay_order_id,
    amount: payload.amount,
    booking_id: payload.booking_id,
  });

export const getPaymentStatus = (bookingId: number | string) =>
  userRequest(`/user/payment/status?booking_id=${bookingId}`);

export const getProcessingState = (bookingId: string | number) =>
  userRequest(`/user/payment/processing-state?booking_id=${bookingId}`);
