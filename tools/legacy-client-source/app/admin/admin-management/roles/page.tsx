"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit2, BadgeAlert, Shield } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";

export default function RolesPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: string | null; direction: string | null }>({ key: null, direction: null });

  // â"€â"€ Overlays â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // â"€â"€ Deactivate Record â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordid, setToggleRecordId] = useState<any>(null);

  // â"€â"€ Create & Edit States â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    role_name: "",
    is_active: false,
  });

  const [activeOnly, setActiveOnly] = useState(false);

  const fetchRoles = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const res = await adminAPI.getRoles({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        sortBy: overrides.sortKey ?? sort.key,
        sortDir: overrides.sortDir ?? sort.direction,
        isActive: (overrides.activeOnly ?? activeOnly) ? true : undefined,
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.total);
        setPage(res.page);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sort, activeOnly]);

  useEffect(() => { fetchRoles(); }, []);

  // â"€â"€ Toolbar & Filter Handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleSearch = (value: string) => {
    setSearch(value);
    fetchRoles({ search: value, page: 1 });
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchRoles({ page: p });
  };
  const handleLimitChange = (l: number) => {
    setLimit(l);
    fetchRoles({ limit: l, page: 1 });
  };
  const handleSort = ({ key, direction }: { key: string | null; direction: string | null }) => {
    setSort({ key, direction });
    fetchRoles({ sortKey: key, sortDir: direction });
  };
  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    fetchRoles({ activeOnly: value, page: 1 });
  };

  // â"€â"€ Toggle Status â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await adminAPI.toggleRole({ roleId: row.role_id, isActive: true, updatedBy: user?.admin_id });
        fetchRoles();
      } else {
        setToggleRecordId(row.role_id);
        setOpenDeactivateModal(true);
      }
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const deactivateRecord = async () => {
    try {
      await adminAPI.toggleRole({ roleId: toggleRecordid, isActive: false, updatedBy: user?.admin_id });
      setOpenDeactivateModal(false);
      fetchRoles();
    } catch (error) {
      console.error("Deactivate failed", error);
    }
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, data) => adminAPI.toggleRole({ roleId: id, isActive: data.is_active, updatedBy: user?.admin_id }) as any,
    {
      onSuccess: () => {
        setSuccessOverlay(true);
        setTimeout(() => { setSuccessOverlay(false); fetchRoles(); }, 1500);
      },
      onError: () => {
        setErrorMessage("Bulk update failed");
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      },
    }
  );

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Delete role "${row.role_name}"?`)) return;
    try {
      const res = await adminAPI.deleteRole({ roleId: row.role_id });
      if (res?.status) {
        setSuccessOverlay(true);
        setTimeout(() => { setSuccessOverlay(false); fetchRoles(); }, 1500);
      } else {
        setErrorMessage(res?.message || "Delete failed");
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "Delete failed");
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleBulkDelete = async (ids: any[]) => {
    try {
      await Promise.all(ids.map((id) => adminAPI.deleteRole({ roleId: id })));
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchRoles(); }, 1500);
    } catch (e) {
      setErrorMessage("Some roles could not be deleted.");
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  // â"€â"€ Edit Logic â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      role_name: row.role_name || "",
      is_active: row.is_active,
    });
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async (formData: any, values: any) => {
    setEditLoading(true);
    try {
      const payload = {
        roleId: editRow.role_id,
        roleName: editForm.role_name,
        isActive: editForm.is_active,
        updatedBy: user?.admin_id,
      };

      const response = await adminAPI.updateRole(payload);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenEditForm(false);
          setEditRow(null);
          fetchRoles();
        }, 2000);
      } else {
        setErrorMessage(response?.message || "Unable to save changes.");
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
      }
    } catch (err: any) {
      console.error("Update failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Role saved successfully." />
      <FailedOverlay 
        show={failedOverlay} 
        title="Failed" 
        subtitle={errorMessage || "Unable to save changes."} 
        onFinish={() => setFailedOverlay(false)} 
      />

      {/* â"€â"€ CREATE FORM â"€â"€ */}
      <Form
        showMe={openCreateForm}
        cols={2}
        card
        title="Add Role"
        subtitle="Create a new access role"
        onSubmit={async (formData: any, values: any) => {
          try {
            const payload = {
              roleName: values.role_name,
              isActive: values.is_active,
              createdBy: user?.admin_id,
            };
            const response = await adminAPI.createRole(payload);
            if (response && response.status) {
              setSuccessOverlay(true);
              setTimeout(() => {
                setSuccessOverlay(false);
                setOpenCreateForm(false);
                fetchRoles();
              }, 2000);
            } else {
              setErrorMessage(response?.message || "Creation failed");
              setFailedOverlay(true);
              setTimeout(() => setFailedOverlay(false), 3000);
            }
          } catch (err: any) {
             console.error("Creation failed:", err);
             setErrorMessage(err.message || "An unexpected error occurred");
             setFailedOverlay(true);
             setTimeout(() => setFailedOverlay(false), 3000);
          }
        }}
        onReset={() => setOpenCreateForm(false)}
        submitLabel="Create Role"
        showReset
        loading={false}
      >
        <Input name="role_name" title="Role Name" required />
        <Toggle name="is_active" title="Status" checked />
      </Form>

      {/* â"€â"€ EDIT FORM â"€â"€ */}
      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2}
          card
          title="Edit Role"
          subtitle={`Editing: ${editRow.role_name}`}
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
            name="role_name" title="Role Name" required 
            value={editForm.role_name} onChange={(e) => setEditForm(p => ({...p, role_name: e.target.value}))} 
          />
          <Toggle 
            name="is_active" title="Status" 
            checked={editForm.is_active} onChange={(v) => setEditForm(p => ({...p, is_active: v}))} 
          />
        </Form>
      )}

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Admin Roles"
        badge="Access Control"
        subtitle={`${total} roles found`}
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSort={handleSort}
        onSearch={handleSearch}
        searchValue={search}

        showSearch
        showFilter
        showAdd
        showRefresh
        addLabel="Add Role"
        onAdd={() => setOpenCreateForm(true)}
        onRefresh={() => fetchRoles()}
        rowKey="role_id"

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
        <Column header="Code" dataKey="role_code" render={(v: any) => v ?? "-"} />
        <Column header="Role Name" dataKey="role_name" sortable />
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
            onDeleteRow: handleDelete,
            onBulkDelete: handleBulkDelete,
          })}
        />
      </PaginatedTable>

      {/* â"€â"€ DEACTIVATE MODAL â"€â"€ */}
      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#ffffff]" />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-center">Deactivate Role?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center mx-auto">
            This will suspend any admins linked to this role.
          </p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

