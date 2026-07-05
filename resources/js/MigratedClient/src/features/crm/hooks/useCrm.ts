"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type { CrmDashboard, CrmCustomerRow, ActivityEvent } from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useCrmDashboard() {
  const [stats, setStats] = useState<CrmDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.crm.dashboard()) as ApiResult<CrmDashboard>;
    if (res.status && res.data) setStats(res.data);
    else setError(res.message || "Failed to load CRM dashboard");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

export function useCrmCustomers(filters: Record<string, string | undefined>) {
  const [rows, setRows] = useState<CrmCustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = (await adminOperationalAPI.crm.customers(filters)) as ApiResult<{
      rows: CrmCustomerRow[];
      total: number;
    }>;
    if (res.status && res.data) {
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, total, loading, refresh };
}

export function useCustomerTimeline(customerId: number | null) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    const res = (await adminOperationalAPI.crm.timeline(customerId)) as ApiResult<{
      rows: ActivityEvent[];
    }>;
    if (res.status && res.data) setEvents(res.data.rows || []);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

export function useCustomer360(customerId: number | null) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    const res = (await adminOperationalAPI.crm.customer(customerId)) as ApiResult<Record<string, unknown>>;
    if (res.status && res.data) setData(res.data);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
