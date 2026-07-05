"use client";

import { useEffect, useState } from "react";
import { Globe, MapPin, ChevronRight } from "lucide-react";
import Select from "@/app/admin/(components)/Forms/Select";
import MultiSelect from "@/app/admin/(components)/Forms/MultiSelect";
import { masterAPI } from "@/lib/api";

type ScopeType = "GLOBAL" | "COUNTRY" | "STATE" | "CITY" | "AREA" | string;

interface Option {
  id: string;
  label: string;
}

interface Props {
  scopeType: ScopeType;
  scopeIds: string[];
  onChange: (ids: string[]) => void;
}

const toMulti = (opts: Option[]) => opts.map((o) => ({ key: o.id, value: o.label }));

const SCOPE_LABELS: Record<string, string> = {
  COUNTRY: "Countries",
  STATE:   "States",
  CITY:    "Cities",
  AREA:    "Areas",
};

export default function ScopeSelector({ scopeType, scopeIds, onChange }: Props) {
  const [countries, setCountries] = useState<Option[]>([]);
  const [states,    setStates]    = useState<Option[]>([]);
  const [cities,    setCities]    = useState<Option[]>([]);
  const [areas,     setAreas]     = useState<Option[]>([]);

  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter,   setStateFilter]   = useState("");
  const [cityFilter,    setCityFilter]    = useState("");

  useEffect(() => {
    if (scopeType === "GLOBAL" || !scopeType) return;
    let mounted = true;
    masterAPI.getCountries({ limit: "all" }).then((res: any) => {
      if (!mounted) return;
      if (res?.status && Array.isArray(res.data))
        setCountries(res.data.map((c: any) => ({ id: String(c.country_id), label: c.country_name || `Country ${c.country_id}` })));
    });
    return () => { mounted = false; };
  }, [scopeType]);

  useEffect(() => {
    if (!["STATE", "CITY", "AREA"].includes(String(scopeType))) { setStates([]); return; }
    let mounted = true;
    const params: any = { limit: "all" };
    if (countryFilter) params.country_id = countryFilter;
    masterAPI.getStates(params).then((res: any) => {
      if (!mounted) return;
      if (res?.status && Array.isArray(res.data))
        setStates(res.data.map((s: any) => ({ id: String(s.state_id), label: s.state_name || `State ${s.state_id}` })));
    });
    return () => { mounted = false; };
  }, [scopeType, countryFilter]);

  useEffect(() => {
    if (!["CITY", "AREA"].includes(String(scopeType))) { setCities([]); return; }
    let mounted = true;
    const params: any = { limit: "all" };
    if (stateFilter) params.state_id = stateFilter;
    masterAPI.getCities(params).then((res: any) => {
      if (!mounted) return;
      if (res?.status && Array.isArray(res.data))
        setCities(res.data.map((c: any) => ({ id: String(c.city_id), label: c.city_name || `City ${c.city_id}` })));
    });
    return () => { mounted = false; };
  }, [scopeType, stateFilter]);

  useEffect(() => {
    if (scopeType !== "AREA") { setAreas([]); return; }
    let mounted = true;
    const params: any = { limit: "all" };
    if (cityFilter) params.city_id = cityFilter;
    masterAPI.getAreas(params).then((res: any) => {
      if (!mounted) return;
      if (res?.status && Array.isArray(res.data))
        setAreas(res.data.map((a: any) => ({ id: String(a.area_id), label: a.area_name || `Area ${a.area_id}` })));
    });
    return () => { mounted = false; };
  }, [scopeType, cityFilter]);

  /* ── Global scope ── */
  if (!scopeType || scopeType === "GLOBAL") {
    return (
      <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-dashed border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
          <Globe size={15} className="text-[#2563eb]" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#1d4ed8]">Global scope</p>
          <p className="text-[11px] text-[#3b82f6] leading-snug">
            Applies to all regions — no specific location needed.
          </p>
        </div>
      </div>
    );
  }

  const showCountryFilter = ["STATE", "CITY", "AREA"].includes(String(scopeType));
  const showStateFilter   = ["CITY", "AREA"].includes(String(scopeType));
  const showCityFilter    = scopeType === "AREA";

  const filterCount = [showCountryFilter, showStateFilter, showCityFilter].filter(Boolean).length;
  const targetLabel = SCOPE_LABELS[scopeType] ?? scopeType;

  /* active options for the main multi-select */
  const activeOptions =
    scopeType === "COUNTRY" ? toMulti(countries) :
    scopeType === "STATE"   ? toMulti(states) :
    scopeType === "CITY"    ? toMulti(cities) :
    scopeType === "AREA"    ? toMulti(areas)  : [];

  return (
    <div className="md:col-span-2 rounded-xl border border-[#e2e8f0] bg-[#ffffff] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[#f1f5f9] bg-[#f8fafc] px-4 py-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#dbeafe]">
          <MapPin size={12} className="text-[#2563eb]" />
        </div>
        <p className="text-[11.5px] font-semibold text-[#374151]">
          Select {targetLabel}
        </p>
        {scopeIds.length > 0 && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2563eb] px-1.5 text-[10px] font-bold text-white">
            {scopeIds.length}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Narrow-down filters (breadcrumb style) */}
        {filterCount > 0 && (
          <div>
            <p className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-[#5c6a7f]">
              Narrow down (optional)
            </p>
            <div className="flex flex-wrap items-end gap-2">
              {showCountryFilter && (
                <>
                  <div className="flex-1 min-w-[140px]">
                    <Select
                      title="Country"
                      value={countryFilter}
                      onChange={(e: any) => {
                        setCountryFilter(e.target.value);
                        setStateFilter("");
                        setCityFilter("");
                      }}
                      options={[{ id: "", label: "All countries" }, ...countries]}
                    />
                  </div>
                  {showStateFilter && (
                    <ChevronRight size={14} className="text-[#cbd5e1] mb-2 shrink-0" />
                  )}
                </>
              )}
              {showStateFilter && (
                <>
                  <div className="flex-1 min-w-[140px]">
                    <Select
                      title="State"
                      value={stateFilter}
                      onChange={(e: any) => {
                        setStateFilter(e.target.value);
                        setCityFilter("");
                      }}
                      options={[{ id: "", label: "All states" }, ...states]}
                    />
                  </div>
                  {showCityFilter && (
                    <ChevronRight size={14} className="text-[#cbd5e1] mb-2 shrink-0" />
                  )}
                </>
              )}
              {showCityFilter && (
                <div className="flex-1 min-w-[140px]">
                  <Select
                    title="City"
                    value={cityFilter}
                    onChange={(e: any) => setCityFilter(e.target.value)}
                    options={[{ id: "", label: "All cities" }, ...cities]}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main multi-select */}
        <div>
          <MultiSelect
            title={`Select ${targetLabel}`}
            placeholder={`Pick one or more ${targetLabel.toLowerCase()}…`}
            value={scopeIds}
            options={activeOptions}
            onChange={onChange}
          />
        </div>

      </div>
    </div>
  );
}
