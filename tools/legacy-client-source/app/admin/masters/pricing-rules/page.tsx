"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, TrendingUp } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import { activeOnlyToggleFilter } from "@/app/admin/(lib)/tableFilters";

type PricingRule = {
  rule_id: number;
  rule_name: string;
  service_id: number | null;
  area_id: number | null;
  price: string | null;
  discount_type: string | null;
  discount_value: string | null;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  is_active: boolean;
  rule_type: string;
  adjustment_mode: string;
  adjustment_value: string | null;
  service_name?: string;
  area_name?: string;
};

type RuleFormState = {
  rule_name: string;
  service_id: string;
  area_id: string;
  price: string;
  discount_type: string;
  discount_value: string;
  start_date: string;
  end_date: string;
  priority: string;
  is_active: boolean;
};

const EMPTY_FORM: RuleFormState = {
  rule_name: "",
  service_id: "",
  area_id: "",
  price: "",
  discount_type: "",
  discount_value: "",
  start_date: "",
  end_date: "",
  priority: "0",
  is_active: true,
};

const DISCOUNT_TYPES = [
  { id: "", label: "None", value: "" },
  { id: "percentage", label: "Percentage", value: "percentage" },
  { id: "fixed", label: "Fixed amount", value: "fixed" },
];

function buildPayload(form: RuleFormState) {
  return {
    ruleName: form.rule_name,
    serviceId: form.service_id ? Number(form.service_id) : null,
    areaId: form.area_id ? Number(form.area_id) : null,
    price: form.price ? Number(form.price) : null,
    discountType: form.discount_type || null,
    discountValue: form.discount_value ? Number(form.discount_value) : null,
    startDate: form.start_date || null,
    endDate: form.end_date || null,
    priority: Number(form.priority) || 0,
    isActive: form.is_active,
  };
}

function rowToForm(row: PricingRule): RuleFormState {
  return {
    rule_name: row.rule_name,
    service_id: row.service_id ? String(row.service_id) : "",
    area_id: row.area_id ? String(row.area_id) : "",
    price: row.price ?? "",
    discount_type: row.discount_type ?? "",
    discount_value: row.discount_value ?? "",
    start_date: row.start_date ? row.start_date.slice(0, 10) : "",
    end_date: row.end_date ? row.end_date.slice(0, 10) : "",
    priority: String(row.priority ?? 0),
    is_active: row.is_active !== false,
  };
}

function PricingRuleFormFields({
  form,
  setForm,
  serviceOptions,
  areaOptions,
  prefix,
}: {
  form: RuleFormState;
  setForm: React.Dispatch<React.SetStateAction<RuleFormState>>;
  serviceOptions: { id: string; label: string; value: string }[];
  areaOptions: { id: string; label: string; value: string }[];
  prefix: string;
}) {
  return (
    <>
      <Input
        name={`${prefix}_rule_name`}
        title="Rule name"
        required
        value={form.rule_name}
        onChange={(e) => setForm((f) => ({ ...f, rule_name: e.target.value }))}
      />
      <Select
        name={`${prefix}_service_id`}
        title="Service"
        required
        options={serviceOptions}
        value={form.service_id}
        onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
      />
      <Select
        name={`${prefix}_area_id`}
        title="Area"
        placeholder="Global (no area)"
        options={areaOptions}
        value={form.area_id}
        onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
      />
      <Input
        name={`${prefix}_price`}
        title="Amount"
        type="number"
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        placeholder="Override amount"
      />
      <Select
        name={`${prefix}_discount_type`}
        title="Discount type"
        options={DISCOUNT_TYPES}
        value={form.discount_type}
        onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
      />
      <Input
        name={`${prefix}_discount_value`}
        title="Discount value"
        type="number"
        value={form.discount_value}
        onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
        placeholder="e.g. 10 for 10% or â‚¹10"
      />
      <Input
        name={`${prefix}_start_date`}
        title="Start date"
        type="date"
        value={form.start_date}
        onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
      />
      <Input
        name={`${prefix}_end_date`}
        title="End date"
        type="date"
        value={form.end_date}
        onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
      />
      <Input
        name={`${prefix}_priority`}
        title="Priority (lower = higher priority)"
        type="number"
        value={form.priority}
        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
      />
    </>
  );
}

