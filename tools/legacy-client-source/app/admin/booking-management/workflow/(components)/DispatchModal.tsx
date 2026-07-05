"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

interface NearbyTechnician {
  technician_id: number;
  name: string;
  avatar: string | null;
  mobile_number: string;
  current_jobs: number;
  max_jobs: number;
  distance_km: number | null;
}

interface DispatchModalProps {
  bookingId: number;
  open: boolean;
  onClose: () => void;
  onDispatched: () => void;
}

export function DispatchModal({ bookingId, open, onClose, onDispatched }: DispatchModalProps) {
  const [technicians, setTechnicians] = useState<NearbyTechnician[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [requiredCount, setRequiredCount] = useState(1);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");

  const fetchTechnicians = useCallback(async () => {
    setLoadingTechs(true);
    setError("");
    try {
      const res = await adminOperationalAPI.bookings.nearbyTechnicians(bookingId);
      if (res.status) {
        setTechnicians(res.data || []);
      } else {
        setError(res.message || "Failed to load technicians");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoadingTechs(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setRequiredCount(1);
      setError("");
      fetchTechnicians();
    }
  }, [open, fetchTechnicians]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDispatch = async () => {
    if (!selected.size) {
      setError("Select at least one technician.");
      return;
    }
    setDispatching(true);
    setError("");
    try {
      const res = await adminOperationalAPI.bookings.dispatch(bookingId, {
        technicianIds: Array.from(selected),
        requiredCount,
      });
      if (res.status) {
        onDispatched();
        onClose();
      } else {
        setError(res.message || "Dispatch failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setDispatching(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0f172a]">Manual Dispatch</h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Select technicians to notify — they can accept or skip
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#334155] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Required count */}
        <div className="px-6 py-3 border-b border-[#f1f5f9] flex items-center gap-3">
          <label className="text-[13px] font-medium text-[#334155] shrink-0">
            Technicians required
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={requiredCount}
            onChange={(e) => setRequiredCount(Math.max(1, Number(e.target.value)))}
            className="w-20 h-8 rounded-lg border border-[#e2e8f0] px-3 text-[13px] text-[#334155] outline-none focus:border-[#2563eb]"
          />
          <span className="text-[12px] text-[#94a3b8]">
            (job needs this many technicians)
          </span>
        </div>

        {/* Technician list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loadingTechs ? (
            <div className="py-8 text-center text-[13px] text-[#94a3b8]">
              Finding nearby online technicians…
            </div>
          ) : technicians.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#94a3b8]">
              No online technicians available for this service right now.
            </div>
          ) : (
            technicians.map((t) => {
              const isSelected = selected.has(t.technician_id);
              const isBusy = t.current_jobs >= t.max_jobs;
              return (
                <label
                  key={t.technician_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    isSelected
                      ? "border-[#2563eb] bg-blue-50"
                      : "border-[#e2e8f0] hover:border-[#94a3b8] bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(t.technician_id)}
                    className="sr-only"
                  />
                  {/* Checkbox indicator */}
                  <div
                    className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "bg-[#2563eb] border-[#2563eb]" : "bg-white border-[#cbd5e1]"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[12px] font-semibold text-[#64748b]">
                        {t.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#0f172a] truncate">{t.name}</span>
                      {isBusy && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Busy</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[#64748b]">{t.mobile_number}</span>
                      <span className="text-[10px] text-[#94a3b8]">·</span>
                      <span className="text-[11px] text-[#64748b]">{t.current_jobs}/{t.max_jobs} jobs</span>
                    </div>
                  </div>

                  {/* Distance */}
                  {t.distance_km != null && (
                    <div className="shrink-0 text-right">
                      <span className="text-[12px] font-semibold text-[#2563eb]">{t.distance_km} km</span>
                    </div>
                  )}
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0]">
          {error && (
            <p className="text-[12px] text-[#dc2626] mb-3">{error}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-[#64748b]">
              {selected.size} technician{selected.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={dispatching}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDispatch}
                disabled={dispatching || selected.size === 0}
              >
                {dispatching ? "Dispatching…" : `Dispatch (${selected.size})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
