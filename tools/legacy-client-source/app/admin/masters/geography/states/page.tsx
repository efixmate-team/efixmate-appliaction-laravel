"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, FileSpreadsheet, Plus, Map } from "lucide-react";
import PaginatedTable, { Column, Filters, DropdownFilter } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import AsyncSelect from '@/app/admin/(components)/Forms/AsyncSelect';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { useGeographyFilterOptions } from "@/app/admin/(lib)/tableFilters";

export default function StatesPage() {
  const resource = "states";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<any>(null);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState("");
  const geoOptions = useGeographyFilterOptions(filterCountryId, "", "");

  const [editForm, setEditForm] = useState({
    country_id: "",
    state_name: "",
    state_code: "",
    is_active: false,
  });

  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const countryId = overrides.country_id ?? filterCountryId;
      const res = await masterAPI.getStates({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(countryId ? { country_id: countryId } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch (err) {} finally { setLoading(false); }
  }, [page, limit, search, filterCountryId]);

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      await masterAPI.updateState(row.state_id, { is_active: newValue });
      fetchData();
    } catch (err) {}
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => masterAPI.updateState(id, data),
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

  const handleBulkDelete = async (ids: any[]) => {
    try {
      await Promise.all(ids.map((id) => masterAPI.deleteState(id)));
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
    } catch {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleDelete = (row: any) => {
    setDeleteId(row.state_id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await masterAPI.deleteState(deleteId);
      setOpenDeleteModal(false);
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
    } catch (error) {
      setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      country_id: row.country_id || "",
      state_name: row.state_name || "",
      state_code: row.state_code || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editForm };
      const response = await masterAPI.updateState(editRow.state_id, payload);
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
        cols={2} card title="Add States" subtitle="Create a new entry"
        onSubmit={async (_, values) => {
          const payload = {
            country_id: values.country_id,
            state_name: values.state_name,
            state_code: values.state_code,
            is_active: values.is_active,
          };
          const response = await masterAPI.createState(payload);
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
        <AsyncSelect name="country_id" title="Country" resource="countries" required />
        <Input name="state_name" title="State Name" required />
        <Input name="state_code" title="State Code" required />
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
          <AsyncSelect
            name="country_id" title="Country" resource="countries" required
            value={editForm.country_id}
            onChange={(e: any) => setEditForm(p => ({...p, country_id: e.target.value}))}
          />
          <Input name="state_name" title="State Name" required value={editForm.state_name} onChange={(e) => setEditForm(p => ({...p, state_name: e.target.value}))} />
          <Input name="state_code" title="State Code" required value={editForm.state_code} onChange={(e) => setEditForm(p => ({...p, state_code: e.target.value}))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="States" badge="Settings" subtitle={`${total} records found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={(p) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}}
        onSearch={(v) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="state_id"
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
        <Filters>
          <DropdownFilter
            value={filterCountryId}
            onChange={(v: string) => {
              setFilterCountryId(v);
              setPage(1);
              fetchData({ page: 1, country_id: v });
            }}
            placeholder="All Countries"
            options={geoOptions.countries}
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="State Name" dataKey="state_name" sortable />
        <Column header="Country" dataKey="country_name" sortable />
        <Column header="State Code" dataKey="state_code" sortable />
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
            onDeleteRow: handleDelete,
            onBulkDelete: handleBulkDelete,
          })}
        />
      </PaginatedTable>

      <Modal openModal={openDeleteModal} setOpenModal={setOpenDeleteModal}>
         <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto text-center">
          <div className="w-12 h-12 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-[#7b5757]" />
          </div>
          <h2 className="text-[16px] font-bold">Delete Record?</h2>
          <p className="text-[12px] text-[#5c6a7f] mt-2">This action cannot be undone. Are you sure you want to delete this state?</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Delete Permanent</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="states_template.xlsx"
        columns={["country_id", "state_name", "state_code", "is_active"]}
        exampleRow={[1, "Maharashtra", "MH", "TRUE"]}
        columnDescription="country_id (numeric ID), state_name, state_code, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const errors: string[] = [];
          let success = 0;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 2;
            try {
              const res = await masterAPI.createState({
                country_id: r.country_id,
                state_name: r.state_name || "",
                state_code: r.state_code || "",
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

