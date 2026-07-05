"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  Star,
  TrendingUp,
  User,
  WifiOff,
  Wrench,
  XCircle,
} from "lucide-react";
import { technicianAdminAPI } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SectionReview = {
  section: string;
  status: "pending" | "approved" | "rejected";
  remark?: string | null;
  reviewed_at?: string | null;
};

type Document = {
  document_id: number;
  document_type?: string;
  attachement?: string;
  attachment_url?: string;
  is_verified?: boolean;
  section_key?: string;
  review?: SectionReview | null;
};

type BankDetail = {
  details_id: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  is_verified?: boolean;
  reject_remark?: string | null;
};

type Service = {
  service_id: number;
  service_name?: string;
  skill_level?: string;
};

type Technician = {
  technician_id: number;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  email?: string;
  city?: string;
  selfie_photo?: string;
  selfie_url?: string;
  profile_photo?: string;
  is_active?: boolean;
  is_online?: boolean;
  application_status?: string;
  experience_years?: number;
  address?: string;
  rating?: number;
  total_jobs?: number;
};

type PerformanceData = {
  snapshot?: Record<string, unknown> | null;
  jobs?: { completed: number; total: number; avg_hours?: number };
  ratings?: { avg_rating?: number; review_count?: number };
};

type DetailData = {
  technician: Technician;
  documents: Document[];
  bankDetails: BankDetail[];
  services: Service[];
  selfie: { url?: string; is_verified?: boolean; review?: SectionReview | null };
  sectionReviews: Record<string, SectionReview>;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    pending:  { label: "Pending",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
    draft:    { label: "Draft",    cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const s = map[status ?? ""] ?? { label: status ?? "—", cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ReviewBadge({ review }: { review?: SectionReview | null }) {
  if (!review) return <span className="text-[11px] text-slate-400">Not reviewed</span>;
  const map = {
    approved: "text-emerald-600 bg-emerald-50",
    rejected: "text-red-600 bg-red-50",
    pending:  "text-amber-600 bg-amber-50",
  };
  const cls = map[review.status as keyof typeof map] ?? "text-slate-500 bg-slate-50";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {review.status === "approved" ? <CheckCircle2 size={11} /> : review.status === "rejected" ? <XCircle size={11} /> : <Clock size={11} />}
      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
      {review.remark && <span className="opacity-70">· {review.remark}</span>}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-[20px] font-bold text-slate-900">{value}</p>
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminTechnicianDetailPage() {
  const { technicianId } = useParams<{ technicianId: string }>();
  const router = useRouter();

  const [detail, setDetail]       = useState<DetailData | null>(null);
  const [perf, setPerf]           = useState<PerformanceData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDetail = useCallback(async () => {
    try {
      const [detailRes, perfRes] = await Promise.allSettled([
        technicianAdminAPI.getTechnicianById({ technicianId: Number(technicianId) }) as Promise<{ status: boolean; data: DetailData }>,
        technicianAdminAPI.getPerformance(Number(technicianId)) as Promise<{ status: boolean; data: PerformanceData }>,
      ]);

      if (detailRes.status === "fulfilled" && detailRes.value?.status) {
        setDetail(detailRes.value.data);
      }
      if (perfRes.status === "fulfilled" && perfRes.value?.status) {
        setPerf(perfRes.value.data);
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleSuspend = async (suspend: boolean) => {
    setActionLoading("suspend");
    try {
      const res = await technicianAdminAPI.suspend({
        technicianId: Number(technicianId),
        suspend,
      }) as { status: boolean; message?: string };
      if (res.status !== false) {
        showToast(suspend ? "Technician suspended" : "Technician activated");
        loadDetail();
      } else {
        showToast(res.message || "Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceOffline = async () => {
    setActionLoading("offline");
    try {
      const res = await technicianAdminAPI.forceOffline({
        technicianId: Number(technicianId),
      }) as { status: boolean; message?: string };
      if (res.status !== false) {
        showToast("Technician forced offline");
        loadDetail();
      } else {
        showToast(res.message || "Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    try {
      const res = await technicianAdminAPI.approveTechnician({
        technicianId: Number(technicianId),
        isActive: true,
        applicationStatus: "approved",
      }) as { status: boolean; message?: string };
      if (res.status !== false) {
        showToast("Application approved");
        loadDetail();
      } else {
        showToast(res.message || "Approval failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">Loading technician details…</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-semibold text-slate-700">Technician not found</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    );
  }

  const { technician, documents, bankDetails, services, selfie, sectionReviews } = detail;
  const techName = `${technician.first_name ?? ""} ${technician.last_name ?? ""}`.trim() || "—";
  const bank = bankDetails?.[0] ?? null;

  const sectionEntries: { key: string; label: string; review: SectionReview | null }[] = [
    { key: "personal_info", label: "Personal Info", review: sectionReviews["personal_info"] ?? null },
    { key: "skills",        label: "Skills",        review: sectionReviews["skills"] ?? null },
    { key: "selfie",        label: "Selfie",        review: sectionReviews["selfie"] ?? null },
    { key: "bank",          label: "Bank Details",  review: sectionReviews["bank"] ?? null },
    ...documents.map((d) => ({
      key: d.section_key ?? `doc_${d.document_id}`,
      label: d.document_type ?? `Document ${d.document_id}`,
      review: d.review ?? null,
    })),
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-lg transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Back + Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-slate-900">{techName}</h1>
          <p className="text-[12px] text-slate-500">Technician #{technicianId}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={technician.application_status} />
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              technician.is_online
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${technician.is_online ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
            {technician.is_online ? "Online" : "Offline"}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              technician.is_active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {technician.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Left column ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-1 w-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400" />
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-slate-200">
                  {(technician.selfie_url || technician.profile_photo) ? (
                    <img
                      src={technician.selfie_url || technician.profile_photo}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold text-slate-900">{techName}</p>
                  {technician.mobile_number && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                      <Phone size={11} /> {technician.mobile_number}
                    </div>
                  )}
                  {technician.email && (
                    <p className="truncate text-[12px] text-slate-500">{technician.email}</p>
                  )}
                  {technician.city && (
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500">
                      <MapPin size={11} /> {technician.city}
                    </div>
                  )}
                  {technician.rating != null && (
                    <div className="mt-1 flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-[13px] font-semibold text-slate-700">
                        {Number(technician.rating).toFixed(1)}
                      </span>
                      {technician.total_jobs != null && (
                        <span className="text-[11px] text-slate-400">· {technician.total_jobs} jobs</span>
                      )}
                    </div>
                  )}
                  {technician.experience_years != null && (
                    <p className="mt-0.5 text-[11px] text-slate-400">{technician.experience_years} yrs experience</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-500">Admin Actions</p>
            <div className="space-y-2">
              {technician.application_status === "pending" && (
                <button
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {actionLoading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve Application
                </button>
              )}
              <button
                onClick={() => handleSuspend(!technician.is_active)}
                disabled={!!actionLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-60 ${
                  technician.is_active
                    ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {actionLoading === "suspend" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : technician.is_active ? (
                  <><Ban size={14} /> Suspend Technician</>
                ) : (
                  <><CheckCircle2 size={14} /> Activate Technician</>
                )}
              </button>
              {technician.is_online && (
                <button
                  onClick={handleForceOffline}
                  disabled={!!actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {actionLoading === "offline" ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
                  Force Offline
                </button>
              )}
              <button
                onClick={loadDetail}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Services */}
          {services?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wrench size={14} className="text-slate-500" />
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Services</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <div
                    key={s.service_id}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700"
                  >
                    <span>{s.service_name}</span>
                    {s.skill_level && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                        {s.skill_level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section review summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield size={14} className="text-slate-500" />
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Section Reviews</p>
            </div>
            <div className="space-y-2">
              {sectionEntries.map(({ key, label, review }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-700">{label}</span>
                  <ReviewBadge review={review} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Performance stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={BriefcaseBusiness}
              label="Total Jobs"
              value={perf?.jobs?.total ?? technician.total_jobs ?? 0}
              color="bg-blue-500"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={perf?.jobs?.completed ?? 0}
              color="bg-emerald-500"
            />
            <StatCard
              icon={Star}
              label="Avg Rating"
              value={perf?.ratings?.avg_rating != null ? Number(perf.ratings.avg_rating).toFixed(1) : (technician.rating != null ? Number(technician.rating).toFixed(1) : "—")}
              sub={perf?.ratings?.review_count ? `${perf.ratings.review_count} reviews` : undefined}
              color="bg-amber-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Reviews"
              value={perf?.ratings?.review_count ?? 0}
              color="bg-purple-500"
            />
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <p className="text-[14px] font-bold text-slate-900">Documents</p>
            </div>
            {documents?.length === 0 ? (
              <p className="text-[12px] text-slate-400">No documents uploaded</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doc.attachment_url ? (
                        <a
                          href={doc.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-[10px] text-slate-400 hover:opacity-80"
                        >
                          <img
                            src={doc.attachment_url}
                            alt={doc.document_type}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </a>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                          <FileText size={20} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{doc.document_type ?? "Document"}</p>
                        <ReviewBadge review={doc.review} />
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        doc.is_verified
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {doc.is_verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selfie */}
          {selfie?.url && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <User size={15} className="text-slate-500" />
                <p className="text-[14px] font-bold text-slate-900">Selfie Verification</p>
              </div>
              <div className="flex items-start gap-4">
                <a href={selfie.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selfie.url}
                    alt="Selfie"
                    className="h-24 w-24 rounded-2xl border border-slate-200 object-cover hover:opacity-90"
                  />
                </a>
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      selfie.is_verified
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selfie.is_verified ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {selfie.is_verified ? "Verified" : "Pending verification"}
                  </span>
                  <ReviewBadge review={selfie.review} />
                </div>
              </div>
            </div>
          )}

          {/* Bank details */}
          {bank && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <BadgeIndianRupee size={15} className="text-slate-500" />
                <p className="text-[14px] font-bold text-slate-900">Bank Details</p>
                <span
                  className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    bank.is_verified
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {bank.is_verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bank</p>
                  <p className="text-[13px] font-semibold text-slate-800">{bank.bank_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account Holder</p>
                  <p className="text-[13px] font-semibold text-slate-800">{bank.account_holder_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account Number</p>
                  <p className="font-mono text-[13px] font-semibold text-slate-800">{bank.account_number || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">IFSC Code</p>
                  <p className="font-mono text-[13px] font-semibold text-slate-800">{bank.ifsc_code || "—"}</p>
                </div>
              </div>
              {bank.reject_remark && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
                  <span className="font-semibold">Rejection note: </span>{bank.reject_remark}
                </div>
              )}
              <div className="mt-3">
                <ReviewBadge review={sectionReviews["bank"] ?? null} />
              </div>
            </div>
          )}

          {/* Performance snapshot */}
          {perf?.snapshot && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-slate-500" />
                <p className="text-[14px] font-bold text-slate-900">Performance Snapshot</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {perf.jobs?.avg_hours != null && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[16px] font-bold text-slate-900">{Number(perf.jobs.avg_hours).toFixed(1)}h</p>
                    <p className="text-[11px] text-slate-500">Avg job duration</p>
                  </div>
                )}
                {perf.ratings?.review_count != null && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-1">
                      <p className="text-[16px] font-bold text-slate-900">
                        {perf.ratings.avg_rating != null ? Number(perf.ratings.avg_rating).toFixed(1) : "—"}
                      </p>
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">{perf.ratings.review_count} reviews</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {technician.address && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <MapPin size={15} className="text-slate-500" />
                <p className="text-[13px] font-bold text-slate-900">Address</p>
              </div>
              <p className="text-[13px] text-slate-600">{technician.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
