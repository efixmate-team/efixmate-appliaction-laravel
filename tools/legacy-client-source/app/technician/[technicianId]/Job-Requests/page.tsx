"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Calendar, ChevronLeft, ChevronRight, Loader2, RotateCcw, User } from "lucide-react";
import { getMyJobs } from "@/lib/api/technicianClient";

type Job = {
  booking_id: number; booking_uid?: string; status_name?: string;
  service_name?: string; customer_name?: string;
  scheduled_date?: string; final_price?: number | null; completed_at?: string | null;
};

const FILTERS = [
  { label: "All",     value: "all" },
  { label: "Active",  value: "active" },
  { label: "Pending", value: "pending" },
];

function statusColor(s?: string) {
  const l = (s ?? "").toLowerCase();
  if (l.includes("complet")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (l.includes("cancel") || l.includes("reject")) return "border-red-200 bg-red-50 text-red-600";
  if (l.includes("progress") || l.includes("active") || l.includes("accept")) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function TechJobRequestsPage() {
  const [rows, setRows]     = useState<Job[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(1);
  const LIMIT = 15;

  const load = useCallback(async (f = filter, p = page) => {
    setLoading(true);
    try {
      const res = await getMyJobs({ page: p, limit: LIMIT, status: f }) as { status: boolean; data?: { rows: Job[]; total: number } };
      if (res?.status && res.data) { setRows(res.data.rows); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (f: string) => { setFilter(f); setPage(1); load(f, 1); };
  const changePage   = (p: number) => { setPage(p); load(filter, p); };
  const totalPages   = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#14532d]">Job Requests</h1>
        <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f0fdf4]">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => changeFilter(f.value)}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${filter === f.value ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#d1fae5] bg-white text-[#6b7280] hover:bg-[#f0fdf4]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d1fae5] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#16a34a]" /></div>
        ) : !rows.length ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-[#9ca3af]">
            <BriefcaseBusiness size={32} />
            <p className="text-[13px] font-medium">No jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#f0fdf4] bg-[#f9fafb] text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0fdf4]">
                {rows.map(job => (
                  <tr key={job.booking_id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 font-semibold text-[#14532d]">{job.booking_uid ?? `#${job.booking_id}`}</td>
                    <td className="px-4 py-3 text-[#4b5563]">{job.service_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#4b5563]"><User size={11} className="text-[#9ca3af]" />{job.customer_name ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#6b7280]"><Calendar size={11} className="text-[#9ca3af]" />{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(job.status_name)}`}>{job.status_name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#14532d]">{job.final_price != null ? `₹${Number(job.final_price).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#9ca3af]">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-1">
            <button onClick={() => changePage(page - 1)} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-white text-[#6b7280] disabled:opacity-40"><ChevronLeft size={14} /></button>
            <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-white text-[#6b7280] disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
