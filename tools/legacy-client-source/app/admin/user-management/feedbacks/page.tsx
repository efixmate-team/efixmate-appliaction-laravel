"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Edit2, Star, MessageCircle } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import {
  filterBySearch,
  dropdownFilterDescriptor,
  useClientActiveFilter,
  type FilterOption,
} from "@/app/admin/(lib)/tableFilters";
import { masterAPI } from "@/lib/api";
import Input from '@/app/admin/(components)/Forms/Input';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import Select from '@/app/admin/(components)/Forms/Select';
import AsyncSelect from '@/app/admin/(components)/Forms/AsyncSelect';
import Toggle from '@/app/admin/(components)/Forms/Toggle';

const STATUS_OPTIONS: FilterOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RESOLVED", label: "Resolved" },
];

const RATING_OPTIONS: FilterOption[] = [1, 2, 3, 4, 5].map((v) => ({
  value: String(v),
  label: `${v} Stars`,
}));

export default function FeedbacksPage() {
  const resource = "feedbacks";
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    user_id: "",
    rating: 5,
    comment: "",
    status: "PENDING",
    is_active: true,
  });

  const { displayData: activeFiltered, tableFilters: activeFilters } = useClientActiveFilter(rawData);

  const displayData = useMemo(() => {
    let rows = activeFiltered;
    if (ratingFilter) {
      rows = rows.filter((r) => String(r.rating ?? "") === ratingFilter);
    }
    if (statusFilter) {
      rows = rows.filter((r) => String(r.status ?? "").toUpperCase() === statusFilter);
    }
    return filterBySearch(rows, search, [
      "comment",
      "first_name",
      "last_name",
      "email",
      "mobile_number",
    ]);
  }, [activeFiltered, ratingFilter, statusFilter, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return displayData.slice(start, start + limit);
  }, [displayData, page, limit]);

  const tableFilters = useMemo(
    () => [
      ...activeFilters,
      dropdownFilterDescriptor(ratingFilter, setRatingFilter, "All Ratings", RATING_OPTIONS),
      dropdownFilterDescriptor(statusFilter, setStatusFilter, "All Statuses", STATUS_OPTIONS),
    ],
    [activeFilters, ratingFilter, statusFilter]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterAPI.getLookups(resource, { limit: "all" });
      if (res.status && res.data) setRawData(res.data);
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      user_id: row.user_id || "",
      rating: row.rating || 5,
      comment: row.comment || "",
      status: row.status || "PENDING",
      is_active: row.is_active !== false,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const response = await masterAPI.updateLookup(resource, editRow.feedback_id, editForm);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false); setOpenEditForm(false); setEditRow(null); fetchData();
        }, 2000);
      } else {
        setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err) {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
    finally { setEditLoading(false); }
  };

  const ratingFormOptions = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: `${v} Stars` }));
  const statusFormOptions = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to save changes." onFinish={() => setFailedOverlay(false)} />

      <Form
        showMe={openCreateForm}
        cols={2} card title="Add Feedback" subtitle="Create a new entry"
        onSubmit={async (formData, values) => {
          try {
            const userId = parseInt(String(values.user_id), 10);
            if (!userId || Number.isNaN(userId)) {
              setFailedOverlay(true);
              setTimeout(() => setFailedOverlay(false), 3000);
              return;
            }
            const payload = {
              user_id: userId,
              rating: Number(values.rating) || 5,
              comment: values.comment ?? "",
              status: values.status || "PENDING",
              is_active: true,
            };
            const response = await masterAPI.createLookup(resource, payload);
            if (response && response.status) {
              setSuccessOverlay(true);
              setTimeout(() => { setSuccessOverlay(false); setOpenCreateForm(false); fetchData(); }, 2000);
            } else {
              setFailedOverlay(true);
              setTimeout(() => setFailedOverlay(false), 3000);
            }
          } catch {
            setFailedOverlay(true);
            setTimeout(() => setFailedOverlay(false), 3000);
          }
        }}
        onReset={() => setOpenCreateForm(false)}
        submitLabel="Create" showReset loading={false}
      >
        <AsyncSelect name="user_id" title="User" resource="users" labelKey="first_name" required />
        <Select name="rating" title="Rating" options={ratingFormOptions} required />
        <Input name="comment" title="Comment" />
        <Select name="status" title="Status" options={statusFormOptions} defaultValue="PENDING" />
      </Form>

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Feedback" subtitle="Modifying record"
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <AsyncSelect
            name="user_id" title="User" resource="users" labelKey="first_name" required
            value={editForm.user_id} onChange={(e: any) => setEditForm(p => ({...p, user_id: e.target.value}))}
          />
          <Select
            name="rating" title="Rating" options={ratingFormOptions} required
            value={editForm.rating} onChange={(e) => setEditForm(p => ({...p, rating: parseInt(e.target.value)}))}
          />
          <Input
            name="comment" title="Comment"
            value={editForm.comment} onChange={(e) => setEditForm(p => ({...p, comment: e.target.value}))}
          />
          <Select
            name="status" title="Status" options={statusFormOptions}
            value={editForm.status} onChange={(e) => setEditForm(p => ({...p, status: e.target.value}))}
          />
          <Toggle
            name="is_active"
            title="Active"
            checked={editForm.is_active}
            onChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
          />
        </Form>
      )}

      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="User Feedbacks" badge="Management" subtitle="User ratings and comments"
        data={paginatedData} total={displayData.length} loading={loading} page={page} limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchValue={search}
        showSearch showFilter filters={tableFilters}
        showAdd showRefresh addLabel="Add New" onAdd={() => setOpenCreateForm(true)} onRefresh={() => fetchData()} rowKey="feedback_id"
        enableSelection={false}
      >
        <Column header="SL" type="serial" />
        <Column
          header="User"
          render={(_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'N/A'}
        />
        <Column
          header="Rating"
          render={(val, row) => (
            <div className="flex items-center gap-1">
              {row.rating} <Star className="w-4 h-4 fill-[#facc15] text-[#facc15]" />
            </div>
          )}
        />
        <Column header="Comment" dataKey="comment" />
        <Column header="Status" dataKey="status" />
        <Column header="Action" dataKey="_actions" type="actions" align="right" actions={[{ label: "Edit", icon: Edit2, onClick: handleEdit }]} />
      </PaginatedTable>
    </div>
  );
}

