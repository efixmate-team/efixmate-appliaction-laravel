"use client";

import { useState, useCallback, useEffect } from "react";
import { Edit2, BadgeAlert, Ticket } from "lucide-react";
import PaginatedTable, { Column, Filters, DropdownFilter, ToggleFilter } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Select from "@/app/admin/(components)/Forms/Select";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";

const DISCOUNT_TYPES = [
  { id: "PERCENTAGE", label: "Percentage (%)", value: "PERCENTAGE" },
  { id: "FIXED", label: "Fixed Amount (₹)", value: "FIXED" },
];

const SCOPE_TYPES = [
  { id: "ALL", label: "All", value: "ALL" },
  { id: "CATEGORY", label: "Category", value: "CATEGORY" },
  { id: "SERVICE", label: "Service", value: "SERVICE" },
  { id: "USER", label: "User", value: "USER" },
];

const DISCOUNT_TYPE_FILTER_OPTIONS = DISCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }));
const SCOPE_FILTER_OPTIONS = SCOPE_TYPES.map((t) => ({ value: t.value, label: t.label }));

export default function CouponsPage() {
  const resource = "coupons";
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterDiscountType, setFilterDiscountType] = useState("");
  const [filterScope, setFilterScope] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

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
    coupon_code: "", discount_type: "PERCENTAGE", discount_value: "",
    min_order_amount: "", max_discount_amount: "",
    max_uses: "0", max_uses_per_user: "1",
    valid_from: "", valid_until: "", scope: "ALL", is_active: true,
  });

  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const discountType = overrides.discount_type ?? filterDiscountType;
      const scope = overrides.scope ?? filterScope;
      const activeOnly = overrides.is_active ?? (filterActiveOnly ? true : undefined);
      const res = await masterAPI.getLookups(resource, {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(discountType ? { discount_type: discountType } : {}),
        ...(scope ? { scope } : {}),
        ...(activeOnly ? { is_active: true } : {}),
      });
      if (res.status && res.data) { setData(res.data); setTotal(res.pagination?.total ?? res.data.length); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search, filterDiscountType, filterScope, filterActiveOnly]);

  useEffect(() => { fetchData(); }, []);

  const showFailed = (msg: string) => { setFailedMsg(msg); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); };
  const showSuccess = (cb?: () => void) => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); cb?.(); fetchData(); }, 1800); };

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) { await masterAPI.updateLookup(resource, row.coupon_id, { is_active: true }); fetchData(); }
      else { setToggleRecordId(row.coupon_id); setOpenDeactivateModal(true); }
    } catch (e) { console.error(e); }
  };

  const deactivateRecord = async () => {
    await masterAPI.updateLookup(resource, toggleRecordId, { is_active: false });
    setOpenDeactivateModal(false); fetchData();
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
      coupon_code: row.coupon_code, discount_type: row.discount_type ?? "PERCENTAGE",
      discount_value: String(row.discount_value ?? ""),
      min_order_amount: String(row.min_order_amount ?? ""),
      max_discount_amount: String(row.max_discount_amount ?? ""),
      max_uses: String(row.max_uses ?? "0"),
      max_uses_per_user: String(row.max_uses_per_user ?? "1"),
      valid_from: row.valid_from ? String(row.valid_from).split("T")[0] : "",
      valid_until: row.valid_until ? String(row.valid_until).split("T")[0] : "",
      scope: row.scope ?? "ALL",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const isExpired = (d: string) => d && new Date(d) < new Date();

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Coupon saved." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle={failedMsg} onFinish={() => setFailedOverlay(false)} />

      {/* CREATE */}
      <Form showMe={openCreateForm} cols={3} card title="Create Coupon" subtitle="Configure discount coupon settings"
        onSubmit={async (_: any, values: any) => {
          try {
            const payload = {
              ...values,
              coupon_code: values.coupon_code.toUpperCase(),
              max_uses: parseInt(values.max_uses) || 0,
              max_uses_per_user: parseInt(values.max_uses_per_user) || 1,
            };
            const res = await masterAPI.createLookup(resource, payload);
            if (res.status) showSuccess(() => setOpenCreateForm(false));
            else showFailed(res.message ?? "Failed");
          } catch (e: any) { showFailed(e.message); }
        }}
        onReset={() => setOpenCreateForm(false)} submitLabel="Create Coupon" showReset loading={false}
      >
        <Input name="coupon_code" title="Coupon Code" required />
        <Select name="discount_type" title="Discount Type" required options={DISCOUNT_TYPES} />
        <Input name="discount_value" title="Value" type="number" required />
        <Input name="min_order_amount" title="Amount" type="number" />
        <Input name="max_discount_amount" title="Max Discount Cap" type="number" />
        <Input name="max_uses" title="Max Total Uses (0 = Unlimited)" type="number" />
        <Input name="max_uses_per_user" title="Max Uses Per User" type="number" />
        <Input name="valid_from" title="Valid From" type="date" />
        <Input name="valid_until" title="Valid Until" type="date" />
        <Select name="scope" title="Scope" required options={SCOPE_TYPES} />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {/* EDIT */}
      {editRow && (
        <Form showMe={openEditForm} cols={3} card title="Edit Coupon" subtitle={`Editing: ${editRow.coupon_code}`}
          onSubmit={async () => {
            setEditLoading(true);
            try {
              const payload = {
                ...editForm,
                max_uses: parseInt(editForm.max_uses) || 0,
                max_uses_per_user: parseInt(editForm.max_uses_per_user) || 1,
              };
              const res = await masterAPI.updateLookup(resource, editRow.coupon_id, payload);
              if (res.status) showSuccess(() => { setOpenEditForm(false); setEditRow(null); });
              else showFailed(res.message ?? "Failed");
            } catch (e: any) { showFailed(e.message); }
            finally { setEditLoading(false); }
          }}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="coupon_code" title="Coupon Code" value={editForm.coupon_code} onChange={(e: any) => setEditForm(p => ({ ...p, coupon_code: e.target.value }))} />
          <Select name="discount_type" title="Discount Type" options={DISCOUNT_TYPES} value={editForm.discount_type} onChange={(e: any) => setEditForm(p => ({ ...p, discount_type: e.target.value }))} />
          <Input name="discount_value" title="Value" type="number" value={editForm.discount_value} onChange={(e: any) => setEditForm(p => ({ ...p, discount_value: e.target.value }))} />
          <Input name="min_order_amount" title="Amount" type="number" value={editForm.min_order_amount} onChange={(e: any) => setEditForm(p => ({ ...p, min_order_amount: e.target.value }))} />
          <Input name="max_discount_amount" title="Max Discount Cap" type="number" value={editForm.max_discount_amount} onChange={(e: any) => setEditForm(p => ({ ...p, max_discount_amount: e.target.value }))} />
          <Input name="max_uses" title="Max Uses (0 = ∞)" type="number" value={editForm.max_uses} onChange={(e: any) => setEditForm(p => ({ ...p, max_uses: e.target.value }))} />
          <Input name="max_uses_per_user" title="Max Per User" type="number" value={editForm.max_uses_per_user} onChange={(e: any) => setEditForm(p => ({ ...p, max_uses_per_user: e.target.value }))} />
          <Input name="valid_from" title="Valid From" type="date" value={editForm.valid_from} onChange={(e: any) => setEditForm(p => ({ ...p, valid_from: e.target.value }))} />
          <Input name="valid_until" title="Valid Until" type="date" value={editForm.valid_until} onChange={(e: any) => setEditForm(p => ({ ...p, valid_until: e.target.value }))} />
          <Select name="scope" title="Scope" options={SCOPE_TYPES} value={editForm.scope} onChange={(e: any) => setEditForm(p => ({ ...p, scope: e.target.value }))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v: any) => setEditForm(p => ({ ...p, is_active: v }))} />
        </Form>
      )}

      {/* TABLE */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Coupons" badge="Masters" subtitle={`${total} coupons found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}} onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="coupon_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => setOpenCreateForm(true)}
            addLabel="Create Coupon"
          />
        }
      >
        <Filters>
          <DropdownFilter
            value={filterDiscountType}
            onChange={(v: string) => {
              setFilterDiscountType(v);
              setPage(1);
              fetchData({ page: 1, discount_type: v });
            }}
            placeholder="All Discount Types"
            options={DISCOUNT_TYPE_FILTER_OPTIONS}
          />
          <DropdownFilter
            value={filterScope}
            onChange={(v: string) => {
              setFilterScope(v);
              setPage(1);
              fetchData({ page: 1, scope: v });
            }}
            placeholder="All Scopes"
            options={SCOPE_FILTER_OPTIONS}
          />
          <ToggleFilter
            value={filterActiveOnly}
            onChange={(v: boolean) => {
              setFilterActiveOnly(v);
              setPage(1);
              fetchData({ page: 1, is_active: v ? true : undefined });
            }}
            label="Active only"
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="Code" dataKey="coupon_code" render={(v: any) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5f3ff] text-[#6d28d9] font-mono font-bold text-[12px]">
            <Ticket className="w-3 h-3" />{v}
          </span>
        )} />
        <Column header="Discount" dataKey="discount_type" render={(v: any, row: any) =>
          v === "PERCENTAGE" ? `${row.discount_value}% off` : `₹${row.discount_value} off`
        } />
        <Column header="Amount" dataKey="min_order_amount" />
        <Column header="Scope" dataKey="scope" />
        <Column header="Max Uses" dataKey="max_uses" render={(v: any) => v === 0 || v === "0" ? "∞" : v} />
        <Column header="Valid Until" dataKey="valid_until" render={(v: any) => (
          <span className={isExpired(v) ? "text-[#7b5757] font-medium" : ""}>{formatDate(v)}</span>
        )} />
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
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow flex items-center justify-center"><BadgeAlert className="w-5 h-5 text-[#ffffff]" /></div>
          </div>
          <h2 className="text-[16px] font-bold text-center">Deactivate Coupon?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center">This coupon will no longer be redeemable.</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="coupons_template.xlsx"
        columns={[
          "coupon_code", "discount_type", "discount_value", "min_order_amount",
          "max_discount_amount", "max_uses", "max_uses_per_user", "valid_from",
          "valid_until", "scope", "is_active",
        ]}
        exampleRow={["SAVE10", "PERCENTAGE", 10, 500, 100, 100, 1, "2026-01-01", "2026-12-31", "ALL", "TRUE"]}
        columnDescription="coupon_code, discount_type (PERCENTAGE/FIXED), discount_value, min_order_amount, max_discount_amount, max_uses, max_uses_per_user, valid_from, valid_until, scope (ALL/CATEGORY/SERVICE/USER), is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            masterAPI.createLookup(resource, {
              coupon_code: String(r.coupon_code || "").toUpperCase(),
              discount_type: r.discount_type || "PERCENTAGE",
              discount_value: r.discount_value,
              min_order_amount: r.min_order_amount,
              max_discount_amount: r.max_discount_amount,
              max_uses: parseInt(String(r.max_uses), 10) || 0,
              max_uses_per_user: parseInt(String(r.max_uses_per_user), 10) || 1,
              valid_from: r.valid_from || "",
              valid_until: r.valid_until || "",
              scope: r.scope || "ALL",
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

