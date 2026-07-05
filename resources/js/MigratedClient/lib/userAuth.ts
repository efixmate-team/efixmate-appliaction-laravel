import { getUserProfile } from "@/lib/api/userClient";
import type { UserCustomer } from "@/store/userAuth.store";

type ApiPayload = Record<string, unknown>;

function asRecord(value: unknown): ApiPayload | null {
  return value && typeof value === "object" ? (value as ApiPayload) : null;
}

/** Map API profile/verify payload (camelCase or snake_case) to store shape. */
export function normalizeCustomer(raw: unknown): UserCustomer | null {
  const r = asRecord(raw);
  if (!r) return null;

  const id = r.customer_id ?? r.id;
  const mobile = r.mobile_number ?? r.mobileNumber;
  if (id == null || !mobile) return null;

  return {
    customer_id: Number(id),
    customer_uid: r.customer_uid != null ? String(r.customer_uid) : undefined,
    first_name: String(r.first_name ?? r.firstName ?? "User"),
    last_name: r.last_name != null || r.lastName != null
      ? String(r.last_name ?? r.lastName)
      : undefined,
    mobile_number: String(mobile),
    email: r.email != null ? String(r.email) : null,
    email_verified: Boolean(r.email_verified ?? r.emailVerified),
    mobile_verified: Boolean(r.mobile_verified ?? r.mobileVerified),
    is_active: r.is_active != null || r.isActive != null
      ? Boolean(r.is_active ?? r.isActive)
      : undefined,
    profile_pitcher: r.profile_pitcher != null || r.profilePitcher != null
      ? String(r.profile_pitcher ?? r.profilePitcher)
      : null,
  };
}

export function parseSendOtpResponse(res: unknown): {
  ok: boolean;
  loginId?: string | number;
  message?: string;
} {
  const r = asRecord(res);
  if (!r?.status) {
    return { ok: false, message: String(r?.message ?? "Failed to send OTP") };
  }
  const data = asRecord(r.data);
  const loginIdRaw = data?.login_id ?? data?.loginId;
  if (loginIdRaw == null || (typeof loginIdRaw !== "string" && typeof loginIdRaw !== "number")) {
    return { ok: false, message: "Invalid server response" };
  }
  return { ok: true, loginId: loginIdRaw };
}

export function parseVerifyOtpResponse(res: unknown): {
  ok: boolean;
  customer?: UserCustomer;
  message?: string;
} {
  const r = asRecord(res);
  if (!r?.status) {
    return { ok: false, message: String(r?.message ?? "Invalid OTP") };
  }

  // Token is set as an httpOnly cookie by the server — no longer present in the response body
  const data = asRecord(r.data);
  const nested = data?.customer != null ? normalizeCustomer(data.customer) : null;
  const customer = nested ?? (data ? normalizeCustomer(data) : null);

  return { ok: true, customer: customer ?? undefined };
}

/** Decode JWT payload without verification — used to skip dead sessions before API calls. */
export function isStoredTokenExpired(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
      customer_id?: number;
    };
    if (!payload.customer_id) return true;
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/** Persist session after OTP verify — cookie is already set by the server. */
export async function completeUserLogin(
  verifyRes: unknown,
  setSession: (customer: UserCustomer) => void
): Promise<{ ok: boolean; message?: string }> {
  const parsed = parseVerifyOtpResponse(verifyRes);
  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  let customer = parsed.customer;
  if (!customer) {
    // Token is in httpOnly cookie — just fetch the profile (cookie is sent automatically)
    try {
      const profileRes = await getUserProfile();
      customer = normalizeCustomer(asRecord(profileRes)?.data) ?? undefined;
    } catch {
      /* use fallback customer below */
    }
  }

  setSession(
    customer ?? {
      customer_id: 0,
      first_name: "User",
      mobile_number: "",
    }
  );

  return { ok: true };
}
