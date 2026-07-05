import { BASE_URL } from "./coreClient";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("efm_tech_token");
}

async function techRequest<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  data?: unknown,
): Promise<T> {
  const token = getToken();
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });

  const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
  if (!res.ok) {
    return {
      ...json,
      status: false,
      message: json?.message || res.statusText,
    } as T;
  }
  if (json.status === undefined) json.status = true;
  return json as T;
}

async function techFormRequest<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });
  const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
  if (!res.ok) {
    return {
      ...json,
      status: false,
      message: json?.message || res.statusText,
    } as T;
  }
  if (json.status === undefined) json.status = true;
  return json as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const sendOtp = (mobileNumber: string) =>
  techRequest("/technician/send-otp", "POST", { mobileNumber });

export const verifyOtp = (loginId: string | number, otp: string) =>
  techRequest("/technician/verify-otp", "POST", { login_id: loginId, otp });

// ─── Registration ─────────────────────────────────────────────────────────────

export const getRegistrationStatus = () =>
  techRequest("/technician/registration/status");

export const getRegistrationServices = () =>
  techRequest("/technician/registration/services");

export const getRequiredDocuments = () =>
  techRequest("/technician/required-document-list");

export const saveBasicDetails = (data: Record<string, unknown>) =>
  techRequest("/technician/registration/basic-details", "POST", data);

export const saveSkills = (serviceIds: number[]) =>
  techRequest("/technician/registration/skills", "POST", { serviceIds });

export const uploadDocument = (formData: FormData) =>
  techFormRequest("/technician/registration/upload-document", formData);

export const uploadSelfie = (formData: FormData) =>
  techFormRequest("/technician/registration/upload-selfie", formData);

export const saveBankDetails = (data: Record<string, unknown>) =>
  techRequest("/technician/registration/bank-details", "POST", data);

export const submitRegistration = (agreement?: { accepted: boolean; version?: string }) =>
  techRequest("/technician/registration/submit", "POST", {
    servicePartnerAgreementAccepted: agreement?.accepted === true,
    agreementVersion: agreement?.version ?? "2026-06",
    source: "web",
  });

export const resubmitCorrections = () =>
  techRequest("/technician/registration/resubmit-corrections", "POST");

export const verifyUpiId = (upiId: string) =>
  techRequest<{ status: boolean; valid?: boolean; customerName?: string | null; vpa?: string; message?: string }>(
    "/technician/registration/verify-upi",
    "POST",
    { upiId }
  );

export const getTechnicianProfile = () =>
  techRequest("/technician/profile");

export const getTechnicianReferral = () =>
  techRequest("/technician/referral");

export const applyTechnicianReferralCode = (referralCode: string) =>
  techRequest("/technician/referral/apply", "POST", { referral_code: referralCode });

// ─── Dashboard / Home ─────────────────────────────────────────────────────────

export const getDashboard = () =>
  techRequest("/technician/home/dashboard");

export const setAvailability = (isOnline: boolean) =>
  techRequest("/technician/home/availability", "PATCH", { isOnline });

export const acceptJob = (bookingId: number | string) =>
  techRequest("/technician/home/jobs/accept", "POST", { bookingId });

export const skipJob = (bookingId: number | string, reason?: string) =>
  techRequest("/technician/home/jobs/skip", "POST", { bookingId, ...(reason ? { reason } : {}) });

export const getJobDetail = (bookingId: number | string) =>
  techRequest(`/technician/home/jobs/${bookingId}`);

export const getMyJobs = (params: Record<string, string | number> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return techRequest(`/technician/home/my-jobs${qs ? `?${qs}` : ""}`);
};

export const getMyEarnings = (params: Record<string, string | number> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return techRequest(`/technician/home/my-earnings${qs ? `?${qs}` : ""}`);
};

export const getUnreadJobCount = () =>
  techRequest<{ status: boolean; data?: { count: number } }>("/technician/home/notifications/unread-count");

export const updateLiveLocation = (lat: number, lng: number) =>
  techRequest("/technician/home/location/update", "POST", { lat, lng });
