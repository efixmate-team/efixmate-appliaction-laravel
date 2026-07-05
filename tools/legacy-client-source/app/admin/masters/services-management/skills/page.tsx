"use client";

import { useState, useCallback, useEffect } from "react";
import { BadgeAlert } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { adminAPI, masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import { useClientActiveFilter } from "@/app/admin/(lib)/tableFilters";

type Category = { category_id: number; category_name: string };
type Service  = { service_id: number; service: string; category_id: number };

export default function SkillsPage() {
  const [data, setData]   = useState<any[]>([]);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay,  setFailedOverlay]  = useState(false);
  const [failedMsg, setFailedMsg] = useState("Unable to save changes.");

  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordId, setToggleRecordId] = useState<any>(null);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm,   setOpenEditForm]   = useState(false);
  const [editRow,    setEditRow]    = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    skillName: "", categoryId: "", description: "", skillColor: "#2563eb", orderSeq: "0",
  });
  const [createServiceIds, setCreateServiceIds] = useState<number[]>([]);

  const [editForm, setEditForm] = useState({
    skillName: "", categoryId: "", description: "", skillColor: "#2563eb", orderSeq: "0", is_active: true,
  });
  const [editServiceIds, setEditServiceIds] = useState<number[]>([]);

  // ─── bootstrap data ────────────────────────────────────────────────────────

  useEffect(() => {
    masterAPI.getServiceCategories({ limit: 200 }).then((res: any) => {
      if (res?.data) setCategories(res.data);
    }).catch(() => {});
    masterAPI.getServices({ limit: 500 }).then((res: any) => {
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAllServices(rows.map((s: any) => ({ service_id: s.service_id, service: s.service ?? s.title ?? "", category_id: s.category_id })));
    }).catch(() => {});
  }, []);

  // ─── fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (overrides: any = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getSkills({
        page:   overrides.page   ?? page,
        limit:  overrides.limit  ?? limit,
        search: overrides.search ?? search,
      });
      if (res?.status && res.data) { setData(res.data); setTotal(res.total ?? res.data.length); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search]);

  const { displayData, tableFilters } = useClientActiveFilter(data);

  useEffect(() => { fetchData(); }, []);

  // ─── overlays ──────────────────────────────────────────────────────────────

  const showFailed  = (msg: string) => { setFailedMsg(msg); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); };
  const showSuccess = (cb?: () => void) => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); cb?.(); fetchData(); }, 1800); };

  // ─── toggle active ─────────────────────────────────────────────────────────

  const handleToggle = async (newValue: boolean, row: any) => {
    if (newValue) {
      await adminAPI.toggleSkill({ skillId: row.skill_id, isActive: true });
      fetchData();
    } else {
      setToggleRecordId(row.skill_id);
      setOpenDeactivateModal(true);
    }
  };

  const deactivateRecord = async () => {
    await adminAPI.toggleSkill({ skillId: toggleRecordId, isActive: false });
    setOpenDeactivateModal(false);
    fetchData();
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => adminAPI.toggleSkill({ skillId: id, isActive: data.is_active }),
    { onSuccess: () => showSuccess(), onError: () => showFailed("Bulk update failed") }
  );

  // ─── create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.skillName.trim() || !createForm.categoryId) {
      showFailed("Skill name and category are required."); return;
    }
    try {
      const res = await adminAPI.createSkill({
        skillName:   createForm.skillName.trim(),
        categoryId:  Number(createForm.categoryId),
        description: createForm.description,
        skillColor:  createForm.skillColor,
        orderSeq:    Number(createForm.orderSeq || 0),
      });
      if (!res?.status) { showFailed(res?.message ?? "Failed to create skill"); return; }
      // map services if any selected
      if (createServiceIds.length > 0) {
        await adminAPI.setSkillServices({ skillId: res.data.skill_id, serviceIds: createServiceIds });
      }
      showSuccess(() => {
        setOpenCreateForm(false);
        setCreateForm({ skillName: "", categoryId: "", description: "", skillColor: "#2563eb", orderSeq: "0" });
        setCreateServiceIds([]);
      });
    } catch (e: any) { showFailed(e.message); }
  };

  // ─── edit ──────────────────────────────────────────────────────────────────

  const handleEdit = async (row: any) => {
    setEditRow(row);
    setEditForm({
      skillName:   row.skill_name,
      categoryId:  String(row.category_id),
      description: row.description ?? "",
      skillColor:  row.skill_color ?? "#2563eb",
      orderSeq:    String(row.order_seq ?? 0),
      is_active:   row.is_active,
    });
    // load mapped services
    try {
      const res = await adminAPI.getSkillServices({ skillId: row.skill_id });
      const mapped: Service[] = Array.isArray(res?.data) ? res.data : [];
      setEditServiceIds(mapped.map((s) => s.service_id));
    } catch { setEditServiceIds([]); }
    setOpenEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.skillName.trim() || !editForm.categoryId) {
      showFailed("Skill name and category are required."); return;
    }
    setEditLoading(true);
    try {
      const res = await adminAPI.updateSkill({
        skillId:     editRow.skill_id,
        skillName:   editForm.skillName.trim(),
        categoryId:  Number(editForm.categoryId),
        description: editForm.description,
        skillColor:  editForm.skillColor,
        orderSeq:    Number(editForm.orderSeq || 0),
      });
      if (!res?.status) { showFailed(res?.message ?? "Failed"); return; }
      await adminAPI.setSkillServices({ skillId: editRow.skill_id, serviceIds: editServiceIds });
      showSuccess(() => { setOpenEditForm(false); setEditRow(null); });
    } catch (e: any) { showFailed(e.message); }
    finally { setEditLoading(false); }
  };

  // ─── service multi-select ──────────────────────────────────────────────────

  const ServicesChecklist = ({
    selectedIds, onChange, filterCategoryId,
  }: { selectedIds: number[]; onChange: (ids: number[]) => void; filterCategoryId?: number }) => {
    const filtered = filterCategoryId
      ? allServices.filter((s) => s.category_id === filterCategoryId)
      : allServices;

    if (!filtered.length) return (
      <p className="text-[12px] text-[#94a3b8]">No services found{filterCategoryId ? " for this category" : ""}.</p>
    );

    const toggle = (id: number) => {
      onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    };

    return (
      <div className="max-h-48 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2 flex flex-col gap-1">
        {filtered.map((s) => (
          <label key={s.service_id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(s.service_id)}
              onChange={() => toggle(s.service_id)}
              className="accent-[#2563eb] h-4 w-4 rounded"
            />
            <span className="text-[13px] text-[#0f172a]">{s.service}</span>
          </label>
        ))}
      </div>
    );
  };

  // ─── category select helper ────────────────────────────────────────────────

  const CategorySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#0f172a]">Category <span className="text-red-500">*</span></label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#eff6ff]"
      >
        <option value="">Select category…</option>
        {categories.map((c) => (
          <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
        ))}
      </select>
    </div>
  );

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Skill saved." />
      <FailedOverlay  show={failedOverlay}  title="Failed"  subtitle={failedMsg}       onFinish={() => setFailedOverlay(false)} />

      {/* ── CREATE FORM ── */}
      <Form
        showMe={openCreateForm} cols={2} card
        title="Add Skill" subtitle="Create a new technician skill"
        onSubmit={handleCreate}
        onReset={() => { setOpenCreateForm(false); setCreateForm({ skillName: "", categoryId: "", description: "", skillColor: "#2563eb", orderSeq: "0" }); setCreateServiceIds([]); }}
        submitLabel="Create Skill" showReset loading={false}
      >
        <Input
          name="skillName" title="Skill Name" required
          value={createForm.skillName}
          onChange={(e: any) => setCreateForm(p => ({ ...p, skillName: e.target.value }))}
        />
        <Input
          name="orderSeq" title="Order" type="number"
          value={createForm.orderSeq}
          onChange={(e: any) => setCreateForm(p => ({ ...p, orderSeq: e.target.value }))}
        />
        <CategorySelect value={createForm.categoryId} onChange={(v) => setCreateForm(p => ({ ...p, categoryId: v }))} />
        <Input
          name="skillColor" title="Color" type="color"
          value={createForm.skillColor}
          onChange={(e: any) => setCreateForm(p => ({ ...p, skillColor: e.target.value }))}
        />
        <Input
          name="description" title="Description"
          value={createForm.description}
          onChange={(e: any) => setCreateForm(p => ({ ...p, description: e.target.value }))}
        />
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#0f172a]">
            Linked Services
            <span className="ml-2 text-[11px] text-[#64748b] font-normal">({createServiceIds.length} selected)</span>
          </label>
          <ServicesChecklist
            selectedIds={createServiceIds}
            onChange={setCreateServiceIds}
            filterCategoryId={createForm.categoryId ? Number(createForm.categoryId) : undefined}
          />
        </div>
      </Form>

      {/* ── EDIT FORM ── */}
      {editRow && (
        <Form
          showMe={openEditForm} cols={2} card
          title="Edit Skill" subtitle={`Editing: ${editRow.skill_name}`}
          onSubmit={handleSaveEdit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <Input
            name="skillName" title="Skill Name" required
            value={editForm.skillName}
            onChange={(e: any) => setEditForm(p => ({ ...p, skillName: e.target.value }))}
          />
          <Input
            name="orderSeq" title="Order" type="number"
            value={editForm.orderSeq}
            onChange={(e: any) => setEditForm(p => ({ ...p, orderSeq: e.target.value }))}
          />
          <CategorySelect value={editForm.categoryId} onChange={(v) => setEditForm(p => ({ ...p, categoryId: v }))} />
          <Input
            name="skillColor" title="Color" type="color"
            value={editForm.skillColor}
            onChange={(e: any) => setEditForm(p => ({ ...p, skillColor: e.target.value }))}
          />
          <Input
            name="description" title="Description"
            value={editForm.description}
            onChange={(e: any) => setEditForm(p => ({ ...p, description: e.target.value }))}
          />
          <Toggle
            name="is_active" title="Status"
            checked={editForm.is_active}
            onChange={(v: any) => setEditForm(p => ({ ...p, is_active: v }))}
          />
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#0f172a]">
              Linked Services
              <span className="ml-2 text-[11px] text-[#64748b] font-normal">({editServiceIds.length} selected)</span>
            </label>
            <ServicesChecklist
              selectedIds={editServiceIds}
              onChange={setEditServiceIds}
              filterCategoryId={editForm.categoryId ? Number(editForm.categoryId) : undefined}
            />
          </div>
        </Form>
      )}

      {/* ── TABLE ── */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Skills" badge="Masters" subtitle={`${total} skills found`}
        data={displayData} total={total} loading={loading} page={page} limit={limit}
        showFilter filters={tableFilters}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}}
        onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="skill_id"
        headerActions={
          <button
            onClick={() => setOpenCreateForm(true)}
            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition"
          >
            + Add Skill
          </button>
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Skill Name" dataKey="skill_name" sortable />
        <Column header="Category"   dataKey="category_name" />
        <Column
          header="Color"
          dataKey="skill_color"
          render={(val) => {
            const hex = String(val ?? "").trim();
            if (!hex) return <span className="text-[12px] text-[#94a3b8]">—</span>;
            return (
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded border border-[#e2e8f0] shrink-0" style={{ backgroundColor: hex }} />
                <span className="text-[11px] font-mono text-[#475569]">{hex}</span>
              </div>
            );
          }}
        />
        <Column header="Order"       dataKey="order_seq" />
        <Column header="Description" dataKey="description" />
        <Column header="Status"      dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={buildBulkCrudActions({
            onEdit: handleEdit,
            onActivateRow:   (row) => { void handleToggle(true,  row); },
            onDeactivateRow: (row) => { void handleToggle(false, row); },
            onBulkActivate:   handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
          })}
        />
      </PaginatedTable>

      {/* ── DEACTIVATE MODAL ── */}
      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-white rounded-2xl w-full max-w-sm mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#dc2626]" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-center">Deactivate Skill?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center">This skill will be hidden from technician profiles.</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#dc2626] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
