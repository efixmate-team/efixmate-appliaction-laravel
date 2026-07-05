"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, Copy, CreditCard, Download, Eye, FileText, Loader2, MapPin, Phone, RotateCcw, User, X } from "lucide-react";
import { getTechnicianProfile } from "@/lib/api/technicianClient";

type ProfileData = {
  profile?: {
    firstName?: string; lastName?: string; mobileNumber?: string;
    city?: string; state?: string; address?: string; pincode?: string;
    selfiePhoto?: string; rating?: number; isActive?: boolean;
    technician_unique_id?: string | null;
    technicianUniqueId?: string | null;
  };
  documents?: { document_id: number; document_type?: string; attachment?: string }[];
  bankDetails?: {
    acount_holder_name?: string; account_number?: string; ifsc_code?: string;
    bank_name?: string; branch_name?: string; upi_id?: string;
  } | null;
  services?: { service_id: number; service_name?: string; skill_level?: string }[];
};

function DocPreviewModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d1fae5] bg-[#f0fdf4] px-4 py-3">
          <p className="text-[13px] font-bold capitalize text-[#14532d]">{label}</p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#16a34a] hover:bg-[#f0fdf4]"
            >
              <Download size={11} /> Download
            </a>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6b7280] hover:bg-red-50 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#f8fafc] p-4">
          {isImage ? (
            <img src={url} alt={label} className="max-h-[75vh] max-w-full rounded-lg object-contain shadow" />
          ) : (
            <iframe src={url} title={label} className="h-[70vh] w-full rounded-lg border-0" />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">{label}</p>
      <p className="text-[13px] text-[#374151]">{value}</p>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#d1fae5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0fdf4]">
          <Icon size={14} className="text-[#16a34a]" />
        </div>
        <p className="text-[14px] font-bold text-[#14532d]">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function TechProfilePage() {
  const [data, setData]       = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [copiedUniqueId, setCopiedUniqueId] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTechnicianProfile() as { status: boolean; data?: ProfileData };
      if (res?.status && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[#16a34a]" />
    </div>
  );

  if (!data) return <p className="py-20 text-center text-sm text-[#6b7280]">Unable to load profile.</p>;

  const { profile, documents, bankDetails, services } = data;
  const technicianUniqueId = profile?.technician_unique_id ?? profile?.technicianUniqueId ?? null;

  const copyTechnicianUniqueId = async () => {
    if (!technicianUniqueId) return;
    await navigator.clipboard.writeText(technicianUniqueId).catch(() => {});
    setCopiedUniqueId(true);
    window.setTimeout(() => setCopiedUniqueId(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#14532d]">My Profile</h1>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f0fdf4]">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {/* Profile card */}
      <div className="flex items-start gap-5 rounded-lg border border-[#d1fae5] bg-white p-5 shadow-sm">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f0fdf4] ring-2 ring-[#bbf7d0]">
          {profile?.selfiePhoto ? (
            <img src={profile.selfiePhoto} alt="Photo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User size={28} className="text-[#16a34a]" />
            </div>
          )}
        </div>
        <div>
          <p className="text-[16px] font-bold text-[#14532d]">{profile?.firstName} {profile?.lastName}</p>
          {technicianUniqueId && (
            <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
              {technicianUniqueId}
              <button
                type="button"
                onClick={copyTechnicianUniqueId}
                className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100"
                title={copiedUniqueId ? "Copied" : "Copy partner ID"}
              >
                {copiedUniqueId ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
          )}
          <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-[#6b7280]">
            {profile?.mobileNumber && <span className="flex items-center gap-1"><Phone size={11} /> {profile.mobileNumber}</span>}
            {profile?.city && <span className="flex items-center gap-1"><MapPin size={11} /> {profile.city}{profile.state ? `, ${profile.state}` : ""}</span>}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <Card title="Personal Information" icon={User}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="First Name" value={profile?.firstName} />
          <InfoRow label="Last Name"  value={profile?.lastName} />
          <InfoRow label="Mobile"     value={profile?.mobileNumber} />
          <InfoRow label="City"       value={profile?.city} />
          <InfoRow label="State"      value={profile?.state} />
          <InfoRow label="Pincode"    value={profile?.pincode} />
        </div>
        {profile?.address && <div className="mt-3"><InfoRow label="Address" value={profile.address} /></div>}
      </Card>

      {/* Skills */}
      {(services?.length ?? 0) > 0 && (
        <Card title="Skills & Services" icon={BadgeCheck}>
          <div className="flex flex-wrap gap-2">
            {services!.map(s => (
              <div key={s.service_id} className="flex items-center gap-1.5 rounded-full border border-[#d1fae5] bg-[#f0fdf4] px-2.5 py-1 text-[12px] font-medium text-[#14532d]">
                {s.service_name}
                {s.skill_level && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">{s.skill_level}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bank details */}
      {bankDetails && (
        <Card title="Bank / UPI Details" icon={CreditCard}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow label="Account Holder" value={bankDetails.acount_holder_name} />
            <InfoRow label="Account Number" value={bankDetails.account_number} />
            <InfoRow label="IFSC"           value={bankDetails.ifsc_code} />
            <InfoRow label="Bank"           value={bankDetails.bank_name} />
            <InfoRow label="Branch"         value={bankDetails.branch_name} />
            <InfoRow label="UPI ID"         value={bankDetails.upi_id} />
          </div>
        </Card>
      )}

      {/* Documents */}
      {(documents?.length ?? 0) > 0 && (
        <Card title="Documents" icon={FileText}>
          <div className="grid gap-3 sm:grid-cols-2">
            {documents!.map(doc => {
              const isImage = !!doc.attachment?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
              const label   = doc.document_type?.replace(/_/g, " ") ?? `Doc #${doc.document_id}`;
              return (
                <div key={doc.document_id} className="overflow-hidden rounded-lg border border-[#d1fae5] bg-white">
                  {/* Card header */}
                  <div className="flex items-center justify-between bg-[#f0fdf4] px-3 py-2">
                    <p className="text-[12px] font-semibold capitalize text-[#14532d]">{label}</p>
                    {doc.attachment && (
                      <button
                        onClick={() => setPreviewDoc({ url: doc.attachment!, label })}
                        className="flex items-center gap-1 rounded-lg border border-[#d1fae5] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#16a34a] hover:bg-emerald-50"
                      >
                        <Eye size={10} /> Preview
                      </button>
                    )}
                  </div>
                  {/* Thumbnail / file placeholder */}
                  {doc.attachment ? (
                    <button
                      className="group relative flex w-full cursor-pointer items-center justify-center bg-[#f8fafc] p-2"
                      style={{ minHeight: 96 }}
                      onClick={() => setPreviewDoc({ url: doc.attachment!, label })}
                    >
                      {isImage ? (
                        <>
                          <img
                            src={doc.attachment}
                            alt={label}
                            className="max-h-24 max-w-full rounded object-contain transition group-hover:opacity-70"
                          />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                            <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                              <Eye size={11} /> View
                            </span>
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-2 text-[#9ca3af] transition group-hover:text-[#16a34a]">
                          <FileText size={32} />
                          <span className="text-[11px] font-medium">Click to preview</span>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-[11px] text-[#9ca3af]">No attachment</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Preview modal */}
      {previewDoc && (
        <DocPreviewModal
          url={previewDoc.url}
          label={previewDoc.label}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
