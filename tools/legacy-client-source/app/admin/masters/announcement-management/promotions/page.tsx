"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ImageOff, Loader2, Link2, X, ChevronDown, Megaphone, Pencil } from "lucide-react";
import FileUpload from "@/app/admin/(components)/Forms/FileUpload";
import PaginatedTable, {
  Column, Filters, DropdownFilter, DateFilter, ToggleFilter,
} from "@/app/admin/(components)/Table";
import { buildBulkCrudActions } from "@/app/admin/(lib)/bulkCrudActions";
import { promoAPI } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api/coreClient";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, parseCommaIds, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { AUDIENCE_OPTIONS, getScreenOptions } from "../constants";
import ScopeSelector from "../ScopeSelector";

const PROMOTION_TYPES = [
  { id: "BANNER", label: "Banner" },
  { id: "CAROUSEL", label: "Carousel Slide" },
  { id: "OFFER_BANNER", label: "Offer Banner" },
];

const SCOPE_TYPES = [
  { id: "GLOBAL", label: "Global" },
  { id: "COUNTRY", label: "Country" },
  { id: "STATE", label: "State" },
  { id: "CITY", label: "City" },
  { id: "AREA", label: "Area" },
];

const TYPE_FILTER_OPTIONS   = PROMOTION_TYPES.map(t => ({ value: t.id, label: t.label }));
const SCOPE_FILTER_OPTIONS  = SCOPE_TYPES.map(t => ({ value: t.id, label: t.label }));
const STATUS_FILTER_OPTIONS = [
  { value: "ACTIVE",    label: "Active" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "EXPIRED",   label: "Expired" },
  { value: "DISABLED",  label: "Disabled" },
];
const AUDIENCE_FILTER_OPTIONS = (AUDIENCE_OPTIONS as any[]).map((a: any) => ({ value: a.id, label: a.label }));

/** Mobile banner upload cap (must match server PROMOTION_BANNER_MAX_BYTES). */
const PROMO_BANNER_MAX_MB = 10;
const PROMO_BANNER_MAX_BYTES = PROMO_BANNER_MAX_MB * 1024 * 1024;

const INITIAL_FORM = {
  title: "",
  subtitle: "",
  description: "",
  promo_type: "BANNER",
  scope_type: "GLOBAL",
  scope_ids: [] as string[],
  target_audience: "USER",
  target_screen: "HOME",
  mobile_image_url: "",
  mobile_banner_file: null as File | null,
  priority: 0,
  start_at: "",
  end_at: "",
  is_active: true,
  is_scheduled: false,
  is_disabled: false,
};

