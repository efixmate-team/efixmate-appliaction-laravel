"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type { FinanceDashboard, ReportListResponse, RevenueSeriesPoint } from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useFinanceDashboard(filters: { from?: string; to?: string }) {
  const [stats, setStats] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.finance.dashboard(filters)) as ApiResult<FinanceDashboard>;
    if (res.status && res.data) setStats(res.data);
    else setError(res.message || "Failed to load dashboard");
    setLoading(false);
  }, [filters.from, filters.to]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

export function useRevenueSeries(filters: { from?: string; to?: string; groupBy?: string }) {
  const [series, setSeries] = useState<RevenueSeriesPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = (await adminOperationalAPI.finance.revenue(filters)) as ApiResult<{
      gateway: RevenueSeriesPoint[];
    }>;
    if (res.status && res.data) setSeries(res.data.gateway || []);
    setLoading(false);
  }, [filters.from, filters.to, filters.groupBy]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { series, loading, refresh };
}

export function useFinanceReport<T = Record<string, unknown>>(
  fetcher: (params: Record<string, string | undefined>) => Promise<ApiResult<ReportListResponse<T>>>,
  filters: Record<string, string | undefined>
) {
  const [data, setData] = useState<ReportListResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetcher(filters);
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load report");
    setLoading(false);
  }, [fetcher, JSON.stringify(filters)]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
