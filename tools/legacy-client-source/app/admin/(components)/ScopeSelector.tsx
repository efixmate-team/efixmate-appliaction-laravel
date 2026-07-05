"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, Globe2, RotateCcw } from "lucide-react";
import { useAdminScopeStore, applyDefaultFyFromMeta, DEFAULT_FY_LABEL } from "@/store/adminScope.store";
import { dispatchAdminScopeChanged } from "@/lib/adminScopeQuery";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DropItem { id: number; name: string }
interface FY { fy_id: number; fy_label: string; is_current: boolean }

import { GET, POST } from "@/lib/api/coreClient";
import { masterAPI } from "@/lib/api/adminApi";
import { useAuthStore } from "@/store/auth.store";

const scopeApi = (path: string, method = "GET", body?: object) =>
  method === "POST" ? POST(path, body) : GET(path);

function mapRows<T extends Record<string, unknown>>(
  res: { status?: boolean; data?: T[] } | null | undefined,
  idKey: keyof T,
  nameKey: keyof T,
): DropItem[] {
  if (!res?.status || !Array.isArray(res.data)) return [];
  return res.data.map((row) => ({
    id: Number(row[idKey]),
    name: String(row[nameKey] ?? ""),
  }));
}

// ─── Select component ─────────────────────────────────────────────────────────
function ScopeSelect({
  label, value, onChange, options, placeholder, loading,
}: {
  label: string; value: number | null;
  onChange: (id: number | null, name: string | null) => void;
  options: DropItem[]; placeholder: string; loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[130px] flex-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={e => {
            const v = e.target.value;
            if (!v) { onChange(null, null); return; }
            const item = options.find(o => o.id === Number(v));
            onChange(Number(v), item?.name ?? null);
          }}
          disabled={loading}
          className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 pr-7 text-[12px] font-medium text-[#334155] outline-none focus:border-[#93c5fd] focus:ring-1 focus:ring-[#bfdbfe] disabled:opacity-50 transition-colors"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScopeSelector() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<DropItem[]>([]);
  const [states,    setStates]    = useState<DropItem[]>([]);
  const [cities,    setCities]    = useState<DropItem[]>([]);
  const [areas,     setAreas]     = useState<DropItem[]>([]);
  const [fys,       setFys]       = useState<FY[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const scope = useAdminScopeStore();
  const adminUser = useAuthStore((s) => s.user);

  const [draft, setDraft] = useState({
    country_id: scope.country_id, country_name: scope.country_name,
    state_id:   scope.state_id,   state_name:   scope.state_name,
    city_id:    scope.city_id,    city_name:    scope.city_name,
    area_id:    scope.area_id,    area_name:    scope.area_name,
    fy_id:      scope.fy_id,      fy_label:     scope.fy_label,
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  const hydrateScopePref = useCallback((pref: Record<string, unknown> | null | undefined) => {
    if (!pref) return;
    scope.setScope({
      country_id: (pref.country_id as number) ?? 1,
      country_name: (pref.country_name as string) ?? "India",
      state_id: (pref.state_id as number) ?? null,
      state_name: (pref.state_name as string) ?? null,
      city_id: (pref.city_id as number) ?? null,
      city_name: (pref.city_name as string) ?? null,
      area_id: (pref.area_id as number) ?? null,
      area_name: (pref.area_name as string) ?? null,
      fy_id: (pref.fy_id as number) ?? null,
      fy_label: (pref.fy_label as string) ?? DEFAULT_FY_LABEL,
    });
  }, [scope]);

  // Load FYs + saved preference after admin session is known
  useEffect(() => {
    if (!adminUser?.admin_id) return;
    let cancelled = false;
    scopeApi("/admin/scope/meta").then((res) => {
      if (cancelled || res?.networkError || !res?.status || !res.data) return;
      setFys(res.data.financial_years ?? []);
      applyDefaultFyFromMeta(res.data.financial_years, res.data.default_fy);
      hydrateScopePref(res.data.saved_preference ?? res.data.resolved_scope);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser?.admin_id]);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const [countriesRes, scopeRes] = await Promise.all([
        masterAPI.getCountries({ limit: "all", is_active: true }),
        scopeApi("/admin/scope/meta"),
      ]);
      setCountries(mapRows(countriesRes, "country_id", "country_name"));
      if (scopeRes?.status && scopeRes.data) {
        setFys(scopeRes.data.financial_years ?? []);
        applyDefaultFyFromMeta(scopeRes.data.financial_years, scopeRes.data.default_fy);
        hydrateScopePref(scopeRes.data.saved_preference);
      }
    } finally {
      setLoading(false);
    }
  }, [hydrateScopePref]);

  const loadCascade = useCallback(async (countryId?: number | null, stateId?: number | null, cityId?: number | null) => {
    try {
      const [statesRes, citiesRes, areasRes] = await Promise.all([
        countryId
          ? masterAPI.getStates({ country_id: countryId, limit: "all", is_active: true })
          : Promise.resolve({ status: true, data: [] }),
        stateId
          ? masterAPI.getCities({ state_id: stateId, limit: "all", is_active: true })
          : Promise.resolve({ status: true, data: [] }),
        cityId
          ? masterAPI.getAreas({ city_id: cityId, limit: "all", is_active: true })
          : countryId
            ? masterAPI.getAreas({ limit: "all", is_active: true })
            : Promise.resolve({ status: true, data: [] }),
      ]);
      setStates(mapRows(statesRes, "state_id", "state_name"));
      setCities(mapRows(citiesRes, "city_id", "city_name"));
      setAreas(mapRows(areasRes, "area_id", "area_name"));
    } catch {
      setStates([]); setCities([]); setAreas([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDraft({
        country_id: scope.country_id, country_name: scope.country_name,
        state_id:   scope.state_id,   state_name:   scope.state_name,
        city_id:    scope.city_id,    city_name:    scope.city_name,
        area_id:    scope.area_id,    area_name:    scope.area_name,
        fy_id:      scope.fy_id,      fy_label:     scope.fy_label,
      });
      loadMeta();
      loadCascade(scope.country_id, scope.state_id, scope.city_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCountryChange = (id: number | null, name: string | null) => {
    setDraft(d => ({ ...d, country_id: id, country_name: name, state_id: null, state_name: null, city_id: null, city_name: null, area_id: null, area_name: null }));
    setStates([]); setCities([]); setAreas([]);
    if (id) loadCascade(id, null, null);
  };
  const handleStateChange = (id: number | null, name: string | null) => {
    setDraft(d => ({ ...d, state_id: id, state_name: name, city_id: null, city_name: null, area_id: null, area_name: null }));
    setCities([]); setAreas([]);
    if (id) loadCascade(draft.country_id, id, null);
  };
  const handleCityChange = (id: number | null, name: string | null) => {
    setDraft(d => ({ ...d, city_id: id, city_name: name, area_id: null, area_name: null }));
    setAreas([]);
    if (id) loadCascade(draft.country_id, draft.state_id, id);
  };

  const handleApply = async () => {
    const fy = fys.find(f => f.fy_id === draft.fy_id);
    const applied = { ...draft, fy_label: fy?.fy_label ?? draft.fy_label ?? DEFAULT_FY_LABEL };
    scope.setScope(applied);
    scopeApi("/admin/scope/preference", "POST", {
      country_id: draft.country_id, state_id: draft.state_id,
      city_id: draft.city_id, area_id: draft.area_id, fy_id: draft.fy_id,
    }).catch(() => {});
    setOpen(false);
    dispatchAdminScopeChanged();
  };

  const handleReset = () => {
    const defaultFy = fys.find(f => f.fy_label === DEFAULT_FY_LABEL) ?? fys.find(f => f.is_current);
    const reset = {
      country_id: 1, country_name: "India",
      state_id: null, state_name: null,
      city_id: null, city_name: null,
      area_id: null, area_name: null,
      fy_id: defaultFy?.fy_id ?? null,
      fy_label: defaultFy?.fy_label ?? DEFAULT_FY_LABEL,
    };
    setDraft(reset);
    scope.resetScope();
    scope.setScope(reset);
    loadCascade(1, null, null);
    dispatchAdminScopeChanged();
  };

  // Navbar pill labels
  const currentFyLabel = fys.find(f => f.is_current)?.fy_label;
  const navCountry = scope.country_name ?? "India";
  const navFy      = scope.fy_label ?? currentFyLabel ?? "FY";
  const currentFy  = fys.find(f => f.is_current);
  const activeFyLabel = draft.fy_label ?? currentFy?.fy_label ?? "Current FY";

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-all ${
          open
            ? "border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]"
            : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f1f5f9]"
        }`}
      >
        <Globe2 size={14} className={open ? "text-[#2563eb]" : "text-[#94a3b8]"} />
        <span className="hidden sm:inline">
          {navCountry}
          <span className="mx-1 text-[#cbd5e1]">·</span>
          <span className="text-[#94a3b8]">{navFy}</span>
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 mt-2 z-[200] w-[520px] max-w-[calc(100vw-1rem)] rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-xl shadow-[#0f172a]/10 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-[#f1f5f9] px-4 py-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2563eb]">
              <Globe2 size={12} className="text-[#ffffff]" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-[#1e293b]">Select Scope</p>
              <p className="text-[10.5px] text-[#94a3b8]">Filter applies across the entire admin panel</p>
            </div>
          </div>

          {/* Selects grid */}
          <div className="flex flex-wrap gap-3 px-4 py-3.5">
            <ScopeSelect label="Country" value={draft.country_id} onChange={handleCountryChange}
              options={countries} placeholder="Select Country" loading={loading} />
            <ScopeSelect label="State" value={draft.state_id} onChange={handleStateChange}
              options={states} placeholder={draft.country_id ? "All States" : "— Country first —"} loading={loading} />
            <ScopeSelect label="City" value={draft.city_id} onChange={handleCityChange}
              options={cities} placeholder={draft.state_id ? "All Cities" : "— State first —"} loading={loading} />
            <ScopeSelect label="Area / Zone" value={draft.area_id}
              onChange={(id, name) => setDraft(d => ({ ...d, area_id: id, area_name: name }))}
              options={areas} placeholder="All Areas" loading={loading} />

            <div className="flex flex-col gap-1.5 min-w-[130px] flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                Financial Year
              </label>
              <div className="relative">
                <select
                  value={draft.fy_id ?? ""}
                  onChange={e => {
                    const v = e.target.value;
                    const fy = fys.find(f => f.fy_id === Number(v));
                    setDraft(d => ({ ...d, fy_id: v ? Number(v) : null, fy_label: fy?.fy_label ?? null }));
                  }}
                  className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 pr-7 text-[12px] font-medium text-[#334155] outline-none focus:border-[#93c5fd] focus:ring-1 focus:ring-[#bfdbfe] transition-colors"
                >
                  <option value="">{DEFAULT_FY_LABEL} (default)</option>
                  {fys.map(f => <option key={f.fy_id} value={f.fy_id}>{f.fy_label}{f.is_current ? " ★" : ""}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              </div>
            </div>
          </div>

          {/* Active scope summary */}
          <div className="mx-4 mb-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-[11px] border border-[#f1f5f9]">
            <span className="font-semibold text-[#475569]">Active: </span>
            <span className="text-[#64748b]">
              {[
                draft.country_name ?? "India",
                draft.state_name   ?? "All States",
                draft.city_name    ?? "All Cities",
                draft.area_name    ?? "All Areas",
                activeFyLabel,
              ].join("  ›  ")}
            </span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-[#f1f5f9] px-4 py-2.5">
            <button type="button" onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
              <RotateCcw size={12} /> Reset
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg border border-[#e2e8f0] px-3.5 py-1.5 text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleApply}
                className="rounded-lg bg-[#2563eb] px-4 py-1.5 text-[12px] font-medium text-[#ffffff] hover:bg-[#1d4ed8] transition-colors shadow-sm">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