type FilterState = {
  promoType: string;
  scopeType: string;
  status: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const INITIAL_FILTERS: FilterState = {
  promoType: "", scopeType: "", status: "", targetAudience: "",
  startDate: "", endDate: "", isActive: false,
};

function toDatetimeLocal(v: string | null | undefined) {
  if (!v) return "";
  try { return new Date(v).toISOString().slice(0, 16); } catch { return ""; }
}
function toISOOrNull(v: string) {
  if (!v) return null;
  return new Date(v).toISOString();
}

function bannerImageSrc(url?: string | null) {
  if (!url) return "";
  return resolveUploadUrl(url) || url;
}

export default function PromotionsPage() {
  const [data, setData]                 = useState<any[]>([]);
  const [analytics, setAnalytics]       = useState<Record<string, number>>({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editId, setEditId]             = useState<number | null>(null);
  const [form, setForm]                 = useState(INITIAL_FORM);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay]   = useState(false);
  const [failedMsg, setFailedMsg]       = useState("Operation failed");
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(10);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState({ key: "priority", direction: "asc" });
  const [filterState, setFilterState]   = useState<FilterState>(INITIAL_FILTERS);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [bannerUploadMode, setBannerUploadMode] = useState<'file' | 'url'>('file');

  // Refs so fetchData is stable (no deps on ever-changing state)
  const pageRef    = useRef(1);
  const limitRef   = useRef(10);
  const searchRef  = useRef("");
  const sortRef    = useRef({ key: "priority", direction: "asc" });
  const filtersRef = useRef<FilterState>(INITIAL_FILTERS);

  const showFailure = useCallback((msg: string) => {
    setFailedMsg(msg || "Operation failed");
    setFailedOverlay(true);
    setTimeout(() => setFailedOverlay(false), 2200);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await promoAPI.getAnalytics();
      if (res?.status) setAnalytics(res.data || {});
    } catch {}
  }, []);

  // Stable: reads from refs, not closure state
  const fetchData = useCallback(async (overrides: {
    page?: number; limit?: number; search?: string;
    sortBy?: string; sortDir?: string; filters?: FilterState;
  } = {}) => {
    const f = overrides.filters ?? filtersRef.current;
    try {
      setLoading(true);
      const body = {
        page:           overrides.page    ?? pageRef.current,
        limit:          overrides.limit   ?? limitRef.current,
        search:         overrides.search  ?? searchRef.current,
        sortBy:         overrides.sortBy  ?? sortRef.current.key,
        sortDir:        overrides.sortDir ?? sortRef.current.direction,
        promoType:      f.promoType,
        scopeType:      f.scopeType,
        status:         f.status,
        targetAudience: f.targetAudience,
        startDate:      f.startDate,
        endDate:        f.endDate,
        isActive:       f.isActive ? "true" : "",
      };
      const res = await promoAPI.getpromos(body);
      if (!res?.status) return showFailure(res?.message || "Failed to load promotions");
      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      showFailure(e?.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [showFailure]);

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm(INITIAL_FORM);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((row: any) => {
    setEditId(row.promo_id);
    setForm({
      ...INITIAL_FORM,
      ...row,
      promo_type:         row.promo_type || "BANNER",
      target_audience:    row.target_audience || "USER",
      target_screen:      row.target_screen || "HOME",
      mobile_image_url:   row.mobile_image_url || "",
      scope_ids:          Array.isArray(row.scope_ids) ? row.scope_ids : [],
      mobile_banner_file: null,
      start_at:           toDatetimeLocal(row.start_at),
      end_at:             toDatetimeLocal(row.end_at),
    });
    setDrawerOpen(true);
  }, []);

  const setField = useCallback((key: keyof typeof INITIAL_FORM, value: any) =>
    setForm((p) => ({ ...p, [key]: value })), []);

  const submitForm = async () => {
    if (!form.title.trim()) return showFailure("Title is required");
    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      return showFailure("End date must be after start date");
    }
    if (form.mobile_banner_file && form.mobile_banner_file.size > PROMO_BANNER_MAX_BYTES) {
      return showFailure(`Banner image must be ${PROMO_BANNER_MAX_MB} MB or smaller`);
    }
    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "mobile_banner_file") return;
        if (value === undefined || value === null) return;
        if (key === "mobile_image_url" && !String(value).trim()) return;
        if (key === "scope_ids") payload.append(key, (value as string[]).join(","));
        else if (key === "start_at" || key === "end_at") {
          const iso = toISOOrNull(value as string);
          if (iso) payload.append(key, iso);
        } else payload.append(key, String(value));
      });
      if (form.mobile_banner_file) payload.append("mobile_banner_file", form.mobile_banner_file);

      const res = editId
        ? await promoAPI.updatePromotionMultipart(editId, payload)
        : await promoAPI.createPromotionMultipart(payload);
      if (!res?.status) return showFailure(res?.message || "Save failed");

      setDrawerOpen(false);
      setEditId(null);
      setForm(INITIAL_FORM);
      setSuccessOverlay(true);
      setTimeout(() => setSuccessOverlay(false), 1400);
      fetchData();
      fetchAnalytics();
    } catch (e: any) {
      showFailure(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = useCallback(async (next: boolean, row: any) => {
    const res = await promoAPI.updatePromotion(row.promo_id, { is_active: next, is_disabled: !next });
    if (!res?.status) return showFailure(res?.message || "Status update failed");
    setData((prev) => prev.map((r) => r.promo_id === row.promo_id ? { ...r, is_active: next, is_disabled: !next } : r));
  }, [showFailure]);

  const deleteRow = useCallback(async (row: any) => {
    if (!window.confirm("Delete this promotion?")) return;
    const res = await promoAPI.deletePromotion(row.promo_id);
    if (!res?.status) return showFailure(res?.message || "Delete failed");
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics, showFailure]);

  const handleBulkAction = useCallback(async (ids: any[], action: string) => {
    const res = await promoAPI.bulkPromotionAction({ ids, action });
    if (!res?.status) return showFailure(res?.message || "Bulk action failed");
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics, showFailure]);

  const duplicateRow = useCallback(async (row: any) => {
    const res = await promoAPI.duplicatePromotion(row.promo_id);
    if (!res?.status) return showFailure(res?.message || "Duplicate failed");
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics, showFailure]);

  const reorder = useCallback(async (row: any, direction: "up" | "down") => {
    const current = Number(row.priority ?? 0);
    const next = direction === "up" ? Math.max(0, current - 1) : current + 1;
    if (next === current) return;
    const res = await promoAPI.reorderPromotions([{ id: row.promo_id, priority: next }]);
    if (!res?.status) return showFailure(res?.message || "Reorder failed");
    fetchData();
  }, [fetchData, showFailure]);

  const actions = useMemo(() => buildBulkCrudActions({
    onEdit:           openEdit,
    onActivateRow:    (row: any)    => void toggleStatus(true, row),
    onDeactivateRow:  (row: any)    => void toggleStatus(false, row),
    onBulkActivate:   (ids: any[])  => void handleBulkAction(ids, "ENABLE"),
    onBulkDeactivate: (ids: any[])  => void handleBulkAction(ids, "DISABLE"),
    onDeleteRow:      deleteRow,
    onBulkDelete:     (ids: any[])  => void handleBulkAction(ids, "DELETE"),
    extra: [{ label: "Duplicate", icon: Copy, requiredPermission: "EDIT", onClick: duplicateRow }],
  }), [openEdit, toggleStatus, deleteRow, handleBulkAction, duplicateRow]);

  const screenOptions = useMemo(() => getScreenOptions(form.target_audience), [form.target_audience]);

  // Apply filter immediately - update ref + state + trigger fetch
  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const next = { ...filtersRef.current, [key]: value };
    filtersRef.current = next;
    pageRef.current = 1;
    setFilterState(next);
    setPage(1);
    fetchData({ page: 1, filters: next });
  }, [fetchData]);

  return (
    <div className="space-y-4">

      <SuccessOverlay show={successOverlay} title="Success" subtitle="Changes saved successfully." onFinish={() => setSuccessOverlay(false)} />
      <FailedOverlay  show={failedOverlay}  title="Failed"  subtitle={failedMsg}                  onFinish={() => setFailedOverlay(false)} />

      {/* Analytics */}
      <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Active",    value: analytics.active         || 0, color: "text-[#16a34a]" },
            { label: "Scheduled", value: analytics.scheduled      || 0, color: "text-[#2563eb]" },
            { label: "Expired",   value: analytics.expired        || 0, color: "text-[#fff7ed]" },
            { label: "Global",    value: analytics.global_count   || 0, color: "text-[#4f46e5]" },
            { label: "Regional",  value: analytics.regional_count || 0, color: "text-[#9333ea]" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
              <p className="text-xs text-[#53697e]">{card.label} Promotions</p>
              <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <PaginatedTable
        title="Promotions"
        subtitle={`${total} records`}
        badge="Masters"
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={(p: number) => {
          pageRef.current = p;
          setPage(p);
          fetchData({ page: p });
        }}
        onLimitChange={(l: number) => {
          limitRef.current = l;
          pageRef.current  = 1;
          setLimit(l);
          setPage(1);
          fetchData({ page: 1, limit: l });
        }}
        onSort={(s: any) => {
          if (!s?.key) return;
          sortRef.current = s;
          setSort(s);
          fetchData({ sortBy: s.key, sortDir: s.direction || "asc" });
        }}
        onSearch={(v: string) => {
          searchRef.current = v;
          pageRef.current   = 1;
          setSearch(v);
          setPage(1);
          fetchData({ search: v, page: 1 });
        }}
        searchValue={search}
        showSearch
        showExport
        showRefresh
        onRefresh={() => fetchData()}
        showAdd={false}
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={openCreate}
            addLabel="Create Promotion"
          />
        }
        showFilter
        rowKey="promo_id"
        emptyMessage="No promotions created yet"
      >
        <Filters>
          <DropdownFilter
            value={filterState.promoType}
            onChange={(v: string) => handleFilterChange("promoType", v)}
            placeholder="All Types"
            options={TYPE_FILTER_OPTIONS}
          />
          <DropdownFilter
            value={filterState.scopeType}
            onChange={(v: string) => handleFilterChange("scopeType", v)}
            placeholder="All Scopes"
            options={SCOPE_FILTER_OPTIONS}
          />
          <DropdownFilter
            value={filterState.status}
            onChange={(v: string) => handleFilterChange("status", v)}
            placeholder="All Status"
            options={STATUS_FILTER_OPTIONS}
          />
          <DropdownFilter
            value={filterState.targetAudience}
            onChange={(v: string) => handleFilterChange("targetAudience", v)}
            placeholder="All Audiences"
            options={AUDIENCE_FILTER_OPTIONS}
          />
          <DateFilter
            value={filterState.startDate}
            onChange={(v: string) => handleFilterChange("startDate", v)}
          />
          <DateFilter
            value={filterState.endDate}
            onChange={(v: string) => handleFilterChange("endDate", v)}
          />
          <ToggleFilter
            value={filterState.isActive}
            onChange={(v: boolean) => handleFilterChange("isActive", v)}
            label="Active only"
          />
        </Filters>

        <Column header="SL" type="serial" />
        <Column header="Image" dataKey="mobile_image_url" render={(v: any) => {
          const src = bannerImageSrc(v);
          return src
            ? <img src={src} alt="banner" className="h-10 w-16 rounded-md object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <div className="flex h-10 w-16 items-center justify-center rounded-md bg-[#f1f5f9]"><ImageOff className="h-4 w-4 text-[#94a3b8]" /></div>;
        }} />
        <Column header="Title"    dataKey="title"           sortable />
        <Column header="Type"     dataKey="promo_type" />
        <Column header="Audience" dataKey="target_audience" />
        <Column header="Screen"   dataKey="target_screen" />
        <Column header="Scope"    dataKey="scope_type" />
        <Column header="Status"   dataKey="status" />
        <Column header="Active"   dataKey="is_active" type="toggle" onToggle={toggleStatus} />
        <Column header="Priority" dataKey="priority" sortable render={(value: any, row: any) => (
          <div className="flex items-center justify-center gap-1">
            <span className="min-w-[20px] text-center text-sm font-semibold">{value ?? 0}</span>
            <button type="button" onClick={() => reorder(row, "up")}   className="rounded border border-[#e2e8f0] p-1"><ArrowUp   className="h-3 w-3" /></button>
            <button type="button" onClick={() => reorder(row, "down")} className="rounded border border-[#e2e8f0] p-1"><ArrowDown className="h-3 w-3" /></button>
          </div>
        )} />
        <Column header="Action" type="actions" dataKey="_actions" actions={actions} />
      </PaginatedTable>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[120] bg-[#0f172a]/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer - always mounted for smooth slide-in animation */}
      <div className={`fixed inset-y-0 right-0 z-[121] flex flex-col w-full max-w-4xl bg-[#f8fafc] shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="relative flex items-center justify-between border-b border-[#f1f5f9] bg-[#ffffff] px-8 py-5">

          {/* Left gradient accent */}
          <div className="absolute inset-y-0 left-0 w-1 rounded-r bg-gradient-to-b from-[#eef2ff] via-[#f5f3ff] to-[#818cf8]" />

          {/* Icon + title */}
          <div className="flex items-center gap-3.5 pl-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${editId ? "bg-[#fffbeb] ring-1 ring-[#fde68a]/60" : "bg-[#6f7790] ring-1 ring-[#c7d2fe]/60"}`}>
              {editId
                ? <Pencil className="h-4.5 w-4.5 text-[#fffbeb]" />
                : <Megaphone className="h-5 w-5 text-[#4f46e5]" />
              }
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                {editId ? "Editing" : "New"}
              </p>
              <h2 className="text-[17px] font-bold leading-tight text-[#0f172a]">
                {editId ? "Edit Promotion" : "Create a Promotion"}
              </h2>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#53697e] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#334155] active:scale-[0.98]">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submitForm}
              className="flex min-w-[164px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-6 py-2 text-sm font-semibold text-[#ffffff] shadow-md shadow-[#a5b4fc]/50 transition-all hover:from-[#eef2ff] hover:to-[#f5f3ff] hover:shadow-lg hover:shadow-[#a5b4fc]/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Savingâ€¦" : editId ? "Update Promotion" : "Publish Promotion"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Input title="Promotion Title *" value={form.title}       onChange={(e: any) => setField("title",       e.target.value)} className="bg-[#ffffff]" />
            <Input title="Subtitle"          value={form.subtitle}    onChange={(e: any) => setField("subtitle",    e.target.value)} className="bg-[#ffffff]" />
            <div className="md:col-span-2">
              <Input title="Description" value={form.description} onChange={(e: any) => setField("description", e.target.value)} className="bg-[#ffffff]" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#334155]">Promotion Type</label>
              <div className="flex flex-wrap gap-3">
                {PROMOTION_TYPES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 rounded border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-sm">
                    <input type="radio" name="promo_type" checked={form.promo_type === t.id} onChange={() => setField("promo_type", t.id)} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <Select title="Audience" value={form.target_audience} options={AUDIENCE_OPTIONS} onChange={(e: any) => {
              const next = e.target.value;
              setForm((p) => ({ ...p, target_audience: next, target_screen: getScreenOptions(next)[0]?.id || "HOME" }));
            }} />
            <Select title="Target Screen" value={form.target_screen} options={screenOptions} onChange={(e: any) => setField("target_screen", e.target.value)} />
            <Select title="Target Scope"  value={form.scope_type}    options={SCOPE_TYPES}   onChange={(e: any) => setForm((p) => ({ ...p, scope_type: e.target.value, scope_ids: [] }))} />
            <div className="hidden md:block" />
            <ScopeSelector scopeType={form.scope_type} scopeIds={form.scope_ids} onChange={(ids) => setField("scope_ids", ids)} />
            <div className="md:col-span-2 space-y-3">

              {/* Label + mode dropdown */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#334155]">Mobile Banner</label>
                <div className="relative">
                  <select
                    value={bannerUploadMode}
                    onChange={(e) => {
                      setBannerUploadMode(e.target.value as 'file' | 'url');
                      setField('mobile_banner_file', null);
                      setField('mobile_image_url', '');
                    }}
                    className="appearance-none cursor-pointer rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-1.5 pl-3 pr-7 text-xs font-medium text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#eff6ff]/20 hover:bg-[#f1f5f9] transition-colors">
                    <option value="file">Upload File</option>
                    <option value="url">Image URL</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                </div>
              </div>

              {bannerUploadMode === 'file' ? (
                <FileUpload
                  title="Banner image"
                  accept="image/*"
                  maxSizeMB={PROMO_BANNER_MAX_MB}
                  value={form.mobile_banner_file}
                  onChange={(file: any) => setField('mobile_banner_file', file)}
                />
              ) : (
                /* â"€â"€ URL input â"€â"€ */
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Link2 className="h-4 w-4 text-[#94a3b8]" />
                  </div>
                  <input
                    type="url"
                    value={form.mobile_image_url}
                    onChange={(e) => setField('mobile_image_url', e.target.value)}
                    placeholder="https://cdn.example.com/banner.jpg"
                    className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#ffffff] pl-9 pr-4 text-sm text-[#334155] placeholder:text-[#94a3b8] focus:border-[#60a5fa] focus:outline-none focus:ring-2 focus:ring-[#eff6ff]/15 transition-colors"
                  />
                </div>
              )}

              {/* URL mode preview */}
              {bannerUploadMode === 'url' && form.mobile_image_url && (
                <div className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
                  <img
                    src={bannerImageSrc(form.mobile_image_url)}
                    alt="Banner preview"
                    className="h-44 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setField('mobile_image_url', '')}
                    className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#000000]/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:bg-[#000000]/70">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-[#000000]/60 to-transparent px-3 py-2">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-[#ffffff]/70" />
                    <span className="truncate text-[11px] text-[#ffffff]/80">{form.mobile_image_url}</span>
                  </div>
                </div>
              )}
            </div>
            <Input title="Priority"           type="number"         value={form.priority}   onChange={(e: any) => setField("priority", Number(e.target.value) || 0)} className="bg-[#ffffff]" />
            <Input title="Start Date & Time"  type="datetime-local" value={form.start_at}   onChange={(e: any) => setField("start_at", e.target.value)} className="bg-[#ffffff]" />
            <Input title="End Date & Time"    type="datetime-local" value={form.end_at}     onChange={(e: any) => setField("end_at",   e.target.value)} className="bg-[#ffffff]" />
            <div className="md:col-span-2 flex gap-6">
              <Toggle title="Active"    checked={form.is_active}    onChange={(v: boolean) => setField("is_active", v)} />
              <Toggle title="Scheduled" checked={form.is_scheduled} onChange={(v: boolean) => setField("is_scheduled", v)} />
              <Toggle title="Disabled"  checked={form.is_disabled}  onChange={(v: boolean) => setForm((p) => ({ ...p, is_disabled: v, is_active: !v }))} />
            </div>
          </div>
        </div>
      </div>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="promotions_template.xlsx"
        columns={["title", "subtitle", "description", "promo_type", "scope_type", "scope_ids", "target_audience", "target_screen", "mobile_image_url", "priority", "start_at", "end_at", "is_active"]}
        exampleRow={["Summer Sale", "50% Off", "Limited time offer", "BANNER", "GLOBAL", "", "USER", "HOME", "https://example.com/banner.jpg", "0", "2025-06-01T10:00", "2025-12-31T23:59", "TRUE"]}
        columnDescription="title, subtitle, description, promo_type, scope_type, scope_ids (comma-separated), target_audience, target_screen, mobile_image_url, priority, start_at, end_at (ISO or datetime), is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            promoAPI.createPromotion({
              title: r.title || "",
              subtitle: r.subtitle || "",
              description: r.description || "",
              promo_type: r.promo_type || "BANNER",
              scope_type: r.scope_type || "GLOBAL",
              scope_ids: parseCommaIds(r.scope_ids).join(","),
              target_audience: r.target_audience || "USER",
              target_screen: r.target_screen || "HOME",
              mobile_image_url: r.mobile_image_url ? String(r.mobile_image_url).trim() : "",
              priority: Number(r.priority) || 0,
              start_at: r.start_at ? toISOOrNull(String(r.start_at)) : null,
              end_at: r.end_at ? toISOOrNull(String(r.end_at)) : null,
              is_active: parseBulkIsActive(r.is_active),
            })
          );
          if (result.success > 0) {
            fetchData();
            fetchAnalytics();
          }
          return result;
        }}
      />
    </div>
  );
}

