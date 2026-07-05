"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CreditCard } from "lucide-react";
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
import Select from '@/app/admin/(components)/Forms/Select';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";

const PAYMENT_TYPE_OPTIONS: FilterOption[] = [
  { value: "ONLINE", label: "Online" },
  { value: "CASH", label: "Cash" },
];

export default function PaymentsPage() {
  const resource = "payments";
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusOptions, setStatusOptions] = useState<FilterOption[]>([]);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    customer_id: "",
    booking_id: "",
    amount: "",
    payment_type: "",
    payment_status_id: "",
    is_active: true,
  });

  const { displayData: activeFiltered, tableFilters: activeFilters } = useClientActiveFilter(rawData);

  const displayData = useMemo(() => {
    let rows = activeFiltered;
    if (statusFilter) {
      rows = rows.filter((r) => String(r.payment_status_id ?? "") === statusFilter);
    }
    if (typeFilter) {
      rows = rows.filter(
        (r) => String(r.payment_type ?? "").toUpperCase() === typeFilter
      );
    }
    return filterBySearch(rows, search, ["booking_uid", "first_name", "last_name"]);
  }, [activeFiltered, statusFilter, typeFilter, search]);

  const tableFilters = useMemo(
    () => [
      ...activeFilters,
      dropdownFilterDescriptor(statusFilter, setStatusFilter, "All Statuses", statusOptions),
      dropdownFilterDescriptor(typeFilter, setTypeFilter, "All Modes", PAYMENT_TYPE_OPTIONS),
    ],
    [activeFilters, statusFilter, typeFilter, statusOptions]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource, { limit: "all" });
      if (res.status && res.data) setRawData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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
      await masterAPI.updateLookup(resource, row.order_id, { is_active: newValue });
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
      customer_id: row.customer_id || "",
      booking_id: row.booking_id || "",
      amount: row.amount || "",
      payment_type: row.payment_type || "",
      payment_status_id: row.payment_status_id || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.order_id, payload);
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
        cols={2} card title="Add Payment" subtitle="Track a new payment"
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
        <AsyncSelect name="customer_id" title="Customer" resource="users" labelKey="first_name" required />
        <AsyncSelect name="booking_id" title="Booking" resource="bookings" labelKey="booking_uid" required />
        <Input name="amount" title="Amount" required type="number" />
        <Select name="payment_type" title="Payment Mode" options={[{value: 'ONLINE', label: 'Online'}, {value: 'CASH', label: 'Cash'}]} required />
        <AsyncSelect name="payment_status_id" title="Status" resource="statuses" filters={{ status_type_id: 1 }} required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Payment" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <AsyncSelect
            name="customer_id" title="Customer" resource="users" labelKey="first_name" required
            value={editForm.customer_id} onChange={(e: any) => setEditForm(p => ({...p, customer_id: e.target.value}))}
          />
          <AsyncSelect
            name="booking_id" title="Booking" resource="bookings" labelKey="booking_uid" required
            value={editForm.booking_id} onChange={(e: any) => setEditForm(p => ({...p, booking_id: e.target.value}))}
          />
          <Input name="amount" title="Amount" required type="number" value={editForm.amount} onChange={(e) => setEditForm(p => ({...p, amount: e.target.value}))} />
          <Select
            name="payment_type" title="Payment Mode" options={[{value: 'ONLINE', label: 'Online'}, {value: 'CASH', label: 'Cash'}]} required
            value={editForm.payment_type} onChange={(e) => setEditForm(p => ({...p, payment_type: e.target.value}))}
          />
          <AsyncSelect
            name="payment_status_id" title="Status" resource="statuses" filters={{ status_type_id: 1 }} required
            value={editForm.payment_status_id} onChange={(e: any) => setEditForm(p => ({...p, payment_status_id: e.target.value}))}
          />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Payments" badge="Transactions" subtitle="Payment records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={setSearch} searchValue={search}
        showSearch showFilter showExport exportFileName="payments" filters={tableFilters}
        showAdd showRefresh addLabel="Add New" onAdd={() => setOpenCreateForm(true)} onRefresh={() => fetchData()} rowKey="order_id"
      >
        <Column header="SL" type="serial" />
        <Column header="Booking UID" dataKey="booking_uid" sortable />
        <Column
          header="Customer"
          render={(_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'N/A'}
        />
        <Column header="Amount" dataKey="amount" sortable />
        <Column header="Mode" dataKey="payment_type" sortable />
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

