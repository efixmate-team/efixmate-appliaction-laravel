"use client";

import { useCallback, useEffect, useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { lookupAPI as masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { useClientActiveFilter } from "@/app/admin/(lib)/tableFilters";

export default function UnitsPage() {
  const resource = "units";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordId, setToggleRecordId] = useState<any>(null);
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [editForm, setEditForm] = useState({
    unit_name: "",
    unit_symbol: "",
    is_active: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource);
      if (res.status && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { displayData, tableFilters } = useClientActiveFilter(data);

  const handleToggle = async (newValue: boolean, row: any) => {
    if (newValue) {
      await masterAPI.updateLookup(resource, row.unit_id, { is_active: true });
      fetchData();
    } else {
      setToggleRecordId(row.unit_id);
      setOpenDeactivateModal(true);
    }
  };

  const deactivateRecord = async () => {
    await masterAPI.updateLookup(resource, toggleRecordId, { is_active: false });
    setOpenDeactivateModal(false);
    fetchData();
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, payload) => masterAPI.updateLookup(resource, id, payload),
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          fetchData();
        }, 1500);
      },
      onError: () => {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      },
    },
  );

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      unit_name: row.unit_name || "",
      unit_symbol: row.unit_symbol || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const response = await masterAPI.updateLookup(resource, editRow.unit_id, editForm);
      if (response?.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenEditForm(false);
          setEditRow(null);
          fetchData();
        }, 2000);
      } else {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to save changes." onFinish={() => setFailedOverlay(false)} />

      <Form
        showMe={openCreateForm}
        cols={2}
        card
        title="Add Unit"
        subtitle="Create a new unit of measure"
        onSubmit={async (_formData, values) => {
          const response = await masterAPI.createLookup(resource, {
            unit_name: values.unit_name,
            unit_symbol: values.unit_symbol,
            is_active: values.is_active,
          });
          if (response?.status) {
            setSuccessOverlay(true);
            setTimeout(() => {
              setSuccessOverlay(false);
              setOpenCreateForm(false);
              fetchData();
            }, 2000);
          } else {
            setFailedOverlay(true);
            setTimeout(() => setFailedOverlay(false), 3000);
          }
        }}
        onReset={() => setOpenCreateForm(false)}
        submitLabel="Create"
        showReset
        loading={false}
      >
        <Input name="unit_name" title="Unit Name" required />
        <Input name="unit_symbol" title="Symbol" required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2}
          card
          title="Edit Unit"
          subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => {
            setOpenEditForm(false);
            setEditRow(null);
          }}
          submitLabel="Save Changes"
          showReset
          loading={editLoading}
        >
          <Input name="unit_name" title="Unit Name" required value={editForm.unit_name} onChange={(e) => setEditForm((p) => ({ ...p, unit_name: e.target.value }))} />
          <Input name="unit_symbol" title="Symbol" required value={editForm.unit_symbol} onChange={(e) => setEditForm((p) => ({ ...p, unit_symbol: e.target.value }))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Units"
        badge="Settings"
        subtitle="Units of measure used by services"
        data={displayData}
        total={displayData.length}
        loading={loading}
        page={1}
        limit={999}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onSort={() => {}}
        onSearch={() => {}}
        searchValue=""
        showAdd={false}
        showExport
        showFilter
        filters={tableFilters}
        showRefresh
        onRefresh={() => fetchData()}
        rowKey="unit_id"
        headerActions={<BulkUploadHeaderActions onUpload={() => setOpenBulkModal(true)} onAdd={() => setOpenCreateForm(true)} />}
      >
        <Column header="SL" type="serial" />
        <Column header="Unit Name" dataKey="unit_name" sortable />
        <Column header="Symbol" dataKey="unit_symbol" sortable />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={buildBulkCrudActions({
            onEdit: handleEdit,
            onActivateRow: (row) => void handleToggle(true, row),
            onDeactivateRow: (row) => void handleToggle(false, row),
            onBulkActivate: handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
          })}
        />
      </PaginatedTable>

      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <h2 className="text-[16px] font-bold text-center">Deactivate Record?</h2>
          <div className="mt-6 flex gap-2.5">
            <button type="button" onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button type="button" onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="units_template.xlsx"
        columns={["unit_name", "unit_symbol", "is_active"]}
        exampleRow={["Hour", "hr", "TRUE"]}
        columnDescription="unit_name, unit_symbol, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(resource, {
              unit_name: r.unit_name || "",
              unit_symbol: r.unit_symbol || "",
              is_active: parseBulkIsActive(r.is_active),
            }),
          );
          if (result.success > 0) fetchData();
          return result;
        }}
      />
    </div>
  );
}
