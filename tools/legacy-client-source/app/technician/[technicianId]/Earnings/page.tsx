"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, BadgeIndianRupee,
  ChevronLeft, ChevronRight, Loader2, RotateCcw, Wallet,
} from "lucide-react";
import { getMyEarnings } from "@/lib/api/technicianClient";

type LedgerRow = {
  ledger_id: number; entry_type: "CREDIT" | "DEBIT";
  amount: number; balance_after: number;
  description?: string; created_at?: string;
  booking_id?: number | null;
};
type Stats = {
  total_earned: number; this_month: number;
  total_debited: number; wallet_balance: number;
  total_paid_out: number; payout_count: number;
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-[20px] font-bold text-[#14532d]">{value}</p>
      <p className="text-[11px] font-medium text-[#6b7280]">{label}</p>
    </div>
  );
}

export default function TechEarningsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [rows, setRows]     = useState<LedgerRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const LIMIT = 20;

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getMyEarnings({ page: p, limit: LIMIT }) as {
        status: boolean;
        data?: { stats: Stats; rows: LedgerRow[]; total: number };
      };
      if (res?.status && res.data) {
        setStats(res.data.stats);
        setRows(res.data.rows ?? []);
        setTotal(res.data.total ?? 0);
      }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const changePage = (p: number) => { setPage(p); load(p); };
  const totalPages = Math.ceil(total / LIMIT);
  const fmt = (n: number) => `₹${Number(n ?? 0).toFixed(2)}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#14532d]">Earnings</h1>
        <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f0fdf4]">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#16a34a]" />
        </div>
      ) : !stats ? (
        <p className="py-20 text-center text-sm text-[#6b7280]">Unable to load earnings data.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={BadgeIndianRupee} label="Total Earned"    value={fmt(stats.total_earned)}   color="bg-emerald-500" />
            <StatCard icon={BadgeIndianRupee} label="This Month"      value={fmt(stats.this_month)}     color="bg-blue-500" />
            <StatCard icon={Wallet}           label="Wallet Balance"  value={fmt(stats.wallet_balance)} color="bg-purple-500" />
            <StatCard icon={ArrowUpRight}     label="Total Paid Out"  value={fmt(stats.total_paid_out)} color="bg-amber-500" />
            <StatCard icon={ArrowDownLeft}    label="Total Debited"   value={fmt(stats.total_debited)}  color="bg-red-400" />
            <StatCard icon={BadgeIndianRupee} label="Payouts Made"    value={String(stats.payout_count ?? 0)} color="bg-slate-500" />
          </div>

          <div className="overflow-hidden rounded-lg border border-[#d1fae5] bg-white shadow-sm">
            <div className="border-b border-[#f0fdf4] bg-[#f9fafb] px-4 py-3">
              <p className="text-[12px] font-bold text-[#14532d]">Transaction Ledger</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" /></div>
            ) : !rows.length ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#9ca3af]">
                <Wallet size={28} />
                <p className="text-[12px]">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0fdf4]">
                {rows.map(row => (
                  <div key={row.ledger_id} className="flex items-center justify-between px-4 py-3 hover:bg-[#f9fafb]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${row.entry_type === "CREDIT" ? "bg-emerald-50" : "bg-red-50"}`}>
                        {row.entry_type === "CREDIT"
                          ? <ArrowDownLeft size={14} className="text-emerald-600" />
                          : <ArrowUpRight size={14} className="text-red-500" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#374151]">
                          {row.description ?? (row.entry_type === "CREDIT" ? "Credit" : "Debit")}
                        </p>
                        <p className="text-[11px] text-[#9ca3af]">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                          {row.booking_id ? ` · Booking #${row.booking_id}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[14px] font-bold ${row.entry_type === "CREDIT" ? "text-emerald-700" : "text-red-500"}`}>
                        {row.entry_type === "CREDIT" ? "+" : "−"}₹{Number(row.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">Bal: ₹{Number(row.balance_after).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#9ca3af]">Page {page} of {totalPages} · {total} transactions</p>
              <div className="flex gap-1">
                <button onClick={() => changePage(page - 1)} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-white text-[#6b7280] disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-white text-[#6b7280] disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
