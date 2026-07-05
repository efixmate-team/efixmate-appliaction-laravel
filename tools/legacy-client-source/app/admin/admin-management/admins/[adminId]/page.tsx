"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, X, ZoomIn } from "lucide-react";
import { adminAPI } from "@/lib/api";
import { resolveAvatarUrl } from "@/app/admin/(components)/Table/cells/AvatarCell";
import { ADMIN_TYPES } from "@/src/shared/constants/adminTypes";

type AdminRecord = {
  admin_id?: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  admin_type?: string;
  role_name?: string;
  roleName?: string;
  role_id?: number | string;
  is_active?: boolean;
  email_verified?: boolean;
  mobile_verified?: boolean;
  profile_image?: string;
  avatar?: string;
  login_url?: string;
  loginUrl?: string;
  login_url_link?: string;
  login_link?: string;
  created_at?: string;
  created_by?: string | number;
};

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getLoginUrl = (admin: AdminRecord | null) => {
  if (!admin) return "";

  const direct =
    admin.login_url ||
    admin.loginUrl ||
    admin.login_url_link ||
    admin.login_link;

  if (direct) return direct;

  const anyAdmin = admin as any;
  return (
    anyAdmin?.urls?.login_url ||
    anyAdmin?.urls?.loginUrl ||
    anyAdmin?.links?.login_url ||
    anyAdmin?.links?.loginUrl ||
    ""
  );
};

const getRoleLabel = (admin: AdminRecord | null) => {
  if (!admin) return "";

  const direct = admin.role_name || admin.roleName;
  if (direct) return direct;

  const anyAdmin = admin as any;
  return (
    anyAdmin?.role?.role_name ||
    anyAdmin?.role?.roleName ||
    anyAdmin?.role?.name ||
    ""
  );
};

export default function AdminDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const adminId = useMemo(() => {
    const raw = params?.adminId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [admin, setAdmin] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openImagePreview, setOpenImagePreview] = useState(false);

  const fetchAdmin = async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getAdminById({ adminId: Number(adminId) || adminId });
      if (response?.status) {
        const payload = response.data;
        const record = Array.isArray(payload) ? payload[0] : payload;
        if (record) {
          setAdmin(record);
        } else {
          setError("Administrator not found.");
        }
      } else {
        setError(response?.message || "Failed to load administrator details.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load administrator details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdmin();
  }, [adminId]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenImagePreview(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 rounded-xl bg-[#f1f5f9] animate-pulse" />
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-6">
          <div className="h-24 w-full rounded-xl bg-[#f1f5f9] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-6 space-y-3">
        <p className="text-sm text-[#b91c1c]">{error || "Administrator details unavailable."}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-2 text-sm rounded-lg bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc]"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => void fetchAdmin()}
            className="px-3 py-2 text-sm rounded-lg bg-[#dc2626] text-[#ffffff] hover:bg-[#b91c1c] inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "Unknown";
  const loginUrl = getLoginUrl(admin);
  const roleLabel = getRoleLabel(admin);
  const avatarUrl = resolveAvatarUrl(admin);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/admin/admin-management/admins")}
        className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Administrators
      </button>

      <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <button
              type="button"
              onClick={() => setOpenImagePreview(true)}
              className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]"
              title="Click to zoom profile picture"
            >
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover border border-[#e2e8f0]"
              />
              <span className="absolute inset-0 rounded-full bg-[#000000]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-[#ffffff]" />
              </span>
            </button>
          ) : (
            <div className="w-16 h-16 rounded-full border border-[#e2e8f0] bg-[#f1f5f9] flex items-center justify-center text-[#334155] font-semibold">
              {getInitials(fullName) || "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-[#0f172a]">{fullName}</h1>
            <p className="text-sm text-[#53697e]">Administrator Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Admin ID</p>
            <p className="font-medium text-[#0f172a]">{admin.admin_id ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Email</p>
            <p className="font-medium text-[#0f172a] break-all">{admin.email || "-"}</p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Mobile</p>
            <p className="font-medium text-[#0f172a]">{admin.mobile_number || "-"}</p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Role</p>
            <p className="font-medium text-[#0f172a]">{roleLabel || "-"}</p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Type</p>
            <p className="font-medium text-[#0f172a]">
              {admin.admin_type === ADMIN_TYPES.SUPER_ADMIN ? "Super Admin" : admin.admin_type === ADMIN_TYPES.ADMIN ? "Admin" : admin.admin_type || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Status</p>
            <p className={`font-medium ${admin.is_active ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
              {admin.is_active ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Email Verified</p>
            <p className={`font-medium ${admin.email_verified ? "text-[#16a34a]" : "text-[#fffbeb]"}`}>
              {admin.email_verified ? "Verified" : "Not Verified"}
            </p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
            <p className="text-[#53697e] mb-1">Mobile Verified</p>
            <p className={`font-medium ${admin.mobile_verified ? "text-[#16a34a]" : "text-[#fffbeb]"}`}>
              {admin.mobile_verified ? "Verified" : "Not Verified"}
            </p>
          </div>
          {admin.created_at && (
            <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
              <p className="text-[#53697e] mb-1">Created At</p>
              <p className="font-medium text-[#0f172a]">
                {new Date(admin.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3 md:col-span-2">
            <p className="text-[#53697e] mb-1">Login URL</p>
            <p className="font-medium text-[#0f172a] break-all">{loginUrl || "-"}</p>
          </div>
        </div>
      </div>

      {openImagePreview && avatarUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#000000]/75 flex items-center justify-center p-4"
          onClick={() => setOpenImagePreview(false)}
        >
          <button
            type="button"
            onClick={() => setOpenImagePreview(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#ffffff]/10 text-[#ffffff] hover:bg-[#ffffff]/20"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={avatarUrl}
            alt={`${fullName} profile`}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
