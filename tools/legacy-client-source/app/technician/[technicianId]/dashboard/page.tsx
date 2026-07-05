"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, BadgeIndianRupee, BriefcaseBusiness, CheckCircle2,
  Loader2, MapPin, Navigation, RotateCcw, Star, TrendingUp, Wifi, WifiOff,
} from "lucide-react";
import { getDashboard, setAvailability, updateLiveLocation } from "@/lib/api/technicianClient";
import { requestGPS } from "@/lib/locationDetection";

type DashboardData = {
  header?: {
    first_name?: string;
    mobile_number?: string;
    selfie_url?: string;
    is_online?: boolean;
    is_active?: boolean;
    technician_unique_id?: string | null;
    rating?: number;
    total_jobs?: number;
  };
  earnings?: { today_total?: number; wallet_balance?: number };
  stats?: { today_orders?: number; total_completed?: number };
  job_offers?: { booking_id: number; service_name?: string; customer_name?: string; address?: string; amount?: number; expires_at?: string }[];
  todays_completed_jobs?: { booking_id: number; service_name?: string; customer_name?: string; final_price?: number }[];
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[22px] font-bold text-[#14532d]">{value}</p>
      <p className="text-[12px] font-medium text-[#6b7280]">{label}</p>
    </div>
  );
}

export default function TechDashboardPage() {
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "fetching" | "shared" | "denied">("idle");
  const locIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const pushLocation = useCallback(async () => {
    setLocStatus("fetching");
    const pos = await requestGPS();
    if (!pos) {
      setLocStatus("denied");
      return;
    }
    await updateLiveLocation(pos.coords.latitude, pos.coords.longitude);
    setLocStatus("shared");
  }, []);

  const startLocationPolling = useCallback(() => {
    pushLocation();
    locIntervalRef.current = setInterval(pushLocation, 5 * 60 * 1000); // every 5 min
  }, [pushLocation]);

  const stopLocationPolling = useCallback(() => {
    if (locIntervalRef.current) {
      clearInterval(locIntervalRef.current);
      locIntervalRef.current = null;
    }
    setLocStatus("idle");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboard() as { status: boolean; data?: DashboardData };
      if (res?.status && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Start/stop location polling based on online status
  useEffect(() => {
    if (data?.header?.is_online) {
      startLocationPolling();
    } else {
      stopLocationPolling();
    }
    return () => stopLocationPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.header?.is_online]);

  const toggleOnline = async () => {
    if (!data?.header) return;
    setToggling(true);
    try {
      const next = !data.header.is_online;
      const res = await setAvailability(next) as { status: boolean; message?: string };
      if (res?.status !== false) {
        setData(d => d ? { ...d, header: { ...d.header, is_online: next } } : d);
        showToast(next ? "You are now Online" : "You are now Offline");
        if (next) startLocationPolling();
        else stopLocationPolling();
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[#16a34a]" />
    </div>
  );

  if (!data) return <p className="py-20 text-center text-sm text-[#6b7280]">Unable to load dashboard.</p>;

  const h = data.header ?? {};
  const isOnline = h.is_online ?? false;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-[#16a34a] px-4 py-3 text-[13px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#14532d]">Dashboard</h1>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f0fdf4]">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {/* Online toggle */}
      <div className={`rounded-lg border p-4 ${isOnline ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-slate-800">{isOnline ? "You are Online" : "You are Offline"}</p>
            <p className="text-[12px] text-slate-500">{isOnline ? "You can receive job requests" : "Go online to receive jobs"}</p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition disabled:opacity-60 ${isOnline ? "bg-slate-700 text-white hover:bg-slate-800" : "bg-[#16a34a] text-white hover:bg-[#15803d]"}`}
          >
            {toggling ? <Loader2 size={14} className="animate-spin" /> : isOnline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {/* Location status row */}
        {isOnline && (
          <div className="mt-3 flex items-center gap-2 border-t border-emerald-200 pt-3">
            {locStatus === "fetching" && (
              <>
                <Loader2 size={12} className="animate-spin text-emerald-600" />
                <span className="text-[11px] text-emerald-700">Fetching your location…</span>
              </>
            )}
            {locStatus === "shared" && (
              <>
                <MapPin size={12} className="text-emerald-600" />
                <span className="text-[11px] text-emerald-700">Location shared with platform</span>
                <button
                  onClick={pushLocation}
                  className="ml-auto flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <Navigation size={9} /> Update
                </button>
              </>
            )}
            {locStatus === "denied" && (
              <>
                <AlertTriangle size={12} className="text-amber-500" />
                <span className="text-[11px] text-amber-600">Location access denied</span>
                <button
                  onClick={pushLocation}
                  className="ml-auto flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-50"
                >
                  <Navigation size={9} /> Retry
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Today's Jobs"   value={data.stats?.today_orders ?? 0}                         color="bg-blue-500" />
        <StatCard icon={CheckCircle2}      label="Total Completed" value={data.stats?.total_completed ?? h.total_jobs ?? 0}       color="bg-emerald-500" />
        <StatCard icon={BadgeIndianRupee}  label="Today's Earnings" value={`₹${Number(data.earnings?.today_total ?? 0).toFixed(0)}`} color="bg-purple-500" />
        <StatCard icon={TrendingUp}        label="Wallet Balance"  value={`₹${Number(data.earnings?.wallet_balance ?? 0).toFixed(0)}`} color="bg-amber-500" />
      </div>

      {/* Pending job offers */}
      {(data.job_offers?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
          <p className="mb-3 text-[13px] font-bold text-[#14532d]">Pending Job Requests ({data.job_offers!.length})</p>
          <div className="space-y-2">
            {data.job_offers!.map(job => (
              <div key={job.booking_id} className="flex items-start justify-between rounded-lg border border-[#d1fae5] bg-[#f0fdf4] px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-[#14532d]">{job.service_name ?? "—"}</p>
                  <p className="text-[11px] text-[#6b7280]">{job.customer_name} · {job.address}</p>
                </div>
                {job.amount != null && <span className="font-bold text-[#16a34a]">₹{Number(job.amount).toFixed(0)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's completed */}
      {(data.todays_completed_jobs?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-[#d1fae5] bg-white p-4 shadow-sm">
          <p className="mb-3 text-[13px] font-bold text-[#14532d]">Today's Completed Jobs</p>
          <div className="space-y-2">
            {data.todays_completed_jobs!.map(job => (
              <div key={job.booking_id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{job.service_name ?? "—"}</p>
                  <p className="text-[11px] text-slate-500">{job.customer_name}</p>
                </div>
                {job.final_price != null && <span className="font-bold text-emerald-700">₹{Number(job.final_price).toFixed(0)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      {h.rating != null && (
        <div className="flex items-center gap-2 rounded-lg border border-[#d1fae5] bg-white px-4 py-3 shadow-sm">
          <Star size={16} className="fill-amber-400 text-amber-400" />
          <span className="text-[15px] font-bold text-slate-800">{Number(h.rating).toFixed(1)}</span>
          <span className="text-[12px] text-slate-400">avg rating</span>
        </div>
      )}
    </div>
  );
}
