"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileSpreadsheet, Plus, DollarSign } from "lucide-react";
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

// efm_mstr_commissions was dropped in migration 48; now backed by efm_mstr_commission_rules.
// Column mapping: title â†' rule_name, commission_type â†' commission_mode, id â†' rule_id

const COMMISSION_TYPES = [
  { id: "PERCENTAGE", label: "Percentage (%)", value: "PERCENTAGE" },
  { id: "FIXED", label: "Fixed amount", value: "FIXED" },
];

export default function CommissionsPage() {
  const resource = "commissions";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
    rule_name: "",
    commission_mode: "PERCENTAGE",
    commission_value: "",
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

  const commissionTypeOptions = useMemo(
    () => COMMISSION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    []
  );
  const { displayData, tableFilters } = useClientEnumAndActiveFilter(
    data,
    "commission_mode",
    commissionTypeOptions
  );
  const pagedData = displayData.slice((page - 1) * limit, page * limit);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.rule_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.rule_id);
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
      rule_name: row.rule_name ?? "",
      commission_mode: row.commission_mode ?? "PERCENTAGE",
      commission_value:
        row.commission_value !== undefined && row.commission_value !== null
          ? String(row.commission_value)
          : "",
      is_active: Boolean(row.is_active),
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.rule_id, payload);
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
        cols={2} card title="Add Commissions" subtitle="Create a new entry"
        onSubmit={async (_, values) => {
          const payload = {
            rule_name: values.rule_name,
            commission_mode: values.commission_mode,
            commission_value: values.commission_value,
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
        <Input name="rule_name" title="Name" required />
        <Select name="commission_mode" title="Type" options={COMMISSION_TYPES} required defaultValue="PERCENTAGE" />
        <Input name="commission_value" title="Value" type="number" required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Entry" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="rule_name" title="Name" required value={editForm.rule_name} onChange={(e) => setEditForm(p => ({...p, rule_name: e.target.value}))} />
          <Select name="commission_mode" title="Type" options={COMMISSION_TYPES} required value={editForm.commission_mode} onChange={(e) => setEditForm(p => ({...p, commission_mode: e.target.value}))} />
          <Input name="commission_value" title="Value" type="number" required value={editForm.commission_value} onChange={(e) => setEditForm(p => ({...p, commission_value: e.target.value}))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Commissions" badge="Finance" subtitle="System records"
        data={pagedData} total={displayData.length} loading={loading} page={page} limit={limit}
        onPageChange={(p) => setPage(p)} onLimitChange={(l) => { setLimit(l); setPage(1); }} onSort={()=>{}} onSearch={()=>{}} searchValue={""}
        showAdd={false} showExport showFilter filters={tableFilters} showRefresh onRefresh={() => fetchData()} rowKey="rule_id"
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
        <Column header="Name" dataKey="rule_name" sortable />
        <Column
          header="Type"
          dataKey="commission_mode"
          sortable
          render={(v: string) =>
            v === "PERCENTAGE" ? "Percentage" : v === "FIXED" ? "Fixed" : (v ?? "-")}
        />
        <Column
          header="Value"
          dataKey="commission_value"
          sortable
          render={(v: any, row: any) =>
            row?.commission_mode === "PERCENTAGE"
              ? `${v ?? "-"}%`
              : row?.commission_mode === "FIXED"
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
        templateFileName="commissions_template.xlsx"
        columns={["rule_name", "commission_mode", "commission_value", "is_active"]}
        exampleRow={["Standard Commission", "PERCENTAGE", 15, "TRUE"]}
        columnDescription="rule_name, commission_mode (PERCENTAGE/FIXED), commission_value, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const errors: string[] = [];
          let success = 0;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 2;
            try {
              const res = await masterAPI.createLookup(resource, {
                rule_name: r.rule_name || "",
                commission_mode: r.commission_mode || "PERCENTAGE",
                commission_value: r.commission_value,
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

