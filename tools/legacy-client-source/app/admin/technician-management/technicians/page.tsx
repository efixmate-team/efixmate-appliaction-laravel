"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserCheck } from "lucide-react";
import PaginatedTable, { Column, AvatarCell } from "@/app/admin/(components)/Table";
import { buildToggleOnlyRowActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { technicianAdminAPI } from "@/lib/api";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import Toggle from "@/app/admin/(components)/Forms/Toggle";

export default function TechniciansPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState("");

  // â"€â"€ Overlays â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const fetchTechnicians = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const appStatus = overrides.applicationStatus ?? applicationStatus;
      const res = await technicianAdminAPI.getTechnicians({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        isActive: overrides.isActive !== undefined ? overrides.isActive : activeOnly,
        ...(appStatus ? { applicationStatus: appStatus } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination.total);
        setPage(res.pagination.page);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeOnly, applicationStatus]);

  const APPLICATION_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => { fetchTechnicians({ isActive: activeOnly }); }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchTechnicians({ search: value, page: 1 });
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTechnicians({ page: p });
  };
  const handleLimitChange = (l: number) => {
    setLimit(l);
    fetchTechnicians({ limit: l, page: 1 });
  };
  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    setPage(1);
    fetchTechnicians({ isActive: value, page: 1 });
  };

  const handleApplicationStatus = (value: string) => {
    setApplicationStatus(value);
    setPage(1);
    fetchTechnicians({ applicationStatus: value, page: 1 });
  };
  
  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      await technicianAdminAPI.approveTechnician({
        technicianId: row.technician_id,
        isActive: newValue
      });
      fetchTechnicians();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => technicianAdminAPI.approveTechnician({ technicianId: id, isActive: data.is_active }) as any,
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => { setSuccessOverlay(false); fetchTechnicians(); }, 1500);
      },
      onError: () => {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      },
    }
  );

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Status updated." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to process." onFinish={() => setFailedOverlay(false)} />

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={true}
        title="Technicians"
        badge="Professionals"
        subtitle={`${total} technicians found`}
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
        exportFileName="technicians"
        showRefresh
        onRefresh={() => fetchTechnicians()}
        rowKey="technician_id"
        filters={[
          {
            type: "dropdown",
            placeholder: "All Application Status",
            value: applicationStatus,
            onChange: handleApplicationStatus,
            options: APPLICATION_STATUS_OPTIONS,
          },
          {
            type: "toggle",
            label: "Active only",
            value: activeOnly,
            onChange: handleActiveOnly,
          },
        ]}
      >
        <Column header="SL" type="serial" />
        <Column header="Code" dataKey="technician_unique_id" render={(v: any) => v ?? "-"} />
        <Column
          header="Technician"
          dataKey="first_name"
          render={(_v: unknown, row: any) => (
            <button
              type="button"
              onClick={() => router.push(`/admin/technician-management/technicians/${row.technician_id}`)}
              className="text-left cursor-pointer"
            >
              <AvatarCell
                value={`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}
                row={{ ...row, avatar: row.selfie_photo }}
              />
            </button>
          )}
        />
        <Column header="Mobile" dataKey="mobile_number" />
        <Column header="Email" dataKey="email" />
        <Column header="City" dataKey="city" />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="View"
          dataKey="_view"
          align="center"
          render={(_: unknown, row: any) => (
            <button
              onClick={() => router.push(`/admin/technician-management/technicians/${row.technician_id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Eye size={13} /> View
            </button>
          )}
        />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={buildToggleOnlyRowActions({
            onActivateRow: (row) => { void handleToggle(true, row); },
            onDeactivateRow: (row) => { void handleToggle(false, row); },
            onBulkActivate: handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
          })}
        />
      </PaginatedTable>
    </div>
  );
}