export default function PricingRulesPage() {
  const [rows, setRows] = useState<PricingRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const [areas, setAreas] = useState<{ value: string; label: string }[]>([]);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<PricingRule | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [createForm, setCreateForm] = useState<RuleFormState>({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState<RuleFormState>({ ...EMPTY_FORM });

  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordId, setToggleRecordId] = useState<number | null>(null);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [failedMsg, setFailedMsg] = useState("Unable to save pricing rule.");

  const fetchRules = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      try {
        const res = await adminOperationalAPI.pricing.rules({
          page: overrides.page ?? page,
          limit: overrides.limit ?? limit,
          search: overrides.search ?? search,
        });
        if (res.status) {
          const data = (res.data || []) as PricingRule[];
          const sorted = [...data].sort(
            (a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
          );
          setRows(sorted);
          setTotal(res.pagination?.total || 0);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search]
  );

  useEffect(() => {
    void fetchRules();
  }, []);

  useEffect(() => {
    Promise.all([masterAPI.getServices({}), masterAPI.getAreas({})]).then(([sRes, aRes]) => {
      if (sRes.status && sRes.data) {
        setServices(
          (sRes.data as { service_id: number; service?: string; service_name?: string; name?: string }[]).map(
            (s) => ({
              value: String(s.service_id),
              label: s.service || s.service_name || s.name || `Service #${s.service_id}`,
            })
          )
        );
      }
      if (aRes.status && aRes.data) {
        setAreas(
          (aRes.data as { area_id: number; area_name: string }[]).map((a) => ({
            value: String(a.area_id),
            label: a.area_name,
          }))
        );
      }
    });
  }, []);

  const serviceOptions = useMemo(
    () => services.map((s) => ({ id: s.value, label: s.label, value: s.value })),
    [services]
  );
  const areaOptions = useMemo(
    () => [
      { id: "", label: "Global (no area)", value: "" },
      ...areas.map((a) => ({ id: a.value, label: a.label, value: a.value })),
    ],
    [areas]
  );

  const displayData = useMemo(() => {
    if (!filterActiveOnly) return rows;
    return rows.filter((r) => r.is_active !== false);
  }, [rows, filterActiveOnly]);

  const tableFilters = useMemo(
    () => [activeOnlyToggleFilter(filterActiveOnly, setFilterActiveOnly)],
    [filterActiveOnly]
  );

  const showFailed = (msg: string) => {
    setFailedMsg(msg);
    setFailedOverlay(true);
    setTimeout(() => setFailedOverlay(false), 3000);
  };

  const patchRuleActive = (id: number, isActive: boolean) =>
    adminOperationalAPI.pricing.toggleRule({ ruleId: id, isActive });

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => patchRuleActive(id, data.is_active),
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          void fetchRules();
        }, 1500);
      },
      onError: () => showFailed("Unable to update status."),
    }
  );

  const handleToggle = async (newValue: boolean, row: PricingRule) => {
    try {
      if (newValue) {
        const res = await patchRuleActive(row.rule_id, true);
        if (res.status) void fetchRules();
        else showFailed(res.message || "Failed to activate.");
      } else {
        setToggleRecordId(row.rule_id);
        setOpenDeactivateModal(true);
      }
    } catch {
      showFailed("Unable to update status.");
    }
  };

  const deactivateRecord = async () => {
    if (toggleRecordId == null) return;
    try {
      const res = await patchRuleActive(toggleRecordId, false);
      setOpenDeactivateModal(false);
      if (res.status) void fetchRules();
      else showFailed(res.message || "Failed to deactivate.");
    } catch {
      showFailed("Failed to deactivate.");
    }
  };

  const resetCreateForm = () => setCreateForm({ ...EMPTY_FORM });

  const handleCreateSubmit = async () => {
    if (!createForm.rule_name.trim()) {
      showFailed("Rule name is required.");
      return;
    }
    if (!createForm.service_id) {
      showFailed("Please select a service.");
      return;
    }
    try {
      const res = await adminOperationalAPI.pricing.createRule(buildPayload(createForm));
      if (res.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenCreateForm(false);
          resetCreateForm();
          void fetchRules();
        }, 1800);
      } else {
        showFailed(res.message || "Failed to create pricing rule.");
      }
    } catch {
      showFailed("Failed to create pricing rule.");
    }
  };

  const handleEdit = (row: PricingRule) => {
    setEditRow(row);
    setEditForm(rowToForm(row));
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editRow) return;
    if (!editForm.rule_name.trim()) {
      showFailed("Rule name is required.");
      return;
    }
    if (!editForm.service_id) {
      showFailed("Please select a service.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await adminOperationalAPI.pricing.updateRule({
        ruleId: editRow.rule_id,
        ...buildPayload(editForm),
      });
      if (res.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenEditForm(false);
          setEditRow(null);
          void fetchRules();
        }, 1800);
      } else {
        showFailed(res.message || "Failed to update pricing rule.");
      }
    } catch {
      showFailed("Failed to update pricing rule.");
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
        subtitle="Pricing rule saved."
      />
      <FailedOverlay
        show={failedOverlay}
        onFinish={() => setFailedOverlay(false)}
        title="Failed"
        subtitle={failedMsg}
      />

      <Form
        showMe={openCreateForm}
        cols={2}
        card
        title="Add Pricing Rule"
        subtitle="Create a new service or area price override"
        onSubmit={handleCreateSubmit}
        onReset={() => {
          setOpenCreateForm(false);
          resetCreateForm();
        }}
        submitLabel="Create"
        showReset
        loading={false}
      >
        <PricingRuleFormFields
          form={createForm}
          setForm={setCreateForm}
          serviceOptions={serviceOptions}
          areaOptions={areaOptions}
          prefix="create"
        />
        <Toggle
          name="create_is_active"
          title="Status"
          checked={createForm.is_active}
          onChange={(v) => setCreateForm((f) => ({ ...f, is_active: v }))}
        />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2}
          card
          title="Edit Pricing Rule"
          subtitle={`Editing: ${editRow.rule_name}`}
          onSubmit={handleUpdateSubmit}
          onReset={() => {
            setOpenEditForm(false);
            setEditRow(null);
          }}
          submitLabel="Save Changes"
          showReset
          loading={editLoading}
        >
          <PricingRuleFormFields
            form={editForm}
            setForm={setEditForm}
            serviceOptions={serviceOptions}
            areaOptions={areaOptions}
            prefix="edit"
          />
          <Toggle
            name="edit_is_active"
            title="Status"
            checked={editForm.is_active}
            onChange={(v) => setEditForm((f) => ({ ...f, is_active: v }))}
          />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Pricing Rules"
        badge="Masters"
        subtitle={`${total} records found`}
        data={displayData}
        total={filterActiveOnly ? displayData.length : total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={(p) => {
          setPage(p);
          void fetchRules({ page: p });
        }}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
          void fetchRules({ limit: l, page: 1 });
        }}
        onSort={() => {}}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
          void fetchRules({ search: v, page: 1 });
        }}
        searchValue={search}
        showSearch
        showFilter
        filters={tableFilters}
        showExport
        showRefresh
        showAdd={false}
        onRefresh={() => void fetchRules()}
        rowKey="rule_id"
        searchPlaceholder="Search rule nameâ€¦"
        headerActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setOpenCreateForm(true);
              }}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>
        }
      >
        <Column header="SL" type="serial" />
        <Column header="Rule Name" dataKey="rule_name" sortable />
        <Column header="Service" dataKey="service_name" />
        <Column
          header="Area"
          dataKey="area_name"
          render={(v) => v ?? <span className="text-[#5c6a7f] text-xs">Global</span>}
        />
        <Column header="Amount" dataKey="price" />
        <Column
          header="Discount"
          render={(_v, row: PricingRule) =>
            row.discount_value ? (
              `${row.discount_value}${row.discount_type === "percentage" ? "%" : " â‚¹"}`
            ) : (
              <span className="text-[#5c6a7f] text-xs">-</span>
            )
          }
        />
        <Column
          header="Validity"
          render={(_v, row: PricingRule) => {
            if (!row.start_date && !row.end_date) {
              return <span className="text-[#5c6a7f] text-xs">Always</span>;
            }
            const s = row.start_date
              ? new Date(row.start_date).toLocaleDateString("en-IN")
              : "âˆž";
            const e = row.end_date
              ? new Date(row.end_date).toLocaleDateString("en-IN")
              : "âˆž";
            return (
              <span className="text-xs">
                {s} â†' {e}
              </span>
            );
          }}
        />
        <Column header="Priority" dataKey="priority" />
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
              onClick={() => void deactivateRecord()}
              className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]"
            >
              Deactivate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

