"use client";

import { useState, useCallback, useEffect } from "react";
import { Edit2, BadgeAlert, Tags } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { useClientActiveFilter } from "@/app/admin/(lib)/tableFilters";
import {
  categoryIconUrl,
  normalizeCategoryIconInput,
  SERVICE_CATEGORY_ICON_KEYS,
  SERVICES_ICONS_BASE,
} from "@/lib/serviceCategory";

export default function ServiceCategoriesPage() {
  const resource = "service-categories";
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [failedMsg, setFailedMsg] = useState("Unable to save changes.");

  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordId, setToggleRecordId] = useState<any>(null);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    category_name: "",
    category_icon: "",
    category_color: "#2563eb",
    description: "",
    is_active: true
  });
  const [createCategoryIcon, setCreateCategoryIcon] = useState("");

  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource, {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
      });
      if (res.status && res.data) { setData(res.data); setTotal(res.pagination?.total ?? res.data.length); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search]);

  const { displayData, tableFilters } = useClientActiveFilter(data);

  useEffect(() => { fetchData(); }, []);

  const showFailed = (msg: string) => { setFailedMsg(msg); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); };
  const showSuccess = (cb?: () => void) => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); cb?.(); fetchData(); }, 1800); };

  const buildCategoryPayload = (values: {
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    description?: string;
    is_active?: boolean;
  }) => ({
    category_name: values.category_name,
    category_icon: normalizeCategoryIconInput(values.category_icon) ?? "",
    category_color: values.category_color || "#2563eb",
    description: values.description ?? "",
    is_active: values.is_active !== false,
  });

  const handleToggle = async (newValue: boolean, row: any) => {
    if (newValue) {
      await masterAPI.updateLookup(resource, row.category_id, { is_active: true });
      fetchData();
    } else {
      setToggleRecordId(row.category_id);
      setOpenDeactivateModal(true);
    }
  };

  const deactivateRecord = async () => {
    await masterAPI.updateLookup(resource, toggleRecordId, { is_active: false });
    setOpenDeactivateModal(false);
    fetchData();
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => masterAPI.updateLookup(resource, id, data),
    {
      onSuccess: () => showSuccess(),
      onError: () => showFailed("Bulk update failed"),
    }
  );

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      category_name: row.category_name,
      category_icon: row.category_icon ?? "",
      category_color: row.category_color ?? "#2563eb",
      description: row.description ?? "",
      is_active: row.is_active
    });
    setOpenEditForm(true);
  };

  const CategoryIconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const resolvedCurrent = categoryIconUrl(value);
    return (
      <div className="flex flex-col gap-1.5 col-span-2">
        <label className="text-[13px] font-medium text-[#0f172a]">Category Icon</label>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
          <button
            type="button"
            onClick={() => onChange("")}
            title="No icon"
            className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
              !value ? "border-[#2563eb] bg-blue-50 shadow-sm" : "border-[#e2e8f0] hover:border-[#94a3b8] bg-white"
            }`}
          >
            <div className="h-9 w-9 rounded-md bg-[#f1f5f9] flex items-center justify-center">
              <span className="text-[10px] text-[#94a3b8] font-medium">None</span>
            </div>
          </button>
          {SERVICE_CATEGORY_ICON_KEYS.map((key) => {
            const url = `${SERVICES_ICONS_BASE}/${key}`;
            const isSelected = value === key || value === url;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                title={key.replace(".webp", "")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                  isSelected ? "border-[#2563eb] bg-blue-50 shadow-sm" : "border-[#e2e8f0] hover:border-[#94a3b8] bg-white"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={key} className="h-9 w-9 object-contain" />
                <span className="text-[9px] text-center text-[#64748b] leading-tight">{key.replace(".webp", "")}</span>
              </button>
            );
          })}
        </div>
        {resolvedCurrent && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-[#64748b]">Selected:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedCurrent} alt="" className="h-7 w-7 object-contain rounded-lg border border-[#e2e8f0] bg-[#f8fafc]" />
            <span className="text-[11px] text-[#475569] font-medium">{value.replace(".webp", "")}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Category saved." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle={failedMsg} onFinish={() => setFailedOverlay(false)} />

      {/* CREATE FORM */}
      <Form
        showMe={openCreateForm} cols={2} card
        title="Add Service Category" subtitle="Create a new category"
        onSubmit={async (_: any, values: any) => {
          try {
            const payload = buildCategoryPayload({ ...values, category_icon: createCategoryIcon });
            const res = await masterAPI.createLookup(resource, payload);
            if (res.status) showSuccess(() => { setOpenCreateForm(false); setCreateCategoryIcon(""); });
            else showFailed(res.message ?? "Failed");
          } catch (e: any) { showFailed(e.message); }
        }}
        onReset={() => { setOpenCreateForm(false); setCreateCategoryIcon(""); }} submitLabel="Create Category" showReset loading={false}
      >
        <Input name="category_name" title="Category Name" required />
        <Input name="category_color" title="Color" type="color" />
        <CategoryIconPicker value={createCategoryIcon} onChange={setCreateCategoryIcon} />
        <Input name="description" title="Description" />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {/* EDIT FORM */}
      {editRow && (
        <Form
          showMe={openEditForm} cols={2} card
          title="Edit Category" subtitle={`Editing: ${editRow.category_name}`}
          onSubmit={async () => {
            setEditLoading(true);
            try {
              const res = await masterAPI.updateLookup(
                resource,
                editRow.category_id,
                buildCategoryPayload(editForm),
              );
              if (res.status) showSuccess(() => { setOpenEditForm(false); setEditRow(null); });
              else showFailed(res.message ?? "Failed");
            } catch (e: any) { showFailed(e.message); }
            finally { setEditLoading(false); }
          }}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="category_name" title="Category Name" required value={editForm.category_name} onChange={(e: any) => setEditForm(p => ({ ...p, category_name: e.target.value }))} />
          <Input name="category_color" title="Color" type="color" value={editForm.category_color} onChange={(e: any) => setEditForm(p => ({ ...p, category_color: e.target.value }))} />
          <CategoryIconPicker value={editForm.category_icon} onChange={(v) => setEditForm(p => ({ ...p, category_icon: v }))} />
          <Input name="description" title="Description" value={editForm.description} onChange={(e: any) => setEditForm(p => ({ ...p, description: e.target.value }))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v: any) => setEditForm(p => ({ ...p, is_active: v }))} />
        </Form>
      )}

      {/* TABLE */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Service Categories" badge="Masters" subtitle={`${total} categories found`}
        data={displayData} total={total} loading={loading} page={page} limit={limit}
        showFilter
        filters={tableFilters}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}}
        onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="category_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => setOpenCreateForm(true)}
            addLabel="Add Category"
          />
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Code" dataKey="category_code" render={(v: any) => v ?? "-"} />
        <Column header="Category Name" dataKey="category_name" sortable />
        <Column
          header="Icon"
          dataKey="category_icon"
          render={(val) => {
            const src = categoryIconUrl(String(val ?? ""));
            if (src) {
              return (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-7 w-7 object-contain rounded border border-[#f1f5f9]" />
                  <span className="text-[11px] text-[#53697e] truncate max-w-[120px]" title={String(val)}>
                    {String(val)}
                  </span>
                </div>
              );
            }
            return (
              <span className="text-[12px] text-[#475569] font-mono" title={String(val)}>
                {val ? String(val) : "-"}
              </span>
            );
          }}
        />
        <Column
          header="Color"
          dataKey="category_color"
          render={(val) => {
            const hex = String(val ?? "").trim();
            const isHex = /^#[0-9a-f]{3,8}$/i.test(hex);
            return (
              <div className="flex items-center gap-2">
                {isHex && (
                  <span
                    className="h-6 w-6 rounded-md border border-[#e2e8f0] shrink-0"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                )}
                <span className="text-[12px] font-mono text-[#475569]">{hex || "-"}</span>
              </div>
            );
          }}
        />
        <Column header="Description" dataKey="description" />
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

      {/* DEACTIVATE MODAL */}
      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#ffffff]" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-center">Deactivate Category?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center">This category will be hidden from the service list.</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="service_categories_template.xlsx"
        columns={["category_name", "category_icon", "category_color", "description", "is_active"]}
        exampleRow={["Plumbing", "PLUMBER.webp", "#2563eb", "Plumbing services", "TRUE"]}
        columnDescription="category_name, category_icon (filename e.g. AC.webp or path /Services/Categories/AC.webp), category_color, description, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(
              resource,
              buildCategoryPayload({
                category_name: r.category_name || "",
                category_icon: r.category_icon || "",
                category_color: r.category_color || "#2563eb",
                description: r.description || "",
                is_active: parseBulkIsActive(r.is_active),
              }),
            )
          );
          if (result.success > 0) fetchData();
          return result;
        }}
      />
    </div>
  );
}

