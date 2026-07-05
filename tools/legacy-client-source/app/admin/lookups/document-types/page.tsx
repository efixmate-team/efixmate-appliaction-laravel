"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Edit2, BadgeAlert, FileText } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { lookupAPI as masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import MultiSelect from '@/app/admin/(components)/Forms/MultiSelect';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, parseBulkMandatory, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import {
  activeOnlyToggleFilter,
  applyClientFilters,
  dropdownFilterDescriptor,
  rowMatchesAppliesTo,
} from "@/app/admin/(lib)/tableFilters";

export default function DocumentTypesPage() {
  const MultiSelectField: any = MultiSelect;
  const resource = "document-types";
  const appliesToOptions = [
    { key: "TECHNICIAN", value: "Technician" },
    { key: "CUSTOMER", value: "User" },
  ];

  const parseAppliesTo = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          // fallback to CSV parsing below
        }
      }
      return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };

  const stringifyAppliesTo = (value: string[]) => value.join(",");

  const getAppliesToLabel = (value: any) => {
    const selected = parseAppliesTo(value);
    if (selected.length === 0) return "-";
    const map = new Map(appliesToOptions.map((o) => [o.key, o.value]));
    return selected.map((v) => map.get(v) || v).join(", ");
  };

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
    document_type: "",
    applies_to: [] as string[],
    is_mandatory: true,
    is_active: false,
  });
  const [createAppliesTo, setCreateAppliesTo] = useState<string[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [appliesToFilter, setAppliesToFilter] = useState("");

  const appliesToFilterOptions = useMemo(
    () => appliesToOptions.map((o) => ({ value: o.key, label: o.value })),
    []
  );

  const displayData = useMemo(
    () =>
      applyClientFilters(data, [
        { key: "is_active", value: activeOnly, activeOnly: true },
        {
          key: "applies_to",
          value: appliesToFilter,
          match: (row, v) => rowMatchesAppliesTo(row.applies_to, String(v)),
        },
      ]),
    [data, activeOnly, appliesToFilter]
  );

  const tableFilters = useMemo(
    () => [
      activeOnlyToggleFilter(activeOnly, setActiveOnly),
      dropdownFilterDescriptor(
        appliesToFilter,
        setAppliesToFilter,
        "All Audiences",
        appliesToFilterOptions
      ),
    ],
    [activeOnly, appliesToFilter, appliesToFilterOptions]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource);
      if (res.status && res.data) setData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.document_type_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.document_type_id);
        setOpenDeactivateModal(true);
      }
    } catch (err) {}
  };

  const handleMandatoryToggle = async (newValue: boolean, row: any) => {
    try {
      const response = await masterAPI.updateLookup(resource, row.document_type_id, {
        is_mandatory: newValue,
      });
      if (response?.status) {
        fetchData();
      } else {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err) {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
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
      document_type: row.document_type || "",
      applies_to: parseAppliesTo(row.applies_to),
      is_mandatory: row.is_mandatory !== false,
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = {
        ...editForm,
        applies_to: stringifyAppliesTo(editForm.applies_to),
      };
      const response = await masterAPI.updateLookup(resource, editRow.document_type_id, payload);
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
        cols={2} card title="Add Document Types" subtitle="Create a new entry"
        onSubmit={async (formData, values) => {
          const payload = {
            document_type: values.document_type,
            applies_to: stringifyAppliesTo(createAppliesTo),
            is_mandatory: values.is_mandatory !== false,
            is_active: values.is_active,
          };
          const response = await masterAPI.createLookup(resource, payload);
          if (response && response.status) {
            setSuccessOverlay(true);
            setTimeout(() => {
              setSuccessOverlay(false);
              setOpenCreateForm(false);
              setCreateAppliesTo([]);
              fetchData();
            }, 2000);
          } else {
            setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
          }
        }}
        onReset={() => { setOpenCreateForm(false); setCreateAppliesTo([]); }}
        submitLabel="Create" showReset loading={false}
      >
        <Input name="document_type" title="Document Name" required />
        <MultiSelectField
          name="applies_to"
          id="applies_to"
          title="Applicable For"
          options={appliesToOptions}
          value={createAppliesTo as any}
          onChange={(value) => setCreateAppliesTo(value as string[])}
        />
        <Toggle name="is_mandatory" title="Mandatory" checked />
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
          <Input name="document_type" title="Document Name" required value={editForm.document_type} onChange={(e) => setEditForm(p => ({...p, document_type: e.target.value}))} />
          <MultiSelectField
            name="applies_to"
            id="edit_applies_to"
            title="Applicable For"
            options={appliesToOptions}
            value={editForm.applies_to as any}
            onChange={(value) => setEditForm(p => ({ ...p, applies_to: value as string[] }))}
          />
          <Toggle name="is_mandatory" title="Mandatory" checked={editForm.is_mandatory} onChange={(v) => setEditForm(p => ({ ...p, is_mandatory: v }))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Document Types" badge="Settings" subtitle="System records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={()=>{}} searchValue={""}
        showAdd={false} showExport showFilter filters={tableFilters} showRefresh onRefresh={() => fetchData()} rowKey="document_type_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => setOpenCreateForm(true)}
          />
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Document Name" dataKey="document_type" sortable />
        <Column
          header="Applicable For"
          dataKey="applies_to"
          render={(val) => getAppliesToLabel(val)}
        />
        <Column
          header="Mandatory"
          dataKey="is_mandatory"
          type="toggle"
          onToggle={handleMandatoryToggle}
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
        templateFileName="document_types_template.xlsx"
        columns={["document_type", "applies_to", "is_mandatory", "is_active"]}
        exampleRow={["Aadhaar", "TECHNICIAN,CUSTOMER", "TRUE", "TRUE"]}
        columnDescription="document_type, applies_to (optional - comma-separated e.g. TECHNICIAN,CUSTOMER), is_mandatory (TRUE/FALSE), is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(resource, {
              document_type: r.document_type || "",
              applies_to: stringifyAppliesTo(parseAppliesTo(r.applies_to)),
              is_mandatory: parseBulkMandatory(r.is_mandatory),
              is_active: parseBulkIsActive(r.is_active),
            })
          );
          if (result.success > 0) fetchData();
          return result;
        }}
      />
    </div>
  );
}

