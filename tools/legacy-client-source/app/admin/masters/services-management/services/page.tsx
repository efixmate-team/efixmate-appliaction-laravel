"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { BadgeAlert } from "lucide-react";
import PaginatedTable, { Column, Filters, DropdownFilter, ToggleFilter } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI, lookupAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Checkbox from "@/app/admin/(components)/Forms/Checkbox";
import Select from "@/app/admin/(components)/Forms/Select";
import MultiSelect from "@/app/admin/(components)/Forms/MultiSelect";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, parseCommaIds, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { getServiceImageOptionsForCategory, resolveServiceImageUrl } from "@/lib/serviceImage";

export default function ServicesPage() {
  const MultiSelectField: any = MultiSelect;
  const resource = "services";
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [bookingTypeOptions, setBookingTypeOptions] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [chargeOptions, setChargeOptions] = useState<any[]>([]);
  const [discountOptions, setDiscountOptions] = useState<any[]>([]);
  const [couponOptions, setCouponOptions] = useState<any[]>([]);
  const [createBookingTypeIds, setCreateBookingTypeIds] = useState<any[]>([]);
  const [createUnitIds, setCreateUnitIds] = useState<any[]>([]);
  const [createChargeIds, setCreateChargeIds] = useState<any[]>([]);
  const [createDiscountIds, setCreateDiscountIds] = useState<any[]>([]);
  const [createCouponIds, setCreateCouponIds] = useState<any[]>([]);
  const [createServiceIcon, setCreateServiceIcon] = useState("");
  const [createCategoryId, setCreateCategoryId] = useState("");

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
    service: "",
    category_id: "",
    description: "",
    base_price: "",
    duration: "",
    image_url: "",
    service_icon: "",
    service_color: "#2563eb",
    booking_type_ids: [] as any[],
    unit_ids: [] as any[],
    charge_ids: [] as any[],
    discount_ids: [] as any[],
    coupon_ids: [] as any[],
    is_emergency: false,
    is_quick_service: false,
    is_instant_service: false,
    is_one_click_service: false,
    is_active: true,
  });

  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const categoryId = overrides.category_id ?? filterCategoryId;
      const activeOnly = overrides.is_active ?? (filterActiveOnly ? true : undefined);
      const minPrice = overrides.min_price ?? filterMinPrice;
      const maxPrice = overrides.max_price ?? filterMaxPrice;
      const res = await masterAPI.getLookups(resource, {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(activeOnly ? { is_active: true } : {}),
        ...(minPrice !== "" ? { min_price: minPrice } : {}),
        ...(maxPrice !== "" ? { max_price: maxPrice } : {}),
      });
      if (res.status && res.data) { setData(res.data); setTotal(res.pagination?.total ?? res.data.length); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search, filterCategoryId, filterActiveOnly, filterMinPrice, filterMaxPrice]);

  useEffect(() => {
    fetchData();
    masterAPI.getLookups("service-categories", { limit: 'all' }).then((res: any) => {
      if (res.data) setCategoryOptions(res.data.map((c: any) => ({ id: c.category_id, label: c.category_name, value: String(c.category_id) })));
    });
    lookupAPI.getBookingTypes({ limit: "all" }).then((res: any) => {
      if (res.data) setBookingTypeOptions(res.data.map((item: any) => ({ key: String(item.booking_type_id), value: item.booking_type })));
    });
    lookupAPI.getUnits({ limit: "all" }).then((res: any) => {
      if (res.data) setUnitOptions(res.data.map((item: any) => ({ key: String(item.unit_id), value: item.unit_name ?? item.unit ?? `Unit #${item.unit_id}` })));
    });
    masterAPI.getCharges({ limit: "all" }).then((res: any) => {
      if (res.data) setChargeOptions(res.data.map((item: any) => ({ key: String(item.charge_id), value: item.charge_name ?? item.charge ?? `Charge #${item.charge_id}` })));
    });
    masterAPI.getDiscounts({ limit: "all" }).then((res: any) => {
      if (res.data) setDiscountOptions(res.data.map((item: any) => ({ key: String(item.discount_id), value: item.discount_title ?? item.discount_name ?? item.discount ?? `Discount #${item.discount_id}` })));
    });
    masterAPI.getCoupons({ limit: "all" }).then((res: any) => {
      if (res.data) setCouponOptions(res.data.map((item: any) => ({ key: String(item.coupon_id), value: item.coupon_code ?? item.coupon_name ?? item.coupon ?? `Coupon #${item.coupon_id}` })));
    });
  }, []);

  const showFailed = (msg: string) => { setFailedMsg(msg); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); };
  const showSuccess = (cb?: () => void) => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); cb?.(); fetchData(); }, 1800); };

  const handleToggle = async (newValue: boolean, row: any) => {
    if (newValue) { await masterAPI.updateLookup(resource, row.service_id, { is_active: true }); fetchData(); }
    else { setToggleRecordId(row.service_id); setOpenDeactivateModal(true); }
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

  const normalizeIdArray = (value: any) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };

  const handleEdit = async (row: any) => {
    let source = row;
    try {
      const detailRes = await masterAPI.getLookupById(resource, row.service_id);
      if (detailRes?.status && detailRes?.data) {
        source = detailRes.data;
      }
    } catch (_err) {
      // Fallback to row data if detail fetch fails.
    }

    setEditRow(row);
    setEditForm({
      service: source.service ?? row.service ?? "",
      category_id: String(source.category_id ?? row.category_id ?? ""),
      description: source.description ?? "",
      base_price: source.base_price ?? "",
      duration: source.duration ?? "",
      image_url: source.image_url ?? row.image_url ?? source.service_icon ?? row.service_icon ?? "",
      service_icon: source.service_icon ?? row.service_icon ?? source.image_url ?? row.image_url ?? "",
      service_color: source.service_color ?? row.service_color ?? "#2563eb",
      booking_type_ids: normalizeIdArray(source.booking_type_ids ?? source.booking_type_id),
      unit_ids: normalizeIdArray(source.unit_ids ?? source.unit_id),
      charge_ids: normalizeIdArray(source.charge_ids ?? source.charge_id),
      discount_ids: normalizeIdArray(source.discount_ids ?? source.discount_id),
      coupon_ids: normalizeIdArray(source.coupon_ids ?? source.coupon_id),
      is_emergency: Boolean(source.is_emergency ?? row.is_emergency),
      is_quick_service: Boolean(source.is_quick_service ?? row.is_quick_service),
      is_instant_service: Boolean(source.is_instant_service ?? row.is_instant_service),
      is_one_click_service: Boolean(source.is_one_click_service ?? row.is_one_click_service),
      is_active: source.is_active ?? row.is_active,
    });
    setOpenEditForm(true);
  };

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions.forEach((c: any) => map.set(String(c.value ?? c.id), c.label));
    return map;
  }, [categoryOptions]);

  const ServiceIconPicker = ({
    value,
    categoryName,
    onChange,
  }: {
    value: string;
    categoryName?: string;
    onChange: (v: string) => void;
  }) => {
    const imageOptions = getServiceImageOptionsForCategory(categoryName);
    const resolvedCurrent = resolveServiceImageUrl(value);
    return (
      <div className="flex flex-col gap-1.5 col-span-2">
        <label className="text-[13px] font-medium text-[#0f172a]">
          Service Icon
          {categoryName && <span className="ml-2 text-[11px] font-normal text-[#64748b]">{categoryName}</span>}
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] max-h-52 overflow-y-auto">
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
          {imageOptions.map(({ key, label, url }) => {
            const isSelected = value === key || value === url || resolveServiceImageUrl(value) === url;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                title={label}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                  isSelected ? "border-[#2563eb] bg-blue-50 shadow-sm" : "border-[#e2e8f0] hover:border-[#94a3b8] bg-white"
                }`}
                >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={key} className="h-9 w-9 object-contain" />
                <span className="text-[9px] text-center text-[#64748b] leading-tight line-clamp-2 w-full">{label}</span>
              </button>
            );
          })}
        </div>
        {resolvedCurrent && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-[#64748b]">Selected:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedCurrent} alt="" className="h-7 w-7 object-contain rounded-lg border border-[#e2e8f0] bg-[#f8fafc]" />
            <span className="text-[11px] text-[#475569] font-medium">{value.split("/").pop()?.replace(".webp", "")}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Service saved." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle={failedMsg} onFinish={() => setFailedOverlay(false)} />

      {/* CREATE FORM */}
      <Form showMe={openCreateForm} cols={2} card title="Add Service" subtitle="Create a new service under a category"
        onSubmit={async (_: any, values: any) => {
          if (createBookingTypeIds.length === 0) {
            showFailed("Booking Type is mandatory.");
            return;
          }
          try {
            const payload = {
              ...values,
              service_color: values.service_color || "#2563eb",
              service_icon: createServiceIcon || values.service_icon || "",
              image_url: createServiceIcon || values.image_url || values.service_icon || "",
              booking_type_ids: createBookingTypeIds,
              unit_ids: createUnitIds,
              charge_ids: createChargeIds,
              discount_ids: createDiscountIds,
              coupon_ids: createCouponIds,
            };
            const res = await masterAPI.createLookup(resource, payload);
            if (res.status) showSuccess(() => setOpenCreateForm(false));
            else showFailed(res.message ?? "Failed");
          } catch (e: any) { showFailed(e.message); }
        }}
        onReset={() => {
          setOpenCreateForm(false);
          setCreateBookingTypeIds([]);
          setCreateUnitIds([]);
          setCreateChargeIds([]);
          setCreateDiscountIds([]);
          setCreateCouponIds([]);
          setCreateServiceIcon("");
          setCreateCategoryId("");
        }} submitLabel="Create Service" showReset loading={false}
      >
        <Input name="service" title="Service Name" required />
        <Select
          name="category_id"
          title="Category"
          required
          options={categoryOptions}
          value={createCategoryId}
          onChange={(e: any) => {
            setCreateCategoryId(e.target.value);
            setCreateServiceIcon("");
          }}
        />
        <ServiceIconPicker
          value={createServiceIcon}
          categoryName={categoryNameById.get(createCategoryId)}
          onChange={setCreateServiceIcon}
        />
        <Input name="service_color" title="Color" type="color" />
        <Input name="description" title="Description" />
        <Input name="base_price" title="Amount" type="number" />
        <Input name="duration" title="Duration" />
        <MultiSelectField name="booking_type_ids" title="Booking Type" required options={bookingTypeOptions} value={createBookingTypeIds as any} onChange={(v: any) => setCreateBookingTypeIds(v as any[])} />
        <MultiSelectField name="unit_ids" title="Unit" options={unitOptions} value={createUnitIds as any} onChange={(v: any) => setCreateUnitIds(v as any[])} />
        <MultiSelectField name="charge_ids" title="Charge" options={chargeOptions} value={createChargeIds as any} onChange={(v: any) => setCreateChargeIds(v as any[])} />
        <MultiSelectField name="discount_ids" title="Discount" options={discountOptions} value={createDiscountIds as any} onChange={(v: any) => setCreateDiscountIds(v as any[])} />
        <MultiSelectField name="coupon_ids" title="Coupon" options={couponOptions} value={createCouponIds as any} onChange={(v: any) => setCreateCouponIds(v as any[])} />
        <Checkbox name="is_emergency" label="Is Emergency Service" />
        <Checkbox name="is_quick_service" label="Is Quick Service" />
        <Checkbox name="is_instant_service" label="Is Instant Service" />
        <Checkbox name="is_one_click_service" label="Is One Click Service" />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {/* EDIT FORM */}
      {editRow && (
        <Form showMe={openEditForm} cols={2} card title="Edit Service" subtitle={`Editing: ${editRow.service}`}
          onSubmit={async () => {
            if (editForm.booking_type_ids.length === 0) {
              showFailed("Booking Type is mandatory.");
              return;
            }
            setEditLoading(true);
            try {
              const res = await masterAPI.updateLookup(resource, editRow.service_id, editForm);
              if (res.status) showSuccess(() => { setOpenEditForm(false); setEditRow(null); });
              else showFailed(res.message ?? "Failed");
            } catch (e: any) { showFailed(e.message); }
            finally { setEditLoading(false); }
          }}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input name="service" title="Service Name" required value={editForm.service} onChange={(e: any) => setEditForm(p => ({ ...p, service: e.target.value }))} />
          <Select
            name="category_id"
            title="Category"
            options={categoryOptions}
            value={editForm.category_id}
            onChange={(e: any) => setEditForm(p => ({ ...p, category_id: e.target.value, service_icon: "" }))}
          />
          <ServiceIconPicker
            value={editForm.service_icon || editForm.image_url}
            categoryName={categoryNameById.get(editForm.category_id)}
            onChange={(v) => setEditForm(p => ({ ...p, service_icon: v, image_url: v }))}
          />
          <Input name="service_color" title="Color" type="color" value={editForm.service_color} onChange={(e: any) => setEditForm(p => ({ ...p, service_color: e.target.value }))} />
          <Input name="description" title="Description" value={editForm.description} onChange={(e: any) => setEditForm(p => ({ ...p, description: e.target.value }))} />
          <Input name="base_price" title="Amount" type="number" value={editForm.base_price} onChange={(e: any) => setEditForm(p => ({ ...p, base_price: e.target.value }))} />
          <Input name="duration" title="Duration" value={editForm.duration} onChange={(e: any) => setEditForm(p => ({ ...p, duration: e.target.value }))} />
          <MultiSelectField name="booking_type_ids" title="Booking Type" required options={bookingTypeOptions} value={editForm.booking_type_ids as any} onChange={(v: any) => setEditForm(p => ({ ...p, booking_type_ids: v as any[] }))} />
          <MultiSelectField name="unit_ids" title="Unit" options={unitOptions} value={editForm.unit_ids as any} onChange={(v: any) => setEditForm(p => ({ ...p, unit_ids: v as any[] }))} />
          <MultiSelectField name="charge_ids" title="Charge" options={chargeOptions} value={editForm.charge_ids as any} onChange={(v: any) => setEditForm(p => ({ ...p, charge_ids: v as any[] }))} />
          <MultiSelectField name="discount_ids" title="Discount" options={discountOptions} value={editForm.discount_ids as any} onChange={(v: any) => setEditForm(p => ({ ...p, discount_ids: v as any[] }))} />
          <MultiSelectField name="coupon_ids" title="Coupon" options={couponOptions} value={editForm.coupon_ids as any} onChange={(v: any) => setEditForm(p => ({ ...p, coupon_ids: v as any[] }))} />
          <Checkbox name="is_emergency" label="Is Emergency Service" checked={editForm.is_emergency} onChange={(e: any) => setEditForm(p => ({ ...p, is_emergency: e.target.checked }))} />
          <Checkbox name="is_quick_service" label="Is Quick Service" checked={editForm.is_quick_service} onChange={(e: any) => setEditForm(p => ({ ...p, is_quick_service: e.target.checked }))} />
          <Checkbox name="is_instant_service" label="Is Instant Service" checked={editForm.is_instant_service} onChange={(e: any) => setEditForm(p => ({ ...p, is_instant_service: e.target.checked }))} />
          <Checkbox name="is_one_click_service" label="Is One Click Service" checked={editForm.is_one_click_service} onChange={(e: any) => setEditForm(p => ({ ...p, is_one_click_service: e.target.checked }))} />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v: any) => setEditForm(p => ({ ...p, is_active: v }))} />
        </Form>
      )}

      {/* TABLE */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Services" badge="Masters" subtitle={`${total} services found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}}
        onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="service_id"
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={() => {
              setCreateBookingTypeIds([]);
              setCreateUnitIds([]);
              setCreateChargeIds([]);
              setCreateDiscountIds([]);
              setCreateCouponIds([]);
              setCreateServiceIcon("");
              setCreateCategoryId("");
              setOpenCreateForm(true);
            }}
            addLabel="Add Service"
          />
        }
      >
        <Filters>
          <DropdownFilter
            value={filterCategoryId}
            onChange={(v: string) => {
              setFilterCategoryId(v);
              setPage(1);
              fetchData({ page: 1, category_id: v });
            }}
            placeholder="All Categories"
            options={categoryOptions.map((c: any) => ({ value: c.value, label: c.label }))}
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
          <input
            type="number"
            min="0"
            value={filterMinPrice}
            onChange={(e) => {
              const value = e.target.value;
              setFilterMinPrice(value);
              setPage(1);
              fetchData({ page: 1, min_price: value });
            }}
            placeholder="Min Price"
            className="h-10 w-28 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#334155] outline-none focus:border-[#94a3b8]"
          />
          <input
            type="number"
            min="0"
            value={filterMaxPrice}
            onChange={(e) => {
              const value = e.target.value;
              setFilterMaxPrice(value);
              setPage(1);
              fetchData({ page: 1, max_price: value });
            }}
            placeholder="Max Price"
            className="h-10 w-28 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#334155] outline-none focus:border-[#94a3b8]"
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="Code" dataKey="service_code" render={(v: any) => v ?? "-"} />
        <Column header="Service" dataKey="service" sortable />
        <Column
          header="Image"
          dataKey="image_url"
          render={(val: unknown, row: Record<string, unknown>) => {
            const raw = String(val || row.service_icon || "");
            const src = resolveServiceImageUrl(raw);
            if (src) {
              return (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-7 w-7 object-contain rounded border border-[#f1f5f9]" />
                  <span className="text-[11px] text-[#64748b] truncate max-w-[140px]" title={raw}>
                    {raw.split("/").pop()?.replace(/\.[^.]+$/, "") || raw}
                  </span>
                </div>
              );
            }
            return (
              <span className="text-[12px] text-[#475569] font-mono" title={raw}>
                {raw || "-"}
              </span>
            );
          }}
        />
        <Column header="Category" dataKey="category_name" />
        <Column header="Amount" dataKey="base_price" />
        <Column header="Duration" dataKey="duration" render={(v: any) => v || "-"} />
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
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#ffffff]" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-center">Deactivate Service?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center">This service will be hidden from all listings.</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="services_template.xlsx"
        columns={[
          "service", "category_id", "description", "base_price", "duration",
          "image_url", "service_icon", "service_color", "booking_type_ids", "unit_ids",
          "charge_ids", "discount_ids", "coupon_ids", "is_active",
        ]}
        exampleRow={[
          "AC Repair", 1, "Split AC servicing", 499, "2 hrs", "/services-icons/service/HVAC & Appliance Services/AC REPAIR.webp", "/services-icons/service/HVAC & Appliance Services/AC REPAIR.webp", "#2563eb",
          "1,2", "1", "", "", "", "TRUE",
        ]}
        columnDescription="service, category_id, description, base_price, duration, image_url, service_icon, service_color, booking_type_ids (required, comma-separated), unit_ids, charge_ids, discount_ids, coupon_ids, is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) => {
            const bookingTypeIds = parseCommaIds(r.booking_type_ids);
            if (bookingTypeIds.length === 0) {
              throw new Error("booking_type_ids is required");
            }
            return masterAPI.createLookup(resource, {
              service: r.service || "",
              category_id: r.category_id,
              description: r.description || "",
              base_price: r.base_price,
              duration: r.duration || "",
              service_icon: r.service_icon || "",
              image_url: r.image_url || r.service_icon || "",
              service_color: r.service_color || "#2563eb",
              booking_type_ids: bookingTypeIds,
              unit_ids: parseCommaIds(r.unit_ids),
              charge_ids: parseCommaIds(r.charge_ids),
              discount_ids: parseCommaIds(r.discount_ids),
              coupon_ids: parseCommaIds(r.coupon_ids),
              is_active: parseBulkIsActive(r.is_active),
            });
          });
          if (result.success > 0) fetchData();
          return result;
        }}
      />
    </div>
  );
}

