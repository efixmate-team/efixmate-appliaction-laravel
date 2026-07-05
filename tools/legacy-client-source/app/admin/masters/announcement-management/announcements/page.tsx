"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Loader2, Bell } from "lucide-react";
import PaginatedTable, {
  Column, Filters, DropdownFilter, ToggleFilter,
} from "@/app/admin/(components)/Table";
import { buildBulkCrudActions } from "@/app/admin/(lib)/bulkCrudActions";
import { textAnnouncementAPI } from "@/lib/api";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { BulkUploadHeaderActions, parseBulkIsActive, parseCommaIds, runBulkUploadRows } from "@/app/admin/(lib)/bulkExcelUpload";
import { AUDIENCE_OPTIONS, getScreenOptions } from "../constants";
import ScopeSelector from "../ScopeSelector";

const SCOPE_TYPES = [
  { id: "GLOBAL", label: "Global" },
  { id: "COUNTRY", label: "Country" },
  { id: "STATE", label: "State" },
  { id: "CITY", label: "City" },
  { id: "AREA", label: "Area" },
];

const STATUS_OPTIONS = [
  { id: "", label: "All Status" },
  { id: "ACTIVE", label: "Active" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "EXPIRED", label: "Expired" },
  { id: "DISABLED", label: "Disabled" },
];

type AnnouncementFilterState = {
  scopeType: string;
  status: string;
  targetAudience: string;
  targetScreen: string;
  isActive: boolean;
};

const INITIAL_FILTERS: AnnouncementFilterState = {
  scopeType: "",
  status: "",
  targetAudience: "",
  targetScreen: "",
  isActive: false,
};

const SCOPE_FILTER_OPTIONS = SCOPE_TYPES.map((t) => ({ value: t.id, label: t.label }));
const STATUS_FILTER_OPTIONS = STATUS_OPTIONS.filter((o) => o.id).map((o) => ({ value: o.id, label: o.label }));
const AUDIENCE_FILTER_OPTIONS = (AUDIENCE_OPTIONS as { id: string; label: string }[]).map((a) => ({ value: a.id, label: a.label }));

const INITIAL_FORM = {
  title: "",
  message: "",
  target_audience: "USER",
  target_screen: "HOME",
  scope_type: "GLOBAL",
  scope_ids: [] as string[],
  start_at: "",
  end_at: "",
  priority: 0,
  is_active: true,
  is_scheduled: false,
  is_disabled: false,
};

