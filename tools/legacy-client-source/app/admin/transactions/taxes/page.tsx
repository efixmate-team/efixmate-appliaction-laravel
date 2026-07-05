"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Percent } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { filterBySearch, useClientActiveFilter } from "@/app/admin/(lib)/tableFilters";
import { masterAPI } from "@/lib/api";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";

export default function TransactionTaxesPage() {
  const resource = "transaction-taxes";
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    transaction_id: "",
    tax_amount: "",
    tax_type: "",
    is_active: true,
  });

  const { displayData: activeFiltered, tableFilters } = useClientActiveFilter(rawData);

  const displayData = useMemo(
    () => filterBySearch(activeFiltered, search, ["transaction_id", "tax_type"]),
    [activeFiltered, search]
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
      await masterAPI.updateLookup(resource, row.tax_log_id, { is_active: newValue });
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
      transaction_id: row.transaction_id || "",
      tax_amount: row.tax_amount || "",
      tax_type: row.tax_type || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.tax_log_id, payload);
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
        cols={2} card title="Add Tax Record" subtitle="Track transaction taxes"
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
        <Input name="transaction_id" title="Transaction ID" required />
        <Input name="tax_amount" title="Amount" required type="number" />
        <Input name="tax_type" title="Type" required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Tax Record" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="transaction_id" title="Transaction ID" required value={editForm.transaction_id} onChange={(e) => setEditForm(p => ({...p, transaction_id: e.target.value}))} />
          <Input name="tax_amount" title="Amount" required type="number" value={editForm.tax_amount} onChange={(e) => setEditForm(p => ({...p, tax_amount: e.target.value}))} />
          <Input name="tax_type" title="Type" required value={editForm.tax_type} onChange={(e) => setEditForm(p => ({...p, tax_type: e.target.value}))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Transaction Taxes" badge="Transactions" subtitle="Tax records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={setSearch} searchValue={search}
        showSearch showFilter showExport exportFileName="transaction_taxes" filters={tableFilters}
        showAdd showRefresh addLabel="Add New" onAdd={() => setOpenCreateForm(true)} onRefresh={() => fetchData()} rowKey="tax_log_id"
      >
        <Column header="SL" type="serial" />
        <Column header="Transaction" dataKey="transaction_id" sortable />
        <Column header="Amount" dataKey="tax_amount" sortable />
        <Column header="Type" dataKey="tax_type" sortable />
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

