"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type {
  BookingDetail,
  BookingTag,
  BookingWorkflowDashboard,
  PaginatedBookings,
} from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useBookingWorkflowDashboard() {
  const [stats, setStats] = useState<BookingWorkflowDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.bookings.workflowDashboard()) as ApiResult<BookingWorkflowDashboard>;
    if (res.status && res.data) setStats(res.data);
    else setError(res.message || "Failed to load dashboard");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

export function usePaginatedBookingsWorkflow(filters: {
  page: number;
  limit: number;
  search?: string;
  lifecycleState?: string;
  priority?: string;
  isEmergency?: string;
  slaBreached?: string;
  fraudMin?: string;
  dateFrom?: string;
  dateTo?: string;
  tagId?: string;
}) {
  const [data, setData] = useState<PaginatedBookings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.bookings.workflow(filters)) as ApiResult<PaginatedBookings>;
    if (res.status && res.data) setData(res.data);
    else setError(res.message || "Failed to load bookings");
    setLoading(false);
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.lifecycleState,
    filters.priority,
    filters.isEmergency,
    filters.slaBreached,
    filters.fraudMin,
    filters.dateFrom,
    filters.dateTo,
    filters.tagId,
  ]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function useBookingDetail(bookingId: number, enabled = true) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !bookingId) return;
    setLoading(true);
    setError(null);
    const res = (await adminOperationalAPI.bookings.detail(bookingId)) as ApiResult<BookingDetail>;
    if (res.status && res.data) setDetail(res.data);
    else setError(res.message || "Failed to load booking");
    setLoading(false);
  }, [bookingId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh };
}

export function useBookingTagsCatalog() {
  const [tags, setTags] = useState<BookingTag[]>([]);

  useEffect(() => {
    void (async () => {
      const res = (await adminOperationalAPI.bookings.tagsCatalog()) as ApiResult<BookingTag[]>;
      if (res.status && res.data) setTags(res.data);
    })();
  }, []);

  return tags;
}
