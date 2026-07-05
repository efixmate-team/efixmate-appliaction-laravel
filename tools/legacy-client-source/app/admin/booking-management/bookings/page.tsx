"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit2, Calendar } from "lucide-react";
import PaginatedTable, { Column, Filters, DropdownFilter } from "@/app/admin/(components)/Table";
import { bookingAdminAPI, masterAPI } from "@/lib/api";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import Form from '@/app/admin/(components)/Forms/Form';
import Input from '@/app/admin/(components)/Forms/Input';
import Select from '@/app/admin/(components)/Forms/Select';
import AsyncSelect from '@/app/admin/(components)/Forms/AsyncSelect';

const BOOKING_STATUSES = [
  { value: "1",  label: "Pending" },
  { value: "2",  label: "Confirmed" },
  { value: "3",  label: "In Progress" },
  { value: "4",  label: "Completed" },
  { value: "5",  label: "Cancelled" },
  { value: "6",  label: "Failed" },
  { value: "7",  label: "Refunded" },
  { value: "20", label: "Broadcasted" },
  { value: "21", label: "Tech Accepted" },
  { value: "22", label: "On The Way" },
  { value: "23", label: "Arrived" },
  { value: "24", label: "Started" },
  { value: "25", label: "No Service" },
];

export default function BookingsPage() {
  const resource = "bookings";
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatusId, setFilterStatusId] = useState("");
  const statusOptions = BOOKING_STATUSES;

  // ── Overlays ──────────────────────────────────────────────────────────────
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchBookings = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const statusId = overrides.statusId ?? filterStatusId;
      const res = await bookingAdminAPI.getBookings({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(statusId ? { statusIn: [Number(statusId)] } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatusId]);

  useEffect(() => {
    fetchBookings();
    const onScopeChange = () => fetchBookings({ page: 1 });
    window.addEventListener("admin-scope-changed", onScopeChange);
    return () => window.removeEventListener("admin-scope-changed", onScopeChange);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchBookings({ search: value, page: 1 });
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchBookings({ page: p });
  };
  const handleLimitChange = (l: number) => {
    setLimit(l);
    fetchBookings({ limit: l, page: 1 });
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async (_formData: any, values: any) => {
    setEditLoading(true);
    try {
      let response;
      if (values.technician_id) {
        response = await bookingAdminAPI.reassign(
          editRow.booking_id,
          Number(values.technician_id),
          'Assigned by admin'
        );
      } else {
        response = await masterAPI.updateLookup(resource, editRow.booking_id, values);
      }
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false); setOpenEditForm(false); setEditRow(null); fetchBookings();
        }, 2000);
      } else {
        setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err) { setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); }
    finally { setEditLoading(false); }
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Action completed." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to process." onFinish={() => setFailedOverlay(false)} />

      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card title="Edit Booking" subtitle={`UID: ${editRow.booking_uid}`}
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes" showReset loading={editLoading}
        >
          <AsyncSelect name="technician_id" title="Assign Technician" resource="technicians" labelKey="first_name" defaultValue={editRow.technician_id} />
          <Select name="booking_status_id" title="Status" options={BOOKING_STATUSES} defaultValue={String(editRow.booking_status_id ?? "")} />
          <Input name="scheduled_date" title="Date" type="date" defaultValue={editRow.scheduled_date?.split('T')[0]} />
          <Input name="scheduled_time" title="Time" defaultValue={editRow.scheduled_time} />
        </Form>
      )}

      {/* ── TABLE ── */}
      <PaginatedTable
        showMe={!openEditForm}
        title="Bookings Overview"
        badge="Services"
        subtitle={`${total} overall bookings found`}
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        searchValue={search}
        showSearch
        showFilter
        showRefresh
        onRefresh={() => fetchBookings()}
        rowKey="booking_id"
        enableSelection={false}
      >
        <Filters>
          <DropdownFilter
            value={filterStatusId}
            onChange={(v: string) => {
              setFilterStatusId(v);
              setPage(1);
              fetchBookings({ page: 1, statusId: v });
            }}
            placeholder="All Statuses"
            options={statusOptions}
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="Booking UID" dataKey="booking_uid" sortable />
        <Column
          header="Customer"
          render={(_, row) => {
            const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
            return fullName || row.mobile_number || "Unknown Customer";
          }}
        />
        <Column header="Service" dataKey="service" />
        <Column 
          header="Technician" 
          render={(_, row) => {
            const fullName = [row.tech_first_name, row.tech_last_name].filter(Boolean).join(" ").trim();
            return fullName || 'Unassigned';
          }}
        />
        <Column header="Status" dataKey="booking_status" />
        <Column header="Amount" dataKey="final_price" />
        <Column header="Date" dataKey="scheduled_date" render={(val: string) => val ? new Date(val).toLocaleDateString() : 'N/A'} />
        <Column header="Action" dataKey="_actions" type="actions" align="right" actions={[{ label: "Edit", icon: Edit2, onClick: handleEdit }]} />
      </PaginatedTable>
    </div>
  );
}

