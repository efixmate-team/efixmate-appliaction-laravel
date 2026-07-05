"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { BookingShell } from "./(components)/BookingShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import {
  BOOKING_PRIORITIES,
  BULK_ACTIONS,
  LIFECYCLE_STATES,
} from "@/src/features/bookings/constants";
import { useBookingWorkflowDashboard } from "@/src/features/bookings/hooks/useBookingWorkflow";
import type { BookingWorkflowRow, PaginatedBookings } from "@/src/features/bookings/types";

function BookingWorkflowContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const { stats, loading: dashLoading, refresh: refreshDash } = useBookingWorkflowDashboard();

  const [rows, setRows] = useState<BookingWorkflowRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [lifecycleState, setLifecycleState] = useState("");
  const [priority, setPriority] = useState("");
  const [isEmergency, setIsEmergency] = useState("");
  const [slaBreached, setSlaBreached] = useState(searchParams.get("slaBreached") === "true" ? "true" : "");
  const [fraudMin, setFraudMin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("auto_assign");

  const handleSelectionChange = useCallback((ids: unknown[]) => {
    setSelected(ids.map((id) => Number(id)));
  }, []);

  const fetchBookings = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      setError(null);
      const res = await adminOperationalAPI.bookings.workflow({
        page: Number(overrides.page ?? page),
        limit: Number(overrides.limit ?? limit),
        search: (overrides.search ?? search) || undefined,
        lifecycleState: (overrides.lifecycleState ?? lifecycleState) || undefined,
        priority: (overrides.priority ?? priority) || undefined,
        isEmergency: (overrides.isEmergency ?? isEmergency) || undefined,
        slaBreached: (overrides.slaBreached ?? slaBreached) || undefined,
        fraudMin: (overrides.fraudMin ?? fraudMin) || undefined,
      });
      if (res.status && res.data) {
        const data = res.data as PaginatedBookings;
        setRows(data.rows || []);
        setTotal(data.total || 0);
      } else {
        setError(res.message || "Failed to load bookings");
      }
      setLoading(false);
    },
    [page, limit, search, lifecycleState, priority, isEmergency, slaBreached, fraudMin]
  );

  useEffect(() => {
    void fetchBookings();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    void fetchBookings({ search: value, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void fetchBookings({ page: p });
  };

  const handleLimitChange = (l: number) => {
    setLimit(l);
    setPage(1);
    void fetchBookings({ limit: l, page: 1 });
  };

  const runBulk = async () => {
    if (!selected.length) {
      toast.error("Select at least one booking");
      return;
    }
    const res = await adminOperationalAPI.bookings.bulk({
      bookingIds: selected,
      action: bulkAction,
    });
    if (res.status) {
      toast.success(`Processed ${selected.length} booking(s)`);
      setSelected([]);
      void fetchBookings();
      refreshDash();
    } else {
      toast.error(res.message || "Bulk action failed");
    }
  };

  return (
    <BookingShell
      title="Booking Workflow"
      description="Timeline, assignment, SLA, escalation, fraud signals, and bulk operations."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refreshDash()}>
          Refresh stats
        </Button>
      }
    >
      {!dashLoading && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">SLA Breached</p>
            <p className="mt-2 text-3xl font-bold text-[#7b5757]">{stats.slaBreached}</p>
          </div>
          <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Emergency</p>
            <p className="mt-2 text-3xl font-bold text-[#fffbeb]">{stats.activeEmergency}</p>
          </div>
          <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Fraud Review</p>
            <p className="mt-2 text-3xl font-bold text-[#f5f3ff]">{stats.fraudReview}</p>
          </div>
          <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5 shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">By Lifecycle</p>
            <div className="space-y-1.5">
              {stats.byLifecycle?.map((s) => (
                <div key={s.lifecycle_state} className="flex items-center justify-between text-xs">
                  <span className="text-[#53697e] truncate pr-2">{s.lifecycle_state}</span>
                  <span className="font-semibold text-[#334155] shrink-0">{s.cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

      <PaginatedTable
        title="Booking queue"
        subtitle={`${total} bookings`}
        data={rows}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        searchValue={search}
        showSearch
        showFilter
        showRefresh
        onRefresh={() => void fetchBookings()}
        onSelectionChange={handleSelectionChange}
        rowKey="booking_id"
        searchPlaceholder="UID, name, mobile…"
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-[#e2e8f0] bg-[#ffffff] px-2 py-1.5 text-sm"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              aria-label="Bulk action"
            >
              {BULK_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={() => void runBulk()} disabled={!selected.length}>
              Bulk ({selected.length})
            </Button>
          </div>
        }
        filters={[
          {
            type: "dropdown",
            label: "Lifecycle",
            value: lifecycleState,
            options: LIFECYCLE_STATES,
            onChange: (v: string) => {
              setLifecycleState(v);
              setPage(1);
              void fetchBookings({ lifecycleState: v, page: 1 });
            },
          },
          {
            type: "dropdown",
            label: "Priority",
            value: priority,
            options: BOOKING_PRIORITIES,
            onChange: (v: string) => {
              setPriority(v);
              setPage(1);
              void fetchBookings({ priority: v, page: 1 });
            },
          },
          {
            type: "dropdown",
            label: "Emergency",
            value: isEmergency,
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Emergency only" },
            ],
            onChange: (v: string) => {
              setIsEmergency(v);
              setPage(1);
              void fetchBookings({ isEmergency: v, page: 1 });
            },
          },
          {
            type: "dropdown",
            label: "SLA",
            value: slaBreached,
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Breached" },
            ],
            onChange: (v: string) => {
              setSlaBreached(v);
              setPage(1);
              void fetchBookings({ slaBreached: v, page: 1 });
            },
          },
          {
            type: "dropdown",
            label: "Fraud score",
            value: fraudMin,
            options: [
              { value: "", label: "Any" },
              { value: "50", label: "≥ 50" },
              { value: "70", label: "≥ 70" },
            ],
            onChange: (v: string) => {
              setFraudMin(v);
              setPage(1);
              void fetchBookings({ fraudMin: v, page: 1 });
            },
          },
        ]}
      >
        <Column
          header="Booking"
          dataKey="booking_uid"
          sortable
          render={(_v, row: BookingWorkflowRow) => (
            <Link
              href={`/admin/booking-management/workflow/${row.booking_id}`}
              className="font-medium text-[#2563eb] hover:underline"
            >
              {row.booking_uid}
            </Link>
          )}
        />
        <Column header="Customer" dataKey="customer_name" sortable />
        <Column header="Service" dataKey="service_name" />
        <Column header="Lifecycle" dataKey="lifecycle_state" />
        <Column
          header="Priority"
          dataKey="priority"
          render={(_v, row: BookingWorkflowRow) =>
            row.is_emergency ? (
              <Badge variant="danger">Emergency</Badge>
            ) : (
              <Badge variant="secondary">{row.priority || "normal"}</Badge>
            )
          }
        />
        <Column
          header="SLA"
          dataKey="sla_breached"
          render={(_v, row: BookingWorkflowRow) =>
            row.sla_breached ? <Badge variant="danger">Breached</Badge> : <Badge variant="success">OK</Badge>
          }
        />
        <Column
          header="Fraud"
          dataKey="fraud_score"
          render={(_v, row: BookingWorkflowRow) => (
            <span className={row.fraud_score >= 50 ? "font-medium text-[#dc2626]" : ""}>{row.fraud_score ?? 0}</span>
          )}
        />
      </PaginatedTable>
    </BookingShell>
  );
}

export default function BookingWorkflowPage() {
  return (
    <Suspense
      fallback={
        <BookingShell title="Booking Workflow">
          <p className="text-sm text-[#53697e]">Loading queue…</p>
        </BookingShell>
      }
    >
      <BookingWorkflowContent />
    </Suspense>
  );
}
