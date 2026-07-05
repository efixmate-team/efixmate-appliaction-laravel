"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Loader2, RotateCcw, User } from "lucide-react";
import { getMyJobs } from "@/lib/api/technicianClient";

type Job = {
  booking_id: number; booking_uid?: string; service_name?: string;
  customer_name?: string; scheduled_date?: string;
  final_price?: number | null; completed_at?: string | null;
};

export default function TechCompletedJobsPage() {
  const [rows, setRows]     = useState<Job[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const LIMIT = 15;

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getMyJobs({ page: p, limit: LIMIT, status: "completed" }) as { status: boolean; data?: { rows: Job[]; total: number } };
      if (res?.status && res.data) { setRows(res.data.rows); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const changePage = (p: number) => { setPage(p); load(p); };
  const totalPages = Math.ceil(total / LIMIT);
  const pageRevenue = rows.reduce((s, j) => s + (j.final_price ? Number(j.final_price) : 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#14532d]">Completed Jobs</h1>
        <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f0fdf4]">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
            <p className="text-[22px] font-bold text-[#14532d]">{total}</p>
            <p className="text-[12px] text-[#6b7280]">Total Completed</p>
          </div>
          <div className="rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
            <p className="text-[22px] font-bold text-emerald-700">₹{pageRevenue.toFixed(0)}</p>
            <p className="text-[12px] text-[#6b7280]">Revenue (this page)</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#d1fae5] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#16a34a]" /></div>
        ) : !rows.length ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-[#9ca3af]">
            <CheckCircle2 size={32} />
            <p className="text-[13px]">No completed jobs yet</p>
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
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0fdf4]">
                {rows.map(job => (
                  <tr key={job.booking_id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /><span className="font-semibold text-[#14532d]">{job.booking_uid ?? `#${job.booking_id}`}</span></div>
                    </td>
                    <td className="px-4 py-3 text-[#4b5563]">{job.service_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#4b5563]"><User size={11} className="text-[#9ca3af]" />{job.customer_name ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#6b7280]"><Calendar size={11} />{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{job.completed_at ? new Date(job.completed_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{job.final_price != null ? `₹${Number(job.final_price).toFixed(2)}` : "—"}</td>
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
