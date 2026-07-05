"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { masterAPI } from "@/lib/api";

export type FilterOption = { value: string; label: string };

export type ClientFilterRule<T extends Record<string, unknown>> = {
  key: keyof T | string;
  value: unknown;
  /** When true, skip rows where value is falsy unless rule.value is explicitly set */
  activeOnly?: boolean;
  match?: (row: T, value: unknown) => boolean;
};

export function applyClientFilters<T extends Record<string, unknown>>(
  rows: T[],
  rules: ClientFilterRule<T>[]
): T[] {
  return rows.filter((row) =>
    rules.every((rule) => {
      const v = rule.value;
      if (rule.activeOnly && !v) return true;
      if (v === "" || v === null || v === undefined) return true;
      if (rule.match) return rule.match(row, v);
      const raw = row[rule.key as keyof T];
      if (typeof v === "boolean") return Boolean(raw) === v;
      return String(raw ?? "") === String(v);
    })
  );
}

export function filterBySearch<T extends Record<string, unknown>>(
  rows: T[],
  search: string,
  keys: (keyof T | string)[]
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    keys.some((k) => String(row[k as keyof T] ?? "").toLowerCase().includes(q))
  );
}

export function activeOnlyToggleFilter(value: boolean, onChange: (v: boolean) => void) {
  return {
    type: "toggle" as const,
    label: "Active only",
    value,
    onChange,
  };
}

export function dropdownFilterDescriptor(
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  options: FilterOption[]
) {
  return {
    type: "dropdown" as const,
    value,
    onChange,
    placeholder,
    options,
  };
}

export function useFilterState<T extends Record<string, unknown>>(initial: T) {
  const [filterState, setFilterState] = useState<T>(initial);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState(initial);
  }, [initial]);

  return { filterState, setFilterState, setFilter, resetFilters };
}

type GeoOptions = {
  countries: FilterOption[];
  states: FilterOption[];
  cities: FilterOption[];
  areas: FilterOption[];
  loading: boolean;
};

export function useGeographyFilterOptions(
  countryId: string,
  stateId: string,
  cityId: string
): GeoOptions {
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [states, setStates] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [areas, setAreas] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await masterAPI.getCountries({ limit: "all" });
        if (mounted && res?.status && res.data) {
          setCountries(
            res.data.map((c: { country_id: number; country_name: string }) => ({
              value: String(c.country_id),
              label: c.country_name,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!countryId) {
      setStates([]);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await masterAPI.getStates({ country_id: countryId, limit: "all" });
        if (mounted && res?.status && res.data) {
          setStates(
            res.data.map((s: { state_id: number; state_name: string }) => ({
              value: String(s.state_id),
              label: s.state_name,
            }))
          );
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [countryId]);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await masterAPI.getCities({ state_id: stateId, limit: "all" });
        if (mounted && res?.status && res.data) {
          setCities(
            res.data.map((c: { city_id: number; city_name: string }) => ({
              value: String(c.city_id),
              label: c.city_name,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, [stateId]);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await masterAPI.getAreas({ city_id: cityId, limit: "all" });
        if (mounted && res?.status && res.data) {
          setAreas(
            res.data.map((a: { area_id: number; area_name: string }) => ({
              value: String(a.area_id),
              label: a.area_name,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, [cityId]);

  return useMemo(
    () => ({ countries, states, cities, areas, loading }),
    [countries, states, cities, areas, loading]
  );
}

/** Parse document-types applies_to for client filter */
/** Client-side active + enum field filter (finance / typed lookups) */
export function useClientEnumAndActiveFilter<T extends Record<string, unknown>>(
  rawData: T[],
  enumKey: keyof T,
  enumOptions: FilterOption[]
) {
  const [activeOnly, setActiveOnly] = useState(false);
  const [enumFilter, setEnumFilter] = useState("");
  const displayData = useMemo(() => {
    let rows = rawData;
    if (activeOnly) rows = rows.filter((r) => Boolean(r.is_active));
    if (enumFilter) rows = rows.filter((r) => String(r[enumKey] ?? "") === enumFilter);
    return rows;
  }, [rawData, activeOnly, enumFilter, enumKey]);
  const tableFilters = useMemo(
    () => [
      activeOnlyToggleFilter(activeOnly, setActiveOnly),
      dropdownFilterDescriptor(enumFilter, setEnumFilter, "All Types", enumOptions),
    ],
    [activeOnly, enumFilter, enumOptions]
  );
  return { displayData, tableFilters };
}

/** Client-side active-only filter for small lookup lists */
export function useClientActiveFilter<T extends { is_active?: boolean }>(rawData: T[]) {
  const [activeOnly, setActiveOnly] = useState(false);
  const displayData = useMemo(
    () => (activeOnly ? rawData.filter((r) => r.is_active) : rawData),
    [rawData, activeOnly]
  );
  const tableFilters = useMemo(
    () => [activeOnlyToggleFilter(activeOnly, setActiveOnly)],
    [activeOnly]
  );
  return { displayData, activeOnly, setActiveOnly, tableFilters };
}

export function rowMatchesAppliesTo(rowValue: unknown, filter: string): boolean {
  if (!filter) return true;
  const raw = rowValue;
  let values: string[] = [];
  if (Array.isArray(raw)) values = raw.map(String);
  else if (typeof raw === "string") {
    const t = raw.trim();
    if (t.startsWith("[")) {
      try {
        const p = JSON.parse(t);
        values = Array.isArray(p) ? p.map(String) : [];
      } catch {
        values = t.split(",").map((s) => s.trim());
      }
    } else {
      values = t.split(",").map((s) => s.trim());
    }
  }
  return values.includes(filter);
}
