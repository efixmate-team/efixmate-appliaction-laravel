"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, RefreshCw, X } from "lucide-react";
import { masterAPI } from "@/lib/api";
import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";
import type { AreaPoint } from "./_AreasMap";
import { ExportMenu } from "@/app/admin/(components)/Table/toolbar";

const AreasMap = dynamic(() => import("./_AreasMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f8fafc] text-[#5c6a7f]">
      <RefreshCw className="w-6 h-6 animate-spin text-[#60a5fa]" />
      <p className="text-sm">Initialising map…</p>
    </div>
  ),
});

export default function AreasMapPage() {
  const router = useRouter();

  const [allAreas, setAllAreas] = useState<AreaPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const fetchAllAreas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getAreas({ limit: 500, page: 1 });
      if (res?.status) setAllAreas(res.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAllAreas(); }, [fetchAllAreas]);

  const filteredAreas = filterCity
    ? allAreas.filter((a) => String(a.city_id) === String(filterCity))
    : filterState
    ? allAreas.filter((a) => String(a.state_id) === String(filterState))
    : filterCountry
    ? allAreas.filter((a) => String(a.country_id) === String(filterCountry))
    : allAreas;

  const hasFilter = !!(filterCountry || filterState || filterCity);

  const mapExportColumns = useMemo(
    () => [
      { header: "Area Name", dataKey: "area_name" },
      { header: "Country", dataKey: "country_name" },
      { header: "State", dataKey: "state_name" },
      { header: "City", dataKey: "city_name" },
      { header: "Latitude", dataKey: "latitude" },
      { header: "Longitude", dataKey: "longitude" },
      { header: "Radius (km)", dataKey: "radius_km" },
      {
        header: "Status",
        dataKey: "is_active",
        render: (v: unknown) => (v ? "Active" : "Inactive"),
      },
    ],
    []
  );

  const mapExportData = useMemo(
    () =>
      filteredAreas.map((a) => ({
        area_name: a.area_name,
        country_name: a.country_name ?? "",
        state_name: a.state_name ?? "",
        city_name: a.city_name ?? "",
        latitude: a.latitude,
        longitude: a.longitude,
        radius_km: a.radius_km,
        is_active: a.is_active,
      })),
    [filteredAreas]
  );

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 80px)" }}>

      {/* ── Map (full-screen area) ─────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0 rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm bg-[#f8fafc]">

        {/* Floating — back */}
        <button
          type="button"
          onClick={() => router.push("/admin/masters/geography/areas")}
          className="absolute top-3 left-3 z-[1000] inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-[#ffffff]/90 backdrop-blur-sm border border-[#e2e8f0] shadow-md hover:bg-[#ffffff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Floating — area count */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-[#ffffff]/90 backdrop-blur-sm border border-[#e2e8f0] shadow-md text-[#334155]">
            <MapPin className="w-3.5 h-3.5 text-[#eff6ff]" />
            {loading ? "Loading…" : `${filteredAreas.length} area${filteredAreas.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Floating — refresh */}
        <button
          type="button"
          onClick={() => void fetchAllAreas()}
          disabled={loading}
          className="absolute top-3 right-3 z-[1000] p-2 rounded-xl bg-[#ffffff]/90 backdrop-blur-sm border border-[#e2e8f0] shadow-md hover:bg-[#ffffff] text-[#53697e] disabled:opacity-50 transition-colors"
          title="Refresh areas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Map or states */}
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#5c6a7f]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#60a5fa]" />
            <p className="text-sm">Loading areas…</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#5c6a7f]">
            <MapPin className="w-10 h-10" />
            <p className="text-sm font-medium">No areas match the selected filters</p>
            {hasFilter && (
              <button
                type="button"
                onClick={() => { setFilterCountry(""); setFilterState(""); setFilterCity(""); }}
                className="text-xs text-[#2563eb] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <AreasMap areas={filteredAreas} />
        )}
      </div>

      {/* ── Filter bar (under the map) ─────────────────────────────────────── */}
      <div className="shrink-0 bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <AsyncSelect
              name="map_country"
              title="Country"
              resource="countries"
              value={filterCountry}
              onChange={(e: any) => {
                setFilterCountry(e.target.value);
                setFilterState("");
                setFilterCity("");
              }}
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <AsyncSelect
              name="map_state"
              title="State"
              resource="states"
              filters={filterCountry ? { country_id: filterCountry } : {}}
              disabled={!filterCountry}
              value={filterState}
              onChange={(e: any) => {
                setFilterState(e.target.value);
                setFilterCity("");
              }}
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <AsyncSelect
              name="map_city"
              title="City"
              resource="cities"
              filters={filterState ? { state_id: filterState } : {}}
              disabled={!filterState}
              value={filterCity}
              onChange={(e: any) => setFilterCity(e.target.value)}
            />
          </div>

          <div className="self-end mb-0.5 flex items-center gap-2 shrink-0">
            <ExportMenu
              columns={mapExportColumns}
              data={mapExportData}
              title="Areas Map"
              fileName="areas_map"
              disabled={loading}
            />
            {hasFilter && (
              <button
                type="button"
                onClick={() => { setFilterCountry(""); setFilterState(""); setFilterCity(""); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#475569] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2.5 border-t border-[#f1f5f9]">
          <p className="text-xs font-medium text-[#5c6a7f]">Legend:</p>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
            <span className="w-3 h-3 rounded-full bg-[#eff6ff] shrink-0" />
            Active area
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
            <span className="w-3 h-3 rounded-full bg-[#94a3b8] shrink-0" />
            Inactive area (dashed border)
          </span>
          <p className="text-xs text-[#5c6a7f] ml-auto">
            Click any circle or label to see details
          </p>
        </div>
      </div>

    </div>
  );
}
