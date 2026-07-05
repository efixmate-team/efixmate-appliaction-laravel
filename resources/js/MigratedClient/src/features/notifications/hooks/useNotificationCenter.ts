"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type {
  DashboardStats,
  NotificationChannel,
  NotificationDelivery,
  NotificationSchedule,
  NotificationTemplate,
  PaginatedResult,
} from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useNotificationDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.notifications.dashboard()) as ApiResult<DashboardStats>;
    if (res.status && res.data) setStats(res.data);
    else setError(res.message || "Failed to load dashboard");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

export function usePaginatedTemplates(filters: {
  page: number;
  limit: number;
  channel?: string;
  search?: string;
}) {
  const [data, setData] = useState<PaginatedResult<NotificationTemplate> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.notifications.templates(filters)) as ApiResult<
      PaginatedResult<NotificationTemplate>
    >;
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load templates");
    setLoading(false);
  }, [filters.page, filters.limit, filters.channel, filters.search]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function usePaginatedDelivery(
  filters: {
    page: number;
    limit: number;
    channel?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  enabled = true
) {
  const [data, setData] = useState<PaginatedResult<NotificationDelivery> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.channel) params.channel = filters.channel;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.dateFrom) params.dateFrom = new Date(filters.dateFrom).toISOString();
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      params.dateTo = end.toISOString();
    }
    const res = (await adminOperationalAPI.notifications.delivery(params)) as ApiResult<
      PaginatedResult<NotificationDelivery>
    >;
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load delivery history");
    setLoading(false);
  }, [
    enabled,
    filters.page,
    filters.limit,
    filters.channel,
    filters.status,
    filters.search,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function usePaginatedSchedules(filters: { page: number; limit: number; status?: string; channel?: string }) {
  const [data, setData] = useState<PaginatedResult<NotificationSchedule> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.notifications.schedules(filters)) as ApiResult<
      PaginatedResult<NotificationSchedule>
    >;
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load schedules");
    setLoading(false);
  }, [filters.page, filters.limit, filters.status, filters.channel]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function useNotificationMeta() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);

  useEffect(() => {
    void (async () => {
      const res = (await adminOperationalAPI.notifications.meta()) as ApiResult<{
        channels: NotificationChannel[];
      }>;
      if (res.status && res.data?.channels) setChannels(res.data.channels);
    })();
  }, []);

  return { channels };
}
