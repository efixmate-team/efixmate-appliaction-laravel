"use client";

import { useState, useEffect, useCallback } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import {
  activeOnlyToggleFilter,
  dropdownFilterDescriptor,
  type FilterOption,
} from "@/app/admin/(lib)/tableFilters";
import { masterAPI } from "@/lib/api";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";

const REFERRAL_STATUS_OPTIONS: FilterOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "REWARDED", label: "Rewarded" },
  { value: "REJECTED", label: "Rejected" },
];

export default function ReferralsPage() {
  const resource = "referrals";
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async (overrides: Record<string, unknown> = {}) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const params: Record<string, string | number | boolean> = {
        page: (overrides.page as number) ?? page,
        limit: (overrides.limit as number) ?? limit,
      };
      const q = (overrides.search as string) ?? search;
      if (q) params.search = q;
      const st = (overrides.status as string) ?? statusFilter;
      if (st) params.status = st;
      const onlyActive = overrides.activeOnly !== undefined ? overrides.activeOnly : activeOnly;
      if (onlyActive) params.is_active = true;

      const res = await masterAPI.getLookups(resource, params);
      if (res.status && Array.isArray(res.data)) {
        setData(res.data);
        setTotal(res.pagination?.total ?? res.data.length);
      } else {
        setData([]);
        setErrorMessage(res.message || "Could not load referrals.");
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 4000);
      }
    } catch (err: unknown) {
      setData([]);
      setErrorMessage(err instanceof Error ? err.message : "Could not load referrals.");
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 4000);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, activeOnly]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    void fetchData({ search: value, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void fetchData({ page: p });
  };

  const handleLimitChange = (l: number) => {
    setLimit(l);
    setPage(1);
    void fetchData({ limit: l, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    void fetchData({ status: value, page: 1 });
  };

  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    setPage(1);
    void fetchData({ activeOnly: value, page: 1 });
  };

  const tableFilters = [
    activeOnlyToggleFilter(activeOnly, handleActiveOnly),
    dropdownFilterDescriptor(statusFilter, handleStatusFilter, "All Statuses", REFERRAL_STATUS_OPTIONS),
  ];

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay
        show={failedOverlay}
        title="Failed"
        subtitle={errorMessage || "Unable to load data."}
        onFinish={() => setFailedOverlay(false)}
      />

      <PaginatedTable
        showMe={true}
        title="Referrals"
        badge="Technician Management"
        subtitle={errorMessage ? errorMessage : `${total} referral records`}
        data={data}
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
        showExport
        exportFileName="referrals"
        filters={tableFilters}
        showRefresh
        onRefresh={() => void fetchData()}
        rowKey="referral_id"
        enableSelection={false}
      >
        <Column header="SL" type="serial" />
        <Column header="Referrer" dataKey="referrer_name" sortable />
        <Column header="Referred" dataKey="referred_name" sortable />
        <Column header="Status" dataKey="status" sortable />
      </PaginatedTable>
    </div>
  );
}

