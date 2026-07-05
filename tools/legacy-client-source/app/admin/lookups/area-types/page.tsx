"use client";

import { useState, useEffect, useCallback } from "react";
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
import { MapPin } from "lucide-react";

export default function AreaTypesPage() {
  const resource = "area-types";
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
    area_type: "",
    description: "",
    order_seq: 0,
    is_active: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource);
      if (res.status && res.data) setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { displayData, tableFilters } = useClientActiveFilter(data);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.area_type_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.area_type_id);
        setOpenDeactivateModal(true);
      }
    } catch {
      /* ignore */
    }
  };

  const deactivateRecord = async () => {
    try {
      await masterAPI.updateLookup(resource, toggleRecordid, { is_active: false });
      setOpenDeactivateModal(false);
      fetchData();
    } catch {
      /* ignore */
    }
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
      area_type: row.area_type || "",
      description: row.description || "",
      order_seq: Number(row.order_seq) || 0,
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = {
        ...editForm,
        order_seq: Number(editForm.order_seq) || 0,
      };
      const response = await masterAPI.updateLookup(resource, editRow.area_type_id, payload);
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

      <SuccessOverlay
        show={successOverlay}
        onFinish={() => setSuccessOverlay(false)}
        title="Success"
        subtitle="Saved successfully."
      />
      <FailedOverlay
        show={failedOverlay}
        title="Failed"
        subtitle="Unable to save changes."
        onFinish={() => setFailedOverlay(false)}
      />

      <Form
        showMe={openCreateForm}
        cols={2}
        card
        title="Add Area Type"
        subtitle="Classify service areas (e.g. Residential, Commercial)"
        onSubmit={async (_formData, values) => {
          const payload = {
            area_type: values.area_type,
            description: values.description || null,
            order_seq: Number(values.order_seq) || 0,
            is_active: values.is_active,
          };
          const response = await masterAPI.createLookup(resource, payload);
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
        <Input name="area_type" title="Area Type" required />
        <Input name="description" title="Description" />
        <Input name="order_seq" title="Order" type="number" defaultValue="0" />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2}
          card
          title="Edit Area Type"
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
          <Input
            name="area_type"
            title="Area Type"
            required
            value={editForm.area_type}
            onChange={(e) => setEditForm((p) => ({ ...p, area_type: e.target.value }))}
          />
          <Input
            name="description"
            title="Description"
            value={editForm.description}
            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Input
            name="order_seq"
            title="Order"
            type="number"
            value={String(editForm.order_seq)}
            onChange={(e) => setEditForm((p) => ({ ...p, order_seq: Number(e.target.value) || 0 }))}
          />
          <Toggle
            name="is_active"
            title="Status"
            checked={editForm.is_active}
            onChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
          />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Area Types"
        badge="Settings"
        subtitle="Lookup values used when creating service areas"
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
        rowKey="area_type_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => setOpenCreateForm(true)}
          />
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Order" dataKey="order_seq" sortable />
        <Column header="Area Type" dataKey="area_type" sortable />
        <Column header="Description" dataKey="description" sortable />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={buildBulkCrudActions({
            onEdit: handleEdit,
            onActivateRow: (row) => {
              void handleToggle(true, row);
            },
            onDeactivateRow: (row) => {
              void handleToggle(false, row);
            },
            onBulkActivate: handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
          })}
        />
      </PaginatedTable>

      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <h2 className="text-[16px] font-bold text-center">Deactivate Record?</h2>
          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={() => setOpenDeactivateModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deactivateRecord}
              className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]"
            >
              Deactivate
            </button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="area_types_template.xlsx"
        columns={["area_type", "description", "order_seq", "is_active"]}
        exampleRow={["Residential", "Homes and apartments", "1", "TRUE"]}
        columnDescription="area_type, description, order_seq, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(resource, {
              area_type: r.area_type || "",
              description: r.description || null,
              order_seq: Number(r.order_seq) || 0,
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

