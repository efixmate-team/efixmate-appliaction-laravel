"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Receipt } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import {
  filterBySearch,
  dropdownFilterDescriptor,
  useClientActiveFilter,
  type FilterOption,
} from "@/app/admin/(lib)/tableFilters";
import { masterAPI } from "@/lib/api";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Select from '@/app/admin/(components)/Forms/Select';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";

const INVOICE_STATUS_OPTIONS: FilterOption[] = [
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
];

export default function InvoicesPage() {
  const resource = "invoices";
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    booking_id: "",
    invoice_number: "",
    amount: "",
    status: "UNPAID",
    is_active: true,
  });

  const { displayData: activeFiltered, tableFilters: activeFilters } = useClientActiveFilter(rawData);

  const displayData = useMemo(() => {
    let rows = activeFiltered;
    if (statusFilter) {
      rows = rows.filter((r) => String(r.status ?? "").toUpperCase() === statusFilter);
    }
    return filterBySearch(rows, search, ["booking_uid", "invoice_number"]);
  }, [activeFiltered, statusFilter, search]);

  const tableFilters = useMemo(
    () => [
      ...activeFilters,
      dropdownFilterDescriptor(statusFilter, setStatusFilter, "All Statuses", INVOICE_STATUS_OPTIONS),
    ],
    [activeFilters, statusFilter]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource, { limit: "all" });
      if (res.status && res.data) setRawData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      await masterAPI.updateLookup(resource, row.invoice_id, { is_active: newValue });
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
      booking_id: row.booking_id || "",
      invoice_number: row.invoice_number || "",
      amount: row.amount || "",
      status: row.status || "UNPAID",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.invoice_id, payload);
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
        cols={2} card title="Add Invoice" subtitle="Manage invoices"
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
        <AsyncSelect name="booking_id" title="Booking" resource="bookings" labelKey="booking_uid" required />
        <Input name="invoice_number" title="Invoice Number" required />
        <Input name="amount" title="Amount" required type="number" />
        <Select name="status" title="Status" options={[{value: 'PAID', label: 'Paid'}, {value: 'UNPAID', label: 'Unpaid'}]} required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Invoice" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <AsyncSelect
            name="booking_id" title="Booking" resource="bookings" labelKey="booking_uid" required
            value={editForm.booking_id} onChange={(e: any) => setEditForm(p => ({...p, booking_id: e.target.value}))}
          />
          <Input name="invoice_number" title="Invoice Number" required value={editForm.invoice_number} onChange={(e) => setEditForm(p => ({...p, invoice_number: e.target.value}))} />
          <Input name="amount" title="Amount" required type="number" value={editForm.amount} onChange={(e) => setEditForm(p => ({...p, amount: e.target.value}))} />
          <Select
            name="status" title="Status" options={[{value: 'PAID', label: 'Paid'}, {value: 'UNPAID', label: 'Unpaid'}]} required
            value={editForm.status} onChange={(e) => setEditForm(p => ({...p, status: e.target.value}))}
          />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Invoices" badge="Transactions" subtitle="Invoice records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={setSearch} searchValue={search}
        showSearch showFilter showExport exportFileName="invoices" filters={tableFilters}
        showAdd showRefresh addLabel="Add New" onAdd={() => setOpenCreateForm(true)} onRefresh={() => fetchData()} rowKey="invoice_id"
      >
        <Column header="SL" type="serial" />
        <Column header="Booking UID" dataKey="booking_uid" sortable />
        <Column header="Invoice #" dataKey="invoice_number" sortable />
        <Column header="Amount" dataKey="amount" sortable />
        <Column header="Status" dataKey="status" sortable />
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

