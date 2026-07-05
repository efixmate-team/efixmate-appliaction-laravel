"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type { PaginatedTickets, TicketDetail } from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useSupportDashboard() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.support.dashboard()) as ApiResult<Record<string, unknown>>;
    if (res.status && res.data) setStats(res.data);
    else setError(res.message || "Failed to load dashboard");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

export function usePaginatedTickets(filters: {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  source?: string;
  categoryId?: string;
  search?: string;
  slaBreached?: string;
}) {
  const [data, setData] = useState<PaginatedTickets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.support.tickets(filters)) as ApiResult<PaginatedTickets>;
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load tickets");
    setLoading(false);
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.priority,
    filters.source,
    filters.categoryId,
    filters.search,
    filters.slaBreached,
  ]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function useTicketDetail(ticketId: number, ticketSource: string, enabled = true) {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled || !ticketId) return;
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.support.ticket(ticketId, { ticketSource })) as ApiResult<TicketDetail>;
    if (res.status && res.data) setDetail(res.data);
    else setError(res.message || "Failed to load ticket");
    setLoading(false);
  }, [ticketId, ticketSource, enabled]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { detail, loading, error, refresh: fetch };
}
