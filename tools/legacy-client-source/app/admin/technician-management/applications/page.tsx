"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import {
  Check, XCircle, Eye, X, ExternalLink, ChevronDown, ChevronUp,
  User, Wrench, FileText, Camera, Banknote, AlertTriangle, CheckCircle2,
  Clock, MessageSquare,
} from "lucide-react";
import PaginatedTable, { Column, AvatarCell } from "@/app/admin/(components)/Table";
import { technicianAdminAPI } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api/coreClient";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import Modal from "@/components/modals/Modal";

function apiFileUrl(path?: string | null) {
  if (!path) return null;
  return resolveUploadUrl(path) || null;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function countText(done?: number, total?: number, fallbackTotal = 0) {
  const d = Number(done ?? 0);
  const t = Number(total ?? fallbackTotal);
  return t > 0 ? `${d}/${t}` : String(d);
}

// ── Status badge ──────────────────────────────────────────────────────────────
type SectionStatus = "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status?: SectionStatus | null }) {
  if (!status || status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
        <Clock size={10} /> Pending
      </span>
    );
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 size={10} /> Approved
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-200">
      <XCircle size={10} /> Rejected
    </span>
  );
}

// ── Section review panel ──────────────────────────────────────────────────────
function SectionReviewBar({
  sectionKey,
  technicianId,
  currentStatus,
  onDone,
}: {
  sectionKey: string;
  technicianId: number;
  currentStatus?: SectionStatus | null;
  onDone: (section: string, status: SectionStatus, remark: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!action) return;
    if (action === "rejected" && !remark.trim()) { setErr("Remark required when rejecting."); return; }
    setBusy(true); setErr("");
    try {
      await technicianAdminAPI.reviewSection({ technicianId, section: sectionKey, status: action, remark: remark.trim() || undefined });
      onDone(sectionKey, action, remark.trim());
      setOpen(false); setAction(null); setRemark("");
    } catch {
      setErr("Failed to save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-semibold text-[#334155] underline underline-offset-2 hover:text-[#0f172a]"
        >
          {currentStatus === "pending" || !currentStatus ? "Review this section" : "Change decision"}
        </button>
      ) : (
        <div className="mt-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAction("approved")}
              className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all ${action === "approved" ? "bg-emerald-600 text-white" : "border border-[#d1d5db] text-[#374151] hover:border-emerald-500 hover:text-emerald-600"}`}
            >
              <Check size={13} /> Approve
            </button>
            <button
              type="button"
              onClick={() => setAction("rejected")}
              className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all ${action === "rejected" ? "bg-red-600 text-white" : "border border-[#d1d5db] text-[#374151] hover:border-red-500 hover:text-red-600"}`}
            >
              <XCircle size={13} /> Reject
            </button>
          </div>
          {action === "rejected" && (
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Rejection remark (required — shown to technician)"
              rows={2}
              className="w-full resize-none rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-[12px] text-[#1e293b] outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
            />
          )}
          {action === "approved" && (
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Note (optional)"
              rows={1}
              className="w-full resize-none rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-[12px] text-[#1e293b] outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
          )}
          {err && <p className="text-[11px] text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!action || busy}
              className="h-7 flex-1 rounded-lg bg-[#0f172a] text-[11px] font-semibold text-white hover:bg-[#1e293b] disabled:opacity-40"
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setAction(null); setRemark(""); setErr(""); }}
              className="h-7 w-16 rounded-lg border border-[#d1d5db] text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({
  icon, title, sectionKey, technicianId, review, children, onReviewDone,
}: {
  icon: React.ReactNode;
  title: string;
  sectionKey: string;
  technicianId: number;
  review?: { status?: SectionStatus; remark?: string } | null;
  children: React.ReactNode;
  onReviewDone: (section: string, status: SectionStatus, remark: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#f8fafc]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569]">{icon}</span>
          <span className="text-[13px] font-bold text-[#1e293b]">{title}</span>
          <StatusBadge status={review?.status as SectionStatus} />
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#94a3b8]" /> : <ChevronDown size={16} className="text-[#94a3b8]" />}
      </button>
      {expanded && (
        <div className="border-t border-[#f1f5f9] px-4 pb-4 pt-3 space-y-3">
          {review?.remark && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <MessageSquare size={13} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[12px] text-amber-800"><span className="font-semibold">Remark:</span> {review.remark}</p>
            </div>
          )}
          {children}
          <SectionReviewBar
            sectionKey={sectionKey}
            technicianId={technicianId}
            currentStatus={review?.status as SectionStatus}
            onDone={onReviewDone}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TechnicianRequestsPage() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "Done", subtitle: "" });
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  const fetchRequests = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const appStatus = overrides.applicationStatus ?? filterStatus;
      const res = await technicianAdminAPI.getTechnicians({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(appStatus ? { applicationStatus: appStatus } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total ?? res.total ?? 0);
        setPage(res.pagination?.page ?? 1);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, limit, search, filterStatus]);

  useEffect(() => { fetchRequests({ applicationStatus: "pending" }); }, []);

  const handleView = async (row: any) => {
    setViewOpen(true); setViewLoading(true); setViewData(null);
    try {
      const res = await technicianAdminAPI.getTechnicianById({ technicianId: row.technician_id });
      if (res.status && res.data) setViewData(res.data);
      else { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 2000); setViewOpen(false); }
    } catch { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 2000); setViewOpen(false); }
    finally { setViewLoading(false); }
  };

  const handleApproveAll = async (row: any) => {
    try {
      await technicianAdminAPI.approveTechnician({ technicianId: row.technician_id, isActive: true });
      setSuccessMessage({ title: "Approved", subtitle: "Technician is now active." });
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchRequests(); setViewOpen(false); }, 1500);
    } catch { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 2000); }
  };

  const handleRejectAll = async (row: any) => {
    const reason = typeof window !== "undefined" ? window.prompt("Overall rejection reason (shown to technician):") : null;
    if (reason === null) return;
    if (!String(reason).trim()) { window.alert("Reason required."); return; }
    try {
      await technicianAdminAPI.approveTechnician({ technicianId: row.technician_id, isActive: false, applicationStatus: "rejected", rejectRemark: reason.trim() });
      setSuccessMessage({ title: "Rejected", subtitle: "Technician notified." });
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchRequests(); setViewOpen(false); }, 1500);
    } catch { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 2000); }
  };

  const handleSectionReviewDone = (section: string, status: SectionStatus, remark: string) => {
    setViewData((prev: any) => {
      if (!prev) return prev;
      const updatedReviews = { ...prev.sectionReviews, [section]: { section, status, remark } };
      const updatedDocs = (prev.documents ?? []).map((d: any) =>
        d.section_key === section ? { ...d, review: { section, status, remark } } : d
      );
      const updatedSelfie = section === "selfie" ? { ...prev.selfie, review: { section, status, remark } } : prev.selfie;
      return { ...prev, sectionReviews: updatedReviews, documents: updatedDocs, selfie: updatedSelfie };
    });
  };

  const tech = viewData?.technician;
  const bank = viewData?.bankDetails;
  const selfieUrl = apiFileUrl(viewData?.selfie?.url || tech?.selfie_url || tech?.selfie_photo);
  const sr = viewData?.sectionReviews ?? {};

  return (
    <div className="space-y-6">
      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title={successMessage.title} subtitle={successMessage.subtitle} />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to process request." onFinish={() => setFailedOverlay(false)} />

      <PaginatedTable
        showMe={true}
        title="Technician Applications"
        badge="Requests"
        subtitle={`${total} applications`}
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={(p) => { setPage(p); fetchRequests({ page: p }); }}
        onLimitChange={(l) => { setLimit(l); fetchRequests({ limit: l, page: 1 }); }}
        onSearch={(v) => { setSearch(v); fetchRequests({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showExport exportFileName="technician_applications" showRefresh
        onRefresh={() => fetchRequests()}
        rowKey="technician_id"
        filters={[{
          type: "dropdown",
          placeholder: "All Statuses",
          value: filterStatus,
          onChange: (v: string) => { setFilterStatus(v); setPage(1); fetchRequests({ applicationStatus: v, page: 1 }); },
          options: [
            { value: "pending", label: "Pending Review" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ],
        }]}
      >
        <Column header="SL" type="serial" />
        <Column
          header="Technician"
          dataKey="first_name"
          render={(_v: unknown, row: any) => (
            <AvatarCell
              value={`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}
              row={{ ...row, avatar: row.selfie_photo }}
            />
          )}
        />
        <Column header="Mobile" dataKey="mobile_number" />
        <Column header="Email" dataKey="email" render={(v) => v || "—"} />
        <Column
          header="Location"
          dataKey="city"
          render={(_v: unknown, row: any) => (
            <div className="min-w-[130px]">
              <p className="text-[12px] font-semibold text-slate-700">{row.city || "—"}</p>
              {(row.state || row.pincode) && (
                <p className="text-[11px] text-slate-500">
                  {[row.state, row.pincode].filter(Boolean).join(" - ")}
                </p>
              )}
            </div>
          )}
        />
        <Column
          header="Skills"
          dataKey="services_count"
          render={(v) => (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
              {Number(v ?? 0)}
            </span>
          )}
        />
        <Column
          header="Docs"
          dataKey="uploaded_mandatory_documents_count"
          render={(_v: unknown, row: any) => (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {countText(row.uploaded_mandatory_documents_count, row.mandatory_documents_count)}
            </span>
          )}
        />
        <Column
          header="Section Reviews"
          dataKey="approved_sections_count"
          render={(_v: unknown, row: any) => (
            <div className="space-y-0.5 text-[11px]">
              <p className="font-semibold text-slate-700">
                {Number(row.approved_sections_count ?? 0)} approved
              </p>
              {Number(row.rejected_sections_count ?? 0) > 0 && (
                <p className="font-semibold text-red-600">{row.rejected_sections_count} rejected</p>
              )}
            </div>
          )}
        />
        <Column header="Applied On" dataKey="created_at" render={(v) => formatDate(v as string)} />
        <Column header="Status" dataKey="application_status" render={(v) => v ?? "—"} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={[
            { label: "Review", icon: Eye, onClick: (row) => { void handleView(row); } },
            { label: "Approve", icon: Check, onClick: (row) => { void handleApproveAll(row); }, onBulkClick: (ids) => Promise.all(ids.map((id: any) => technicianAdminAPI.approveTechnician({ technicianId: id, isActive: true }))).then(() => fetchRequests()) },
            { label: "Reject", icon: XCircle, onClick: (row) => { void handleRejectAll(row); } },
          ]}
        />
      </PaginatedTable>

      {/* ── Review modal ── */}
      <Modal openModal={viewOpen} setOpenModal={setViewOpen} panelClassName="max-w-3xl">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 sticky top-0 bg-white pb-2 z-10">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Registration Review</h2>
              {tech && (
                <p className="text-[12px] text-[#64748b]">
                  {tech.first_name} {tech.last_name} · {tech.mobile_number}
                  <span className="ml-2"><StatusBadge status={tech.application_status} /></span>
                </p>
              )}
            </div>
            <button type="button" onClick={() => setViewOpen(false)} className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9]">
              <X size={18} />
            </button>
          </div>

          {viewLoading && <p className="py-12 text-center text-[13px] text-[#64748b]">Loading…</p>}

          {!viewLoading && tech && (
            <>
              {/* 1. Personal Information */}
              <SectionCard icon={<User size={14} />} title="Personal Information" sectionKey="personal_info"
                technicianId={tech.technician_id} review={sr.personal_info} onReviewDone={handleSectionReviewDone}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                  {[
                    ["Full Name", `${tech.first_name ?? ""} ${tech.last_name ?? ""}`.trim()],
                    ["Mobile", tech.mobile_number],
                    ["City", tech.city],
                    ["State", tech.state],
                    ["Pincode", tech.pincode],
                    ["Address", tech.address],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{label}</p>
                      <p className="text-[#1e293b]">{val ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 2. Skills */}
              <SectionCard icon={<Wrench size={14} />} title="Selected Skills" sectionKey="skills"
                technicianId={tech.technician_id} review={sr.skills} onReviewDone={handleSectionReviewDone}>
                {viewData?.services?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewData.services.map((s: any) => (
                      <span key={s.map_id ?? s.service_id} className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-medium text-[#334155]">
                        {s.service_name || s.service || `Service ${s.service_id}`}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-[12px] text-[#94a3b8]">No skills selected</p>}
              </SectionCard>

              {/* 3. Documents */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f1f5f9]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569]"><FileText size={14} /></span>
                  <span className="text-[13px] font-bold text-[#1e293b]">Documents</span>
                </div>
                <div className="px-4 pb-4 pt-3 space-y-3">
                  {viewData?.documents?.length ? viewData.documents.map((doc: any) => {
                    const url = apiFileUrl(doc.attachment_url || doc.attachement || doc.attachment);
                    const isImg = url && /\.(jpe?g|png|gif|webp)$/i.test(url);
                    return (
                      <div key={doc.document_id} className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-semibold text-[#1e293b]">
                            {doc.document_type_name || doc.document_type || `Document #${doc.document_type_id}`}
                          </p>
                          <StatusBadge status={doc.review?.status} />
                        </div>
                        {doc.review?.remark && (
                          <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                            <MessageSquare size={11} className="mt-0.5 shrink-0 text-amber-600" />
                            <p className="text-[11px] text-amber-800">{doc.review.remark}</p>
                          </div>
                        )}
                        {url && isImg && (
                          <img src={url} alt="" className="max-h-40 w-full rounded-lg object-contain border border-[#e2e8f0] bg-white" />
                        )}
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#334155] hover:underline">
                            View file <ExternalLink size={11} />
                          </a>
                        )}
                        <SectionReviewBar
                          sectionKey={doc.section_key}
                          technicianId={tech.technician_id}
                          currentStatus={doc.review?.status}
                          onDone={handleSectionReviewDone}
                        />
                      </div>
                    );
                  }) : <p className="text-[12px] text-[#94a3b8]">No documents uploaded</p>}
                </div>
              </div>

              {/* 4. Selfie */}
              <SectionCard icon={<Camera size={14} />} title="Selfie Photo" sectionKey="selfie"
                technicianId={tech.technician_id} review={viewData?.selfie?.review ?? (tech.is_selfie_verified ? { status: "approved" } : null)} onReviewDone={handleSectionReviewDone}>
                {selfieUrl ? (
                  <div className="flex items-start gap-4">
                    <img src={selfieUrl} alt="Selfie" className="h-32 w-32 rounded-xl object-cover border border-[#e2e8f0]" />
                    <a href={selfieUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#334155] hover:underline">
                      Full size <ExternalLink size={12} />
                    </a>
                  </div>
                ) : <p className="text-[12px] text-[#94a3b8]">No selfie uploaded</p>}
              </SectionCard>

              {/* 5. Bank / UPI */}
              <SectionCard icon={<Banknote size={14} />} title="Bank / UPI Details" sectionKey="bank"
                technicianId={tech.technician_id} review={sr.bank} onReviewDone={handleSectionReviewDone}>
                {bank ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                    {[
                      ["Type", bank.account_type === "U" ? "UPI" : "Bank Account"],
                      ["Account Holder", bank.acount_holder_name],
                      [bank.account_type === "U" ? "UPI ID" : "Account Number", bank.account_number],
                      ...(bank.account_type !== "U" ? [["IFSC", bank.ifsc_number]] : []),
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{label}</p>
                        <p className="text-[#1e293b]">{val ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[12px] text-[#94a3b8]">No bank details submitted</p>}
              </SectionCard>

              {/* Overall actions */}
              <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-[#f1f5f9] bg-white pt-3">
                <button type="button" onClick={() => handleApproveAll(tech)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700">
                  <Check size={15} /> Approve Application
                </button>
                <button type="button" onClick={() => handleRejectAll(tech)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-100">
                  <XCircle size={15} /> Reject Application
                </button>
                <div className="ml-auto flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#64748b]">
                  <AlertTriangle size={13} /> Approving activates the technician account
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
