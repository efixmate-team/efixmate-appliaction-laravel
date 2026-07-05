"use client";

import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from "react";
import { Trash2, FileSpreadsheet, Plus, Globe } from "lucide-react";
import PaginatedTable, { Column, Filters, ToggleFilter } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { lookupAPI, masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import AsyncSelect from '@/app/admin/(components)/Forms/AsyncSelect';
import MultiSelect from '@/app/admin/(components)/Forms/MultiSelect';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import BulkUploadModal from "@/app/admin/(components)/BulkUploadModal";
import { parseCommaIdsAsNumbers } from "@/app/admin/(lib)/bulkExcelUpload";

type SelectOption = {
  key: string;
  value: string;
};

type CountryFormState = {
  country_name: string;
  country_code: string;
  dial_code: string;
  currency_id: string;
  timezone_ids: string[];
  language_ids: string[];
  is_active: boolean;
};

type CountryRow = CountryFormState & {
  country_id: number;
  id?: number;
  currency_name?: string;
  timezone_id?: number | string | null;
  language_id?: number | string | null;
  timezone_name?: string;
  language_name?: string;
};

type LookupTimezone = {
  timezone_id: number | string;
  timezone_name: string;
  utc_offset?: string | null;
};

type LookupLanguage = {
  language_id: number | string;
  language_name: string;
};

export default function CountriesPage() {
  const [data, setData] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>([]);
  const [languageOptions, setLanguageOptions] = useState<SelectOption[]>([]);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<CountryRow | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const initialFormState: CountryFormState = {
    country_name: "",
    country_code: "",
    dial_code: "",
    currency_id: "",
    timezone_ids: [] as string[],
    language_ids: [] as string[],
    is_active: false,
  };

  const [createForm, setCreateForm] = useState(initialFormState);
  const [editForm, setEditForm] = useState(initialFormState);

  const fetchData = useCallback(async (overrides: Partial<{ page: number; limit: number; search: string; is_active?: boolean }> = {}) => {
    try {
      setLoading(true);
      const onlyActive = overrides.is_active ?? (activeOnly ? true : undefined);
      const res = await masterAPI.getCountries({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(onlyActive ? { is_active: true } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      console.error("[fetchData Error]:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let mounted = true;

    const fetchMultiSelectOptions = async () => {
      try {
        const [timezoneRes, languageRes] = await Promise.all([
          lookupAPI.getTimezones({ limit: "all" }),
          lookupAPI.getLanguages({ limit: "all" }),
        ]);

        if (!mounted) return;

        if (timezoneRes.status && timezoneRes.data) {
          setTimezoneOptions(timezoneRes.data.map((item: LookupTimezone) => ({
            key: String(item.timezone_id),
            value: item.utc_offset
              ? `${item.timezone_name} (${item.utc_offset})`
              : item.timezone_name,
          })));
        }

        if (languageRes.status && languageRes.data) {
          setLanguageOptions(languageRes.data.map((item: LookupLanguage) => ({
            key: String(item.language_id),
            value: item.language_name,
          })));
        }
      } catch (err) {
        console.error("[fetchMultiSelectOptions Error]:", err);
      }
    };

    fetchMultiSelectOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = useCallback(async (newValue: boolean, row: CountryRow) => {
    try {
      await masterAPI.updateCountry(row.country_id, { is_active: newValue });
      fetchData();
    } catch { }
  }, [fetchData]);

  const { handleBulkActivate, handleBulkDeactivate } = useMemo(() => makeIsActiveBulkHandlers(
    (id, data) => masterAPI.updateCountry(id, data),
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
  ), [fetchData]);

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => masterAPI.deleteCountry(id)));
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
    } catch {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  }, [fetchData]);

  const handleDelete = useCallback((row: CountryRow) => {
    setDeleteId(row.country_id);
    setOpenDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    try {
      await masterAPI.deleteCountry(deleteId);
      setOpenDeleteModal(false);
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
    } catch {
      setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleEdit = useCallback((row: CountryRow) => {
    const toStringArray = (value: unknown, fallback: unknown) => {
      const raw = Array.isArray(value) ? value : value ? [value] : fallback ? [fallback] : [];
      return raw.map((item) => String(item));
    };

    setEditRow(row);
    setEditForm({
      country_name: row.country_name || "",
      country_code: row.country_code || "",
      dial_code: row.dial_code || "",
      currency_id: row.currency_id ? String(row.currency_id) : "",
      timezone_ids: toStringArray(row.timezone_ids, row.timezone_id),
      language_ids: toStringArray(row.language_ids, row.language_id),
      is_active: row.is_active ?? false,
    });
    setOpenEditForm(true);
  }, []);

  const handleCreateSubmit = async (values: CountryFormState) => {
    const payload = {
      country_name: values.country_name,
      country_code: values.country_code,
      dial_code: values.dial_code,
      currency_id: createForm.currency_id ? parseInt(createForm.currency_id, 10) : null,
      timezone_ids: createForm.timezone_ids.map((id) => parseInt(id, 10)),
      language_ids: createForm.language_ids.map((id) => parseInt(id, 10)),
      is_active: values.is_active,
    };
    const response = await masterAPI.createCountry(payload);
    if (response && response.status) {
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); setOpenCreateForm(false); setCreateForm(initialFormState); fetchData(); }, 2000);
    } else {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      if (!editRow) {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
        return;
      }

      const payload = {
        ...editForm,
        currency_id: editForm.currency_id ? parseInt(editForm.currency_id, 10) : null,
        timezone_ids: editForm.timezone_ids.map((id) => parseInt(id, 10)),
        language_ids: editForm.language_ids.map((id) => parseInt(id, 10)),
      };
      const response = await masterAPI.updateCountry(editRow.country_id, payload);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false); setOpenEditForm(false); setEditRow(null); fetchData();
        }, 2000);
      } else {
        setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); }
    finally { setEditLoading(false); }
  };

  const tableActions = useMemo(() => buildBulkCrudActions({
    onEdit: handleEdit,
    onActivateRow: (row) => { void handleToggle(true, row); },
    onDeactivateRow: (row) => { void handleToggle(false, row); },
    onBulkActivate: handleBulkActivate,
    onBulkDeactivate: handleBulkDeactivate,
    onDeleteRow: handleDelete,
    onBulkDelete: handleBulkDelete,
  }), [handleEdit, handleToggle, handleBulkActivate, handleBulkDeactivate, handleDelete, handleBulkDelete]);

  // â"€â"€ TABLE HANDLERS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handlePageChange = (p: number) => setPage(p);
  const handleLimitChange = (l: number) => { setLimit(l); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to save changes." onFinish={() => setFailedOverlay(false)} />

      <Form
        showMe={openCreateForm}
        cols={2} card title="Add Countries" subtitle="Create a new entry"
        onSubmit={async (formData, values) => {
          await handleCreateSubmit(values as CountryFormState);
        }}
        onReset={() => { setOpenCreateForm(false); setCreateForm(initialFormState); }}
        submitLabel="Create" showReset loading={false}
      >
        <Input name="country_name" title="Country Name" required />
        <div className="flex gap-4">
          <Input name="country_code" title="Country Code" required className="flex-1" />
          <Input name="dial_code" title="Dial Code" required className="flex-1" />
        </div>
        <div className="flex gap-4">
          <AsyncSelect
            name="currency_id"
            title="Currency"
            resource="currencies"
            apiType="lookup"
            className="flex-1"
            value={createForm.currency_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setCreateForm(p => ({ ...p, currency_id: e.target.value }))}
          />
          <MultiSelect
            name="timezone_ids"
            id="timezone_ids"
            title="Timezone"
            options={timezoneOptions as any}
            className="flex-1"
            value={createForm.timezone_ids as any}
            onChange={(value) => setCreateForm(p => ({ ...p, timezone_ids: value as string[] }))}
          />
        </div>
        <MultiSelect
          name="language_ids"
          id="language_ids"
          title="Languages"
          options={languageOptions as any}
          value={createForm.language_ids as any}
          onChange={(value) => setCreateForm(p => ({ ...p, language_ids: value as string[] }))}
          className="flex-1"
        />
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
          <Input name="country_name" title="Country Name" required value={editForm.country_name} onChange={(e) => setEditForm(p => ({ ...p, country_name: e.target.value }))} />
          <div className="flex gap-4">
            <Input name="country_code" title="Country Code" required value={editForm.country_code} onChange={(e) => setEditForm(p => ({ ...p, country_code: e.target.value }))} className="flex-1" />
            <Input name="dial_code" title="Dial Code" required value={editForm.dial_code} onChange={(e) => setEditForm(p => ({ ...p, dial_code: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex gap-4">
            <AsyncSelect
              name="currency_id"
              title="Currency"
              resource="currencies"
              apiType="lookup"
              value={editForm.currency_id}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditForm(p => ({ ...p, currency_id: e.target.value }))}
              className="flex-1"
            />
            <MultiSelect
              name="timezone_ids"
              id="edit_timezone_ids"
              title="Timezone"
              options={timezoneOptions as any}
              value={editForm.timezone_ids as any}
              onChange={(value) => setEditForm(p => ({ ...p, timezone_ids: value as string[] }))}
              className="flex-1"
            />
          </div>
          <MultiSelect
            name="language_ids"
            id="edit_language_ids"
            title="Languages"
            options={languageOptions as any}
            value={editForm.language_ids as any}
            onChange={(value) => setEditForm(p => ({ ...p, language_ids: value as string[] }))}
            className="flex-1"
          />
          <Toggle name="is_active" title="Status" checked={editForm.is_active} onChange={(v) => setEditForm(p => ({ ...p, is_active: v }))} />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Countries" badge="Settings" subtitle={`${total} records found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSort={() => { }}
        onSearch={handleSearch}
        searchValue={search}
        showSearch
        showFilter showAdd={false} showExport showRefresh onRefresh={() => fetchData()} rowKey="country_id"
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
        <Column header="SL" type="serial" />
        <Column header="Country Name" dataKey="country_name" sortable />
        <Column header="Code" dataKey="country_code" sortable />
        <Column header="Dial Code" dataKey="dial_code" sortable />
        <Column header="Currency" dataKey="currency_name" />
        <Column header="Timezone" dataKey="timezone_name" />
        <Column header="Language" dataKey="language_name" />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={tableActions}
        />
        <Filters>
          <ToggleFilter
            value={activeOnly}
            onChange={(v: boolean) => {
              setActiveOnly(v);
              setPage(1);
              fetchData({ page: 1, is_active: v ? true : undefined });
            }}
            label="Active only"
          />
        </Filters>
      </PaginatedTable>

      <Modal openModal={openDeleteModal} setOpenModal={setOpenDeleteModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto text-center">
          <div className="w-12 h-12 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-[#7b5757]" />
          </div>
          <h2 className="text-[16px] font-bold">Delete Record?</h2>
          <p className="text-[12px] text-[#5c6a7f] mt-2">This action cannot be undone. Are you sure you want to delete this country?</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Delete Permanent</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        open={openBulkModal}
        onClose={() => setOpenBulkModal(false)}
        templateFileName="countries_template.xlsx"
        columns={["country_name", "country_code", "dial_code", "currency_id", "timezone_ids", "language_ids", "is_active"]}
        exampleRow={["India", "IN", "+91", 1, "1,2", "1,2", "TRUE"]}
        columnDescription="country_name, country_code, dial_code, currency_id (numeric), timezone_ids (comma-separated IDs), language_ids (comma-separated IDs), is_active (TRUE/FALSE)"
        onUpload={async (rows) => {
          const errors: string[] = [];
          let success = 0;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 2;
            try {
              const res = await masterAPI.createCountry({
                country_name: r.country_name || "",
                country_code: r.country_code || "",
                dial_code: r.dial_code || "",
                currency_id: parseInt(String(r.currency_id), 10),
                timezone_ids: parseCommaIdsAsNumbers(r.timezone_ids),
                language_ids: parseCommaIdsAsNumbers(r.language_ids),
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

