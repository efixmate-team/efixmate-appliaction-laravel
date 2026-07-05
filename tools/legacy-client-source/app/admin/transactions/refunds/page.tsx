"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import {
  filterBySearch,
  dropdownFilterDescriptor,
  useClientActiveFilter,
  type FilterOption,
} from "@/app/admin/(lib)/tableFilters";
import { lookupAPI, masterAPI } from "@/lib/api";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";

export default function RefundsPage() {
  const resource = "refunds";
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusOptions, setStatusOptions] = useState<FilterOption[]>([]);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    payment_id: "",
    amount: "",
    reason: "",
    refund_status_id: "",
    is_active: true,
  });

  const { displayData: activeFiltered, tableFilters: activeFilters } = useClientActiveFilter(rawData);

  const displayData = useMemo(() => {
    let rows = activeFiltered;
    if (statusFilter) {
      rows = rows.filter((r) => String(r.refund_status_id ?? "") === statusFilter);
    }
    return filterBySearch(rows, search, ["gateway_order_id", "reason"]);
  }, [activeFiltered, statusFilter, search]);

  const tableFilters = useMemo(
    () => [
      ...activeFilters,
      dropdownFilterDescriptor(statusFilter, setStatusFilter, "All Statuses", statusOptions),
    ],
    [activeFilters, statusFilter, statusOptions]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource, { limit: "all" });
      if (res.status && res.data) setRawData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await lookupAPI.getStatuses({ status_type_id: 1, limit: "all" });
        if (mounted && res?.status && res.data) {
          setStatusOptions(
            res.data.map((s: { status_id: number; status: string }) => ({
              value: String(s.status_id),
              label: s.status,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      await masterAPI.updateLookup(resource, row.refund_id, { is_active: newValue });
      fetchData();
    } catch (err) {}
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => masterAPI.updateLookup(resource, id, data),
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
      },
      onError: () => {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      },
    }
  );

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      payment_id: row.payment_id || "",
      amount: row.amount || "",
      reason: row.reason || "",
      refund_status_id: row.refund_status_id || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.refund_id, payload);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
           setSuccessOverlay(false); setOpenEditForm(false); setEditRow(null); fetchData();
        }, 2000);
      } else {
        setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err) { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); }
    finally { setEditLoading(false); }
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to save changes." onFinish={() => setFailedOverlay(false)} />

      <Form
        showMe={openCreateForm}
        cols={2} card title="Add Refund" subtitle="Manage refunds"
        onSubmit={async (formData, values) => {
          const response = await masterAPI.createLookup(resource, values);
          if (response && response.status) {
            setSuccessOverlay(true);
            setTimeout(() => { setSuccessOverlay(false); setOpenCreateForm(false); fetchData(); }, 2000);
          } else {
            setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
          }
        }}
        onReset={() => setOpenCreateForm(false)}
        submitLabel="Create" showReset loading={false}
      >
        <AsyncSelect name="payment_id" title="Payment Order" resource="payments" labelKey="gateway_order_id" required />
        <Input name="amount" title="Amount" required type="number" />
        <Input name="reason" title="Reason" required />
        <AsyncSelect name="refund_status_id" title="Status" resource="statuses" filters={{ status_type_id: 1 }} required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Refund" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <AsyncSelect
            name="payment_id" title="Payment Order" resource="payments" labelKey="gateway_order_id" required
            value={editForm.payment_id} onChange={(e: any) => setEditForm(p => ({...p, payment_id: e.target.value}))}
          />
          <Input name="amount" title="Amount" required type="number" value={editForm.amount} onChange={(e) => setEditForm(p => ({...p, amount: e.target.value}))} />
          <Input name="reason" title="Reason" required value={editForm.reason} onChange={(e) => setEditForm(p => ({...p, reason: e.target.value}))} />
          <AsyncSelect
            name="refund_status_id" title="Status" resource="statuses" filters={{ status_type_id: 1 }} required
            value={editForm.refund_status_id} onChange={(e: any) => setEditForm(p => ({...p, refund_status_id: e.target.value}))}
          />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Refunds" badge="Transactions" subtitle="Refund records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={setSearch} searchValue={search}
        showSearch showFilter showExport exportFileName="refunds" filters={tableFilters}
        showAdd showRefresh addLabel="Add New" onAdd={() => setOpenCreateForm(true)} onRefresh={() => fetchData()} rowKey="refund_id"
      >
        <Column header="SL" type="serial" />
        <Column header="Gateway Order" dataKey="gateway_order_id" sortable />
        <Column header="Amount" dataKey="amount" sortable />
        <Column header="Reason" dataKey="reason" sortable />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={buildBulkCrudActions({
            onEdit: handleEdit,
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

