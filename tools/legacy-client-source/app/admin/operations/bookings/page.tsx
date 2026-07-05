"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Zap, CheckCircle, Users, Clock, CalendarClock } from "lucide-react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";

type BookingRow = {
  booking_id: number;
  booking_uid: string;
  customer_name: string;
  service_name: string;
  status_name: string;
  lifecycle_state: string;
  technician_id: number | null;
};

export default function BookingOperationsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown> | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const res = await adminOperationalAPI.bookings.live({ page, limit });
    if (res.status && res.data) {
      const d = res.data as { rows?: BookingRow[]; total?: number };
      setRows(d.rows || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const runAction = async (fn: () => Promise<{ status: boolean; message?: string }>, label: string) => {
    if (!selected) return;
    setActionMsg(null);
    const res = await fn();
    setActionMsg({ text: res.status ? `${label} successful` : (res.message || `${label} failed`), ok: res.status });
    fetchRows();
  };

  const openTimeline = async (row: BookingRow) => {
    setSelected(row);
    setTimeline(null);
    setActionMsg(null);
    const t = await adminOperationalAPI.bookings.timeline(row.booking_id);
    if (t.status) setTimeline(t.data as Record<string, unknown>);
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Booking Operations</h1>
          <p className="mt-0.5 text-sm text-[#53697e]">Real-time booking pipeline — active & in-progress jobs</p>
        </div>
        <button
          type="button"
          onClick={fetchRows}
          className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0]/80 bg-[#ffffff] px-3.5 py-2 text-sm font-medium text-[#475569] shadow-sm hover:bg-[#f8fafc] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Live table ── */}
      <PaginatedTable
        title="Live bookings"
        data={rows}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={fetchRows}
        rowKey="booking_id"
        showRefresh
      >
        <Column
          header="Booking"
          dataKey="booking_uid"
          render={(_val, row: BookingRow) => (
            <span className="font-mono text-[13px] font-semibold text-[#334155]">
              {row.booking_uid || `#${row.booking_id}`}
            </span>
          )}
        />
        <Column header="Customer" dataKey="customer_name" />
        <Column header="Service"  dataKey="service_name"  />
        <Column
          header="Status"
          dataKey="status_name"
          render={(val) => (
            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
              {String(val)}
            </span>
          )}
        />
        <Column
          header="Lifecycle"
          dataKey="lifecycle_state"
          render={(val) => (
            <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2563eb]">
              {String(val)}
            </span>
          )}
        />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={[{ label: "View", onClick: (row: BookingRow) => void openTimeline(row) }]}
        />
      </PaginatedTable>

      {/* ── Selected booking panel ── */}
      {selected && (
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6a7f] mb-0.5">Selected Booking</p>
              <h2 className="text-base font-bold text-[#0f172a]">
                {selected.booking_uid || `#${selected.booking_id}`}
              </h2>
              <p className="text-sm text-[#53697e] mt-0.5">{selected.customer_name} · {selected.service_name}</p>
            </div>
            <button
              type="button"
              onClick={() => { setSelected(null); setTimeline(null); setActionMsg(null); }}
              className="text-[#5c6a7f] hover:text-[#475569] transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Action message */}
          {actionMsg && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              actionMsg.ok
                ? "bg-[#ecfdf5] text-[#047857] border border-[#d1fae5]"
                : "bg-[#fef2f2] text-[#b91c1c] border border-[#fee2e2]"
            }`}>
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              {actionMsg.text}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => runAction(
                () => adminOperationalAPI.bookings.escalate({ bookingId: selected.booking_id, level: "L2", reason: "Admin escalation" }),
                "Escalate"
              )}
              className="flex items-center gap-1.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-sm font-semibold text-[#b45309] hover:bg-[#fef3c7] transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Escalate
            </button>
            <button
              type="button"
              onClick={() => runAction(
                () => adminOperationalAPI.bookings.forceComplete({ bookingId: selected.booking_id }),
                "Force complete"
              )}
              className="flex items-center gap-1.5 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-2 text-sm font-semibold text-[#047857] hover:bg-[#d1fae5] transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Force Complete
            </button>
            <button
              type="button"
              onClick={() => {
                const techId = prompt("Enter Technician ID");
                if (!techId) return;
                runAction(
                  () => adminOperationalAPI.bookings.reassign({ bookingId: selected.booking_id, technicianId: Number(techId) }),
                  "Reassign"
                );
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#c7d2fe] bg-[#6f7790] px-4 py-2 text-sm font-semibold text-[#4338ca] hover:bg-[#e0e7ff] transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Reassign
            </button>
          </div>

          {/* Timeline */}
          {timeline && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-[#5c6a7f]" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6a7f]">Timeline</p>
              </div>
              <pre className="max-h-52 overflow-auto rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3 text-[11px] leading-relaxed text-[#475569]">
                {JSON.stringify(timeline, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

