"use client";

import { useState, useEffect, useCallback } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { lookupAPI as masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { useClientActiveFilter } from "@/app/admin/(lib)/tableFilters";
import { CalendarDays } from "lucide-react";

export default function BookingTypesPage() {
  const resource = "booking-types";
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
    booking_type: "",
    description: "",
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

  const { displayData, tableFilters } = useClientActiveFilter(data);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.booking_type_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.booking_type_id);
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
      booking_type: row.booking_type || "",
      description: row.description || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateLookup(resource, editRow.booking_type_id, payload);
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
        cols={2} card title="Add Booking Types" subtitle="Create a new entry"
        onSubmit={async (formData, values) => {
          const payload = {
            booking_type: values.booking_type,
            description: values.description,
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
        <Input name="booking_type" title="Type Name" required />
        <Input name="description" title="Description" required />
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
          <Input name="booking_type" title="Type Name" required value={editForm.booking_type} onChange={(e) => setEditForm(p => ({...p, booking_type: e.target.value}))} />
          <Input name="description" title="Description" required value={editForm.description} onChange={(e) => setEditForm(p => ({...p, description: e.target.value}))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Booking Types" badge="Settings" subtitle="System records"
        data={displayData} total={displayData.length} loading={loading} page={1} limit={999}
        onPageChange={()=>{}} onLimitChange={()=>{}} onSort={()=>{}} onSearch={()=>{}} searchValue={""}
        showAdd={false} showExport showFilter filters={tableFilters} showRefresh onRefresh={() => fetchData()} rowKey="booking_type_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => setOpenCreateForm(true)}
          />
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Type Name" dataKey="booking_type" sortable />
        <Column header="Description" dataKey="description" sortable />
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
        templateFileName="booking_types_template.xlsx"
        columns={["booking_type", "description", "is_active"]}
        exampleRow={["Standard", "Default booking type", "TRUE"]}
        columnDescription="booking_type, description, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(resource, {
              booking_type: r.booking_type || "",
              description: r.description || "",
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

