import type { TechnicianUser } from "@/store/technicianAuth.store";

type ApiPayload = Record<string, unknown>;

function asRecord(value: unknown): ApiPayload | null {
  return value && typeof value === "object" ? (value as ApiPayload) : null;
}

function readBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) return true;
      if (["false", "0", "no"].includes(normalized)) return false;
    }
  }
  return undefined;
}

export function normalizeTechnician(raw: unknown): TechnicianUser | null {
  const root = asRecord(raw);
  const r = asRecord(root?.profile) ?? asRecord(root?.technician) ?? root;
  if (!r) return null;

  const id = r.technician_id ?? r.id ?? r.technicianId;
  const mobile = r.mobile_number ?? r.mobileNumber ?? r.mobile;
  if (id == null || !mobile) return null;

  return {
    technician_id: Number(id),
    first_name: String(r.first_name ?? r.firstName ?? "Technician"),
    last_name: r.last_name != null ? String(r.last_name) : undefined,
    mobile_number: String(mobile),
    email: r.email != null ? String(r.email) : null,
    is_active: readBoolean(r.is_active, r.isActive),
    profile_photo: r.profile_photo != null ? String(r.profile_photo) : r.profilePitcher != null ? String(r.profilePitcher) : null,
    application_status: r.application_status != null ? String(r.application_status) : undefined,
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
  const loginIdRaw = data?.login_id ?? data?.loginId ?? r.login_id;
  if (loginIdRaw == null) {
    return { ok: false, message: "Invalid server response" };
  }
  return { ok: true, loginId: loginIdRaw as string | number };
}

export function parseVerifyOtpResponse(res: unknown): {
  ok: boolean;
  token?: string;
  isRegistered?: boolean;
  technician?: TechnicianUser;
  message?: string;
} {
  const r = asRecord(res);
  if (!r?.status) {
    return { ok: false, message: String(r?.message ?? "Invalid OTP") };
  }

  const token = r.token != null ? String(r.token) : undefined;
  if (!token) {
    return { ok: false, message: "Login succeeded but no token was returned" };
  }

  const data = asRecord(r.data);
  const isRegistered = readBoolean(
    r.is_registered,
    r.isRegistered,
    data?.is_registered,
    data?.isRegistered,
    data?.registration,
  ) ?? false;
  const technician = normalizeTechnician(data ?? r);

  return { ok: true, token, isRegistered, technician: technician ?? undefined };
}

export function isTechTokenExpired(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
      technician_id?: number;
    };
    if (!payload.technician_id) return true;
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
