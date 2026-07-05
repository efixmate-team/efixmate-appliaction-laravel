"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileSpreadsheet, Plus, Tags } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Select from '@/app/admin/(components)/Forms/Select';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { useClientEnumAndActiveFilter } from "@/app/admin/(lib)/tableFilters";

const DISCOUNT_TYPES = [
  { id: "PERCENTAGE", label: "Percentage (%)", value: "PERCENTAGE" },
  { id: "FIXED", label: "Fixed amount", value: "FIXED" },
];

export default function DiscountsPage() {
  const resource = "discounts";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordid, setToggleRecordId] = useState<any>(null);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const [editForm, setEditForm] = useState({
    discount_title: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    is_active: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource);
      if (res.status && res.data) setData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const discountTypeOptions = useMemo(
    () => DISCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label })),
    []
  );
  const { displayData, tableFilters } = useClientEnumAndActiveFilter(
    data,
    "discount_type",
    discountTypeOptions
  );

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.discount_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.discount_id);
        setOpenDeactivateModal(true);
      }
    } catch (err) {}
  };

  const deactivateRecord = async () => {
    try {
      await masterAPI.updateLookup(resource, toggleRecordid, { is_active: false });
      setOpenDeactivateModal(false);
      fetchData();
    } catch (error) {}
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
      discount_title: row.discount_title ?? "",
      discount_type: row.discount_type ?? "PERCENTAGE",
      discount_value:
        row.discount_value !== undefined && row.discount_value !== null
          ? String(row.discount_value)
          : "",
      is_active: Boolean(row.is_active),
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.discount_id, payload);
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
        cols={2} card title="Add Discounts" subtitle="Create a new entry"
        onSubmit={async (_, values) => {
          const payload = {
            discount_title: values.discount_title,
            discount_type: values.discount_type,
            discount_value: values.discount_value,
            is_active: values.is_active,
          };
          const response = await masterAPI.createLookup(resource, payload);
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
        <Input name="discount_title" title="Name" required />
        <Select name="discount_type" title="Type" options={DISCOUNT_TYPES} required defaultValue="PERCENTAGE" />
        <Input name="discount_value" title="Value" type="number" required />
        <Toggle name="is_active" title="Active" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Entry" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="discount_title" title="Name" required value={editForm.discount_title} onChange={(e) => setEditForm(p => ({...p, discount_title: e.target.value}))} />
          <Select name="discount_type" title="Type" options={DISCOUNT_TYPES} required value={editForm.discount_type} onChange={(e) => setEditForm(p => ({...p, discount_type: e.target.value}))} />
          <Input name="discount_value" title="Value" type="number" required value={editForm.discount_value} onChange={(e) => setEditForm(p => ({...p, discount_value: e.target.value}))} />
          <Toggle name="is_active" title="Active" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Discounts" badge="Finance" subtitle="System records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={()=>{}} searchValue={""}
        showAdd={false} showExport showFilter filters={tableFilters} showRefresh onRefresh={() => fetchData()} rowKey="discount_id"
        headerActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenBulkModal(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Upload via Excel
            </button>
            <button
              type="button"
              onClick={() => setOpenCreateForm(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Name" dataKey="discount_title" sortable />
        <Column
          header="Type"
          dataKey="discount_type"
          sortable
          render={(v: string) =>
            v === "PERCENTAGE" ? "Percentage" : v === "FIXED" ? "Fixed" : (v ?? "-")}
        />
        <Column
          header="Value"
          dataKey="discount_value"
          sortable
          render={(v: any, row: any) =>
            row?.discount_type === "PERCENTAGE"
              ? `${v ?? "-"}%`
              : row?.discount_type === "FIXED"
                ? `₹${v ?? "-"}`
                : (v != null ? String(v) : "-")}
        />
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

      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
         <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <h2 className="text-[16px] font-bold text-center">Deactivate Record?</h2>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="discounts_template.xlsx"
        columns={["discount_title", "discount_type", "discount_value", "is_active"]}
        exampleRow={["New User Discount", "PERCENTAGE", 10, "TRUE"]}
        columnDescription="discount_title, discount_type (PERCENTAGE/FIXED), discount_value, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const errors: string[] = [];
          let success = 0;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 2;
            try {
              const res = await masterAPI.createLookup(resource, {
                discount_title: r.discount_title || "",
                discount_type: r.discount_type || "PERCENTAGE",
                discount_value: r.discount_value,
                is_active: String(r.is_active ?? "TRUE").toUpperCase() !== "FALSE",
              });
              if (res?.status) success++;
              else errors.push(`Row ${rowNum}: ${res?.message || "Failed"}`);
            } catch (err: any) {
              errors.push(`Row ${rowNum}: ${err?.message || "Error"}`);
            }
          }
          if (success > 0) fetchData();
          return { success, failed: errors.length, errors };
        }}
      />
    </div>
  );
}

