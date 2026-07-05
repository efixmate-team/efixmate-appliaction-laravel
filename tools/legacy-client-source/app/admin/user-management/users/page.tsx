"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Users } from "lucide-react";
import PaginatedTable, { Column, AvatarCell } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { customerAdminAPI } from "@/lib/api";
import Input from '@/app/admin/(components)/Forms/Input';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import Toggle from '@/app/admin/(components)/Forms/Toggle';

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // â"€â"€ Overlays â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  // â"€â"€ Form States â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    is_active: false,
  });

  const [activeOnly, setActiveOnly] = useState(false);

  const fetchUsers = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const params: any = {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
      };
      if (overrides.activeOnly ?? activeOnly) {
        params.isActive = true;
      }

      const res = await customerAdminAPI.getUsers(params);
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setFailedOverlay(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeOnly]);

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchUsers({ search: value, page: 1 });
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchUsers({ page: p });
  };
  const handleLimitChange = (l: number) => {
    setLimit(l);
    fetchUsers({ limit: l, page: 1 });
  };
  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    fetchUsers({ activeOnly: value, page: 1 });
  };

  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      await customerAdminAPI.updateUser({ customerId: row.customer_id, isActive: newValue });
      fetchUsers();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => customerAdminAPI.updateUser({ customerId: id, isActive: data.is_active }),
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => { setSuccessOverlay(false); fetchUsers(); }, 1500);
      },
      onError: () => {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      },
    }
  );

  const handleView = (row: any) => {
    router.push(`/admin/user-management/users/${row.customer_id}`);
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      mobile_number: row.mobile_number || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    setEditLoading(true);
    try {
      const payload = {
        customerId: editRow.customer_id,
        firstName: editForm.first_name,
        lastName: editForm.last_name,
        email: editForm.email,
        isActive: editForm.is_active,
      };

      const response = await customerAdminAPI.updateUser(payload);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenEditForm(false);
          setEditRow(null);
          fetchUsers();
        }, 2000);
      } else {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err: any) {
      console.error("Update failed:", err);
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="User updated." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle="Unable to update." onFinish={() => setFailedOverlay(false)} />

      {/* â"€â"€ EDIT FORM â"€â"€ */}
      {editRow && (
        <Form
          showMe={openEditForm}
          cols={3}
          card
          title="Edit Customer"
          subtitle={`Editing: ${editRow.first_name} ${editRow.last_name || ''}`}
          onSubmit={handleUpdateSubmit}
          onReset={() => {
            setOpenEditForm(false);
            setEditRow(null);
          }}
          submitLabel="Save Changes"
          showReset
          loading={editLoading}
        >
          <Input
            name="first_name" title="First Name" required
            onChange={(e) => setEditForm(p => ({ ...p, first_name: e.target.value }))}
            value={editForm.first_name}
          />
          <Input
            name="last_name" title="Last Name"
            onChange={(e) => setEditForm(p => ({ ...p, last_name: e.target.value }))}
            value={editForm.last_name}
          />
          <Input
            name="email" title="Email" type="email"
            value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
          />
          <Input
            name="mobile_number" title="Mobile" required disabled
            value={editForm.mobile_number}
          />
          <Toggle
            name="is_active" title="Active Account"
            checked={editForm.is_active} onChange={(v) => setEditForm(p => ({ ...p, is_active: v }))}
          />
        </Form>
      )}

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={!openEditForm}
        title="Customers Overview"
        badge="Users"
        subtitle={`${total} customers registered`}
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
        onRefresh={() => fetchUsers()}
        rowKey="customer_id"
        filters={[
          {
            type: "toggle",
            label: "Active only",
            value: activeOnly,
            onChange: handleActiveOnly,
          },
        ]}
      >
        <Column header="SL" type="serial" />
        <Column header="Code" dataKey="customer_code" render={(v: any) => v ?? "-"} />
        <Column
          header="Name"
          dataKey="first_name"
          type="avatar"
          sortable
          render={(_val, row) => (
            <button
              type="button"
              onClick={() => router.push(`/admin/user-management/users/${row.customer_id}`)}
              className="text-left cursor-pointer"
              title="View customer details"
            >
              <AvatarCell
                value={`${row.first_name || ""} ${row.last_name || ""}`.trim()}
                row={row}
              />
            </button>
          )}
        />
        <Column header="Mobile Number" dataKey="mobile_number" sortable />
        <Column header="Email" dataKey="email" sortable />
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
            extra: [{ label: "View Details", icon: Eye, onClick: handleView }],
          })}
        />
      </PaginatedTable>
    </div>
  );
}