function parseScopeIdsInput(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function scopeIdsToString(ids: string[] | string | null | undefined): string {
  if (!ids) return "";
  if (Array.isArray(ids)) return ids.join(", ");
  return String(ids);
}
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  try { return new Date(value).toISOString().slice(0, 16); } catch { return ""; }
}
function toISOOrNull(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [failedMsg, setFailedMsg] = useState("Operation failed");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "priority", direction: "asc" });
  const [filterState, setFilterState] = useState<AnnouncementFilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AnnouncementFilterState>(INITIAL_FILTERS);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const showFailure = useCallback((msg: string) => {
    setFailedMsg(msg || "Operation failed");
    setFailedOverlay(true);
    setTimeout(() => setFailedOverlay(false), 2200);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await textAnnouncementAPI.getAnalytics();
      if (res?.status) setAnalytics(res.data || {});
    } catch {}
  }, []);

  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const activeFilters = overrides.filters ?? appliedFilters;
      const body = {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        sortBy: overrides.sortBy ?? sort.key,
        sortDir: overrides.sortDir ?? sort.direction,
        scopeType: activeFilters.scopeType,
        status: activeFilters.status,
        targetAudience: activeFilters.targetAudience,
        targetScreen: activeFilters.targetScreen,
        isActive: activeFilters.isActive ? "true" : "",
      };
      const res = await textAnnouncementAPI.getAnnouncements(body);
      if (!res?.status) return showFailure(res?.message || "Failed to load announcements");
      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      showFailure(e?.message || "Failed to load announcements");
    } finally { setLoading(false); }
  }, [appliedFilters, page, limit, search, sort, showFailure]);

  useEffect(() => { fetchData(); fetchAnalytics(); }, [fetchData, fetchAnalytics]);

  const handleFilterChange = <K extends keyof AnnouncementFilterState>(key: K, value: AnnouncementFilterState[K]) => {
    const next = { ...filterState, [key]: value };
    setFilterState(next);
    setAppliedFilters(next);
    setPage(1);
    fetchData({ page: 1, filters: next });
  };

  const filterScreenOptions = useMemo(
    () => getScreenOptions(filterState.targetAudience || "USER").map((o) => ({ value: o.id, label: o.label })),
    [filterState.targetAudience]
  );

  const openCreate = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
    setPreviewImageUrl("");
    setDrawerVisible(true);
    requestAnimationFrame(() => setDrawerOpen(true));
  };
  const openEdit = (row: any) => {
    setEditId(row.text_announcement_id);
    setForm({
      ...INITIAL_FORM,
      ...row,
      target_audience: row.target_audience || "USER",
      target_screen: row.target_screen || "HOME",
      scope_ids: Array.isArray(row.scope_ids) ? row.scope_ids : [],
      start_at: toDatetimeLocal(row.start_at),
      end_at: toDatetimeLocal(row.end_at),
    });
    setPreviewImageUrl("");
    setDrawerVisible(true);
    requestAnimationFrame(() => setDrawerOpen(true));
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerVisible(false), 280);
  }, []);

  const setField = (key: keyof typeof INITIAL_FORM, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const submitForm = async () => {
    if (!form.title.trim()) return showFailure("Title is required");
    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      return showFailure("End date must be after start date");
    }
    try {
      setSaving(true);
      const payload: any = { ...form, scope_ids: form.scope_ids.join(",") };
      payload.start_at = toISOOrNull(form.start_at);
      payload.end_at = toISOOrNull(form.end_at);
      const res = editId
        ? await textAnnouncementAPI.updateAnnouncement(editId, payload)
        : await textAnnouncementAPI.createAnnouncement(payload);
      if (!res?.status) return showFailure(res?.message || "Save failed");
      closeDrawer();
      setEditId(null);
      setForm(INITIAL_FORM);
      setPreviewImageUrl("");
      setSuccessOverlay(true); setTimeout(() => setSuccessOverlay(false), 1400);
      fetchData(); fetchAnalytics();
    } catch (e: any) { showFailure(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (next: boolean, row: any) => {
    const res = await textAnnouncementAPI.updateAnnouncement(row.text_announcement_id, { is_active: next, is_disabled: !next });
    if (!res?.status) return showFailure(res?.message || "Status update failed");
    setData((prev) => prev.map((r) => r.text_announcement_id === row.text_announcement_id ? { ...r, is_active: next, is_disabled: !next } : r));
  };
  const deleteRow = async (row: any) => {
    if (!window.confirm("Delete this announcement?")) return;
    const res = await textAnnouncementAPI.deleteAnnouncement(row.text_announcement_id);
    if (!res?.status) return showFailure(res?.message || "Delete failed");
    fetchData(); fetchAnalytics();
  };
  const handleBulkAction = async (ids: any[], action: string) => {
    const res = await textAnnouncementAPI.bulkAction({ ids, action });
    if (!res?.status) return showFailure(res?.message || "Bulk action failed");
    fetchData(); fetchAnalytics();
  };
  const duplicateRow = async (row: any) => {
    const res = await textAnnouncementAPI.duplicateAnnouncement(row.text_announcement_id);
    if (!res?.status) return showFailure(res?.message || "Duplicate failed");
    fetchData(); fetchAnalytics();
  };
  const reorder = async (row: any, direction: "up" | "down") => {
    const current = Number(row.priority ?? 0);
    const next = direction === "up" ? Math.max(0, current - 1) : current + 1;
    if (next === current) return;
    const res = await textAnnouncementAPI.reorderAnnouncements([{ id: row.text_announcement_id, priority: next }]);
    if (!res?.status) return showFailure(res?.message || "Reorder failed");
    fetchData();
  };

  const actions = useMemo(() => buildBulkCrudActions({
    onEdit: openEdit,
    onActivateRow: (row) => void toggleStatus(true, row),
    onDeactivateRow: (row) => void toggleStatus(false, row),
    onBulkActivate: (ids) => void handleBulkAction(ids, "ENABLE"),
    onBulkDeactivate: (ids) => void handleBulkAction(ids, "DISABLE"),
    onDeleteRow: deleteRow,
    onBulkDelete: (ids) => void handleBulkAction(ids, "DELETE"),
    extra: [{ label: "Duplicate", icon: Copy, requiredPermission: "EDIT", onClick: duplicateRow }],
  }), []);

  const screenOptions = useMemo(() => getScreenOptions(form.target_audience), [form.target_audience]);

  return (
    <div className="space-y-4">

      <SuccessOverlay show={successOverlay} title="Success" subtitle="Changes saved successfully." onFinish={() => setSuccessOverlay(false)} />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle={failedMsg} onFinish={() => setFailedOverlay(false)} />

      <PaginatedTable
        title="Announcements"
        subtitle={`${total} records`}
        badge="Masters"
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); setPage(1); fetchData({ page: 1, limit: l }); }}
        onSort={(s: any) => { if (!s?.key) return; setSort(s); fetchData({ page: 1, sortBy: s.key, sortDir: s.direction || "asc" }); }}
        onSearch={(v: string) => { setSearch(v); setPage(1); fetchData({ page: 1, search: v }); }}
        searchValue={search}
        showSearch
        showExport
        showFilter
        showRefresh
        onRefresh={() => fetchData()}
        showAdd={false}
        headerActions={
          <BulkUploadHeaderActions
            onUpload={() => setOpenBulkModal(true)}
            onAdd={openCreate}
            addLabel="Create Announcement"
          />
        }
        rowKey="text_announcement_id"
        emptyMessage="No announcements created yet"
      >
        <Filters>
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
            onChange={(v: string) => {
              const next = { ...filterState, targetAudience: v, targetScreen: "" };
              setFilterState(next);
              setAppliedFilters(next);
              setPage(1);
              fetchData({ page: 1, filters: next });
            }}
            placeholder="All Audiences"
            options={AUDIENCE_FILTER_OPTIONS}
          />
          <DropdownFilter
            value={filterState.targetScreen}
            onChange={(v: string) => handleFilterChange("targetScreen", v)}
            placeholder="All Screens"
            options={filterScreenOptions}
          />
          <ToggleFilter
            value={filterState.isActive}
            onChange={(v: boolean) => handleFilterChange("isActive", v)}
            label="Active only"
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="Title" dataKey="title" sortable />
        <Column header="Message" dataKey="message" />
        <Column header="Audience" dataKey="target_audience" />
        <Column header="Screen" dataKey="target_screen" />
        <Column header="Scope" dataKey="scope_type" />
        <Column header="Status" dataKey="status" />
        <Column header="Active" dataKey="is_active" type="toggle" onToggle={toggleStatus} />
        <Column header="Priority" dataKey="priority" sortable render={(value: any, row: any) => (
          <div className="flex items-center justify-center gap-1">
            <span className="min-w-[20px] text-center text-sm font-semibold">{value ?? 0}</span>
            <button type="button" onClick={() => reorder(row, "up")} className="rounded border border-[#e2e8f0] p-1"><ArrowUp className="h-3 w-3" /></button>
            <button type="button" onClick={() => reorder(row, "down")} className="rounded border border-[#e2e8f0] p-1"><ArrowDown className="h-3 w-3" /></button>
          </div>
        )} />
        <Column header="Action" type="actions" dataKey="_actions" actions={actions} />
      </PaginatedTable>

      {drawerVisible && (
        <div
          className={`fixed inset-0 z-[120] flex justify-end backdrop-blur-sm transition-all duration-300 ease-out ${
            drawerOpen ? "bg-[#0f172a]/40 opacity-100" : "bg-[#0f172a]/0 opacity-0"
          }`}
          onClick={closeDrawer}
        >
          <div
            className={`flex h-full w-full max-w-3xl flex-col bg-[#f8fafc] shadow-2xl transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b bg-[#ffffff] px-8 py-5">
              <h2 className="text-xl font-semibold text-[#0f172a]">{editId ? "Edit Announcement" : "New Announcement"}</h2>
              <div className="flex items-center gap-3">
                <button type="button" onClick={closeDrawer} className="rounded-lg px-4 py-2 text-sm font-medium text-[#475569]">Cancel</button>
                <button type="button" disabled={saving} onClick={submitForm} className="flex items-center gap-2 rounded-lg bg-[#4f46e5] px-6 py-2 text-sm font-semibold text-[#ffffff] disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Savingï¿½" : editId ? "Update Announcement" : "Publish Announcement"}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <Input title="Title *" value={form.title} onChange={(e: any) => setField("title", e.target.value)} className="bg-[#ffffff]" />
                <Select title="Audience" value={form.target_audience} options={AUDIENCE_OPTIONS} onChange={(e: any) => { const next = e.target.value; setForm((p) => ({ ...p, target_audience: next, target_screen: getScreenOptions(next)[0]?.id || "HOME" })); }} />
                <Select title="Target Screen" value={form.target_screen} options={screenOptions} onChange={(e: any) => setField("target_screen", e.target.value)} />
                <Select
                  title="Scope"
                  value={form.scope_type}
                  options={SCOPE_TYPES}
                  onChange={(e: any) => setForm((p) => ({ ...p, scope_type: e.target.value, scope_ids: [] }))}
                />
                <ScopeSelector
                  scopeType={form.scope_type}
                  scopeIds={form.scope_ids}
                  onChange={(ids) => setField("scope_ids", ids)}
                />
                <Input title="Priority" type="number" value={form.priority} onChange={(e: any) => setField("priority", Number(e.target.value) || 0)} className="bg-[#ffffff]" />
                <Input title="Start Date & Time" type="datetime-local" value={form.start_at} onChange={(e: any) => setField("start_at", e.target.value)} className="bg-[#ffffff]" />
                <Input title="End Date & Time" type="datetime-local" value={form.end_at} onChange={(e: any) => setField("end_at", e.target.value)} className="bg-[#ffffff]" />
                <div className="md:col-span-2">
                  <Input
                    title="Preview Image URL (optional)"
                    value={previewImageUrl}
                    onChange={(e: any) => setPreviewImageUrl(e.target.value)}
                    className="bg-[#ffffff]"
                    placeholder="https://example.com/banner.jpg"
                  />
                  {previewImageUrl.trim() && (
                    <div className="mt-2 rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-2">
                      <img
                        src={previewImageUrl}
                        alt="Announcement preview"
                        className="h-36 w-full rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#334155]">Message</label>
                  <textarea value={form.message} onChange={(e) => setField("message", e.target.value)} className="h-28 w-full rounded-lg border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#818cf8]" placeholder="Enter announcement message" />
                </div>
                <div className="md:col-span-2 flex gap-6">
                  <Toggle title="Active" checked={form.is_active} onChange={(v: boolean) => setField("is_active", v)} />
                  <Toggle title="Scheduled" checked={form.is_scheduled} onChange={(v: boolean) => setField("is_scheduled", v)} />
                  <Toggle title="Disabled" checked={form.is_disabled} onChange={(v: boolean) => setForm((p) => ({ ...p, is_disabled: v, is_active: !v }))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="announcements_template.xlsx"
        columns={["title", "message", "target_audience", "target_screen", "scope_type", "scope_ids", "priority", "start_at", "end_at", "is_active"]}
        exampleRow={["Welcome", "Hello world", "USER", "HOME", "GLOBAL", "", "0", "2025-06-01T10:00", "2025-12-31T23:59", "TRUE"]}
        columnDescription="title, message, target_audience, target_screen, scope_type, scope_ids (comma-separated), priority, start_at, end_at (ISO or datetime), is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const result = await runBulkUploadRows(rows, (r) =>
            textAnnouncementAPI.createAnnouncement({
              title: r.title || "",
              message: r.message || "",
              target_audience: r.target_audience || "USER",
              target_screen: r.target_screen || "HOME",
              scope_type: r.scope_type || "GLOBAL",
              scope_ids: parseCommaIds(r.scope_ids).join(","),
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

