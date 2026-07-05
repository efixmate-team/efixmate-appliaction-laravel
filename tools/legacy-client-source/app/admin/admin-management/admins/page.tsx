"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, BadgeAlert, Copy, Check, Key, X, Users } from "lucide-react";
import PaginatedTable, { Column, AvatarCell } from "@/app/admin/(components)/Table";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Modal from "@/components/modals/Modal";
import Input from '@/app/admin/(components)/Forms/Input';
import Toggle from '@/app/admin/(components)/Forms/Toggle';
import Select from '@/app/admin/(components)/Forms/Select';
import Form from '@/app/admin/(components)/Forms/Form';
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import { ADMIN_TYPES } from "@/src/shared/constants/adminTypes";

export default function AdminsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: string | null; direction: string | null }>({ key: null, direction: null });
  const [, setSelectedIds] = useState<any[]>([]);

  // â"€â"€ Overlays â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // â"€â"€ Deactivate Record â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordid, setToggleRecordId] = useState<any>(null);

  // â"€â"€ Force Password Change â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordRecordId, setPasswordRecordId] = useState<any>(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ new: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChangeIcon = (row: any) => {
    setPasswordRecordId(row.admin_id);
    setNewPasswordForm({ new: "", confirm: "" });
    setPasswordError("");
    setOpenPasswordModal(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPasswordForm.new !== newPasswordForm.confirm) {
      return setPasswordError("Passwords do not match");
    }
    if (newPasswordForm.new.length < 6) {
      return setPasswordError("Password must be at least 6 characters");
    }
    try {
      setPasswordLoading(true);
      await adminAPI.resetPassword({
        adminId: passwordRecordId,
        newPassword: newPasswordForm.new
      });
      setSuccessOverlay(true);
      setTimeout(() => {
        setSuccessOverlay(false);
        setOpenPasswordModal(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // â"€â"€ Create & Edit States â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    admin_type: "",
    is_active: false,
    role_id: "",
  });

  const [roles, setRoles] = useState<any[]>([]);
  const adminTypeOptions = [
    { id: ADMIN_TYPES.ADMIN, label: "Admin", value: ADMIN_TYPES.ADMIN },
    ...(user?.admin_type === ADMIN_TYPES.SUPER_ADMIN
      ? [{ id: ADMIN_TYPES.SUPER_ADMIN, label: "Super Admin", value: ADMIN_TYPES.SUPER_ADMIN }]
      : []),
  ];

  const [activeOnly, setActiveOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const res = await adminAPI.getAdmins({
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

  useEffect(() => { fetchAdmins(); }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await adminAPI.getRoleDropdown();
        if (res.status) setRoles(res.data);
      } catch (err) {
        console.error("Error fetching roles", err);
      }
    };
    fetchRoles();
  }, []);

  // â"€â"€ Toolbar & Filter Handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleSearch = (value: string) => {
    setSearch(value);
    fetchAdmins({ search: value, page: 1 });
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchAdmins({ page: p });
  };
  const handleLimitChange = (l: number) => {
    setLimit(l);
    fetchAdmins({ limit: l, page: 1 });
  };
  const handleSort = ({ key, direction }: { key: string | null; direction: string | null }) => {
    setSort({ key, direction });
    fetchAdmins({ sortKey: key, sortDir: direction });
  };
  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    fetchAdmins({ activeOnly: value, page: 1 });
  };

  // â"€â"€ Toggle Status â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        // Just activate it via toggle API
        await adminAPI.deleteAdmin({ adminId: row.admin_id, isActive: true });
        fetchAdmins();
      } else {
        setToggleRecordId(row.admin_id);
        setOpenDeactivateModal(true);
      }
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const deactivateRecord = async () => {
    try {
      await adminAPI.deleteAdmin({ adminId: toggleRecordid, isActive: false });
      setOpenDeactivateModal(false);
      fetchAdmins();
    } catch (error) {
      console.error("Deactivate failed", error);
    }
  };

  // â"€â"€ Edit Logic â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      mobile_number: row.mobile_number || "",
      admin_type: row.admin_type || "",
      is_active: row.is_active,
      role_id: row.role_id || "",
    });
    setOpenEditForm(true);
  };

  
  const handleUpdateSubmit = async (_formData: any, _values: any) => {
    setEditLoading(true);
    try {
      const payload = {
        adminId: editRow.admin_id,
        firstName: editForm.first_name,
        lastName: editForm.last_name,
        mobileNumber: editForm.mobile_number,
        email: editForm.email,
        adminType: editForm.admin_type,
        isActive: editForm.is_active,
        updatedBy: user?.admin_id,
        roleId: editForm.role_id,
      };

      // If a new password is typed, one could pass it, but standard update may ignore it unless specifically handled.

      const response = await adminAPI.updateAdmin(payload);
      if (response && response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          setOpenEditForm(false);
          setEditRow(null);
          fetchAdmins();
        }, 2000);
      } else {
        setErrorMessage(response?.message || "Update failed");
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

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Are you sure you want to delete admin "${row.first_name} ${row.last_name}"?`)) return;
    try {
      const res = await adminAPI.deleteAdmin({ adminId: row.admin_id, isActive: false });
      if (res.status) {
        setSuccessOverlay(true);
        fetchAdmins();
      } else {
        setErrorMessage(res.message || "Delete failed");
        setFailedOverlay(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during deletion");
      setFailedOverlay(true);
    }
  };

  // â"€â"€ Bulk Actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleBulkDelete = async (ids: any[]) => {
    try {
      await Promise.all(ids.map(id => adminAPI.deleteAdmin({ adminId: id, isActive: false })));
      setSuccessOverlay(true);
      fetchAdmins();
    } catch (err) {
      setErrorMessage("Failed to delete some admins.");
      setFailedOverlay(true);
    }
  };

  const handleBulkActivate = async (ids: any[]) => {
    try {
      await Promise.all(ids.map(id => adminAPI.deleteAdmin({ adminId: id, isActive: true })));
      setSuccessOverlay(true);
      fetchAdmins();
    } catch (err) {
      setErrorMessage("Failed to activate some admins.");
      setFailedOverlay(true);
    }
  };

  const handleBulkDeactivate = async (ids: any[]) => {
    try {
      await Promise.all(ids.map(id => adminAPI.deleteAdmin({ adminId: id, isActive: false })));
      setSuccessOverlay(true);
      fetchAdmins();
    } catch (err) {
      setErrorMessage("Failed to deactivate some admins.");
      setFailedOverlay(true);
    }
  };

  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Admin profile saved." />
      <FailedOverlay 
        show={failedOverlay} 
        title="Failed" 
        subtitle={errorMessage || "Unable to save changes."} 
        onFinish={() => setFailedOverlay(false)} 
      />

      {/* â"€â"€ CREATE FORM â"€â"€ */}
      <Form
        showMe={openCreateForm}
        cols={3}
        card
        title="Add Administrator"
        subtitle="Create a new admin account"
        onSubmit={async (_formData: any, values: any) => {
          setCreateLoading(true);
          try {
            const payload = {
              firstName: values.first_name,
              lastName: values.last_name,
              email: values.email,
              mobileNumber: values.mobile_number,
              password: values.password,
              adminType: values.admin_type,
              createdBy: user?.admin_id,
              roleId: values.role_id,
            };
            const response = await adminAPI.register(payload);
            if (response && response.status) {
              setSuccessOverlay(true);
              setTimeout(() => {
                setSuccessOverlay(false);
                setOpenCreateForm(false);
                fetchAdmins();
              }, 2000);
            } else {
              setErrorMessage(response?.message || "Registration failed");
              setFailedOverlay(true);
              setTimeout(() => setFailedOverlay(false), 3000);
            }
          } catch (err: any) {
            console.error("Registration failed:", err);
            setErrorMessage(err.message || "An unexpected error occurred");
            setFailedOverlay(true);
            setTimeout(() => setFailedOverlay(false), 3000);
          } finally {
            setCreateLoading(false);
          }
        }}
        onReset={() => setOpenCreateForm(false)}
        submitLabel="Create Admin"
        showReset
        loading={createLoading}
      >
        <Input name="first_name" title="First Name" required />
        <Input name="last_name" title="Last Name" />
        <Input name="email" title="Email Address" type="email" required />
        <Input name="mobile_number" title="Mobile Number" required />
        <Input name="password" title="Temporary Password" type="password" required />
        <Select
          name="admin_type"
          title="Admin Type"
          required
          options={adminTypeOptions}
        />
        <Select
          name="role_id"
          title="Role"
          options={roles}
        />
        <Toggle title="Active" checked />
      </Form>

      {/* â"€â"€ EDIT FORM â"€â"€ */}
      {editRow && (
        <Form
          showMe={openEditForm}
          cols={3}
          card
          title="Edit Administrator"
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
            value={editForm.first_name} onChange={(e) => setEditForm(p => ({ ...p, first_name: e.target.value }))}
          />
          <Input
            name="last_name" title="Last Name"
            value={editForm.last_name} onChange={(e) => setEditForm(p => ({ ...p, last_name: e.target.value }))}
          />
          <Input
            name="email" title="Email Address" type="email" required
            value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
          />
          <Input
            name="mobile_number" title="Mobile Number" required
            value={editForm.mobile_number} onChange={(e) => setEditForm(p => ({ ...p, mobile_number: e.target.value }))}
          />
          <Select
            name="admin_type" title="Admin Type"
            value={editForm.admin_type} onChange={(e) => setEditForm(p => ({ ...p, admin_type: e.target.value }))}
            options={adminTypeOptions}
          />
          <Select
            name="role_id" title="Role"
            value={editForm.role_id} 
            onChange={(e) => setEditForm(p => ({ ...p, role_id: e.target.value }))}
            options={roles}
          />
          <Toggle
            name="is_active" title="Active"
            checked={editForm.is_active} onChange={(v) => setEditForm(p => ({ ...p, is_active: v }))}
          />
        </Form>
      )}

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Administrators"
        badge="Management"
        subtitle={`${total} admins found`}
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
        addLabel="Add Admin"
        onAdd={() => setOpenCreateForm(true)}
        onRefresh={() => fetchAdmins()}
        rowKey="admin_id"
        onSelectionChange={setSelectedIds}
        enableSelection={true}

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
        <Column header="Code" dataKey="admin_code" render={(v: any) => v ?? "-"} />
        <Column
          header="Administrator"
          dataKey="first_name" 
          type="avatar" 
          sortable 
          render={(_val, row) => (
            <button
              type="button"
              onClick={() => router.push(`/admin/admin-management/admins/${row.admin_id}`)}
              className="text-left cursor-pointer"
              title="View admin details"
            >
              <AvatarCell value={`${row.first_name} ${row.last_name}`} row={row} />
            </button>
          )}
        />
        <Column header="Email" dataKey="email" sortable />
        <Column header="Mobile" dataKey="mobile_number" />
        <Column
          header="Type"
          dataKey="admin_type"
          render={(val) => val === ADMIN_TYPES.SUPER_ADMIN ? "Super Admin" : val === ADMIN_TYPES.ADMIN ? "Admin" : val}
        />
        <Column header="Role" dataKey="role_name" />
        <Column
          header="Login URL"
          dataKey="login_url"
          render={(url, row) => (
            <div className="flex items-center gap-2">
              <div 
                className="px-2 py-1 rounded bg-[#f8fafc] border border-[#f1f5f9] text-[11px] font-mono text-[#53697e] truncate max-w-[120px]"
                title={url}
              >
                {url}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  setCopiedId(row.admin_id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  copiedId === row.admin_id 
                  ? "bg-[#dcfce7] text-[#16a34a]" 
                  : "bg-[#f1f5f9] text-[#53697e] hover:bg-[#e2e8f0]"
                }`}
                title="Copy URL"
              >
                {copiedId === row.admin_id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column
          header="Action"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={[
            { label: "Edit", icon: Edit2, onClick: handleEdit },
            { 
              label: "Activate", 
              icon: Check, 
              onClick: (row) => handleToggle(true, row),
              onBulkClick: handleBulkActivate 
            },
            { 
              label: "Deactivate", 
              icon: X, 
              onClick: (row) => handleToggle(false, row),
              onBulkClick: handleBulkDeactivate 
            },
            { 
              label: "Delete", 
              icon: Trash2, 
              variant: "danger",
              onClick: (row) => handleDelete(row),
              onBulkClick: handleBulkDelete 
            },
            ...(user?.admin_type === ADMIN_TYPES.SUPER_ADMIN ? [{ label: "Password", icon: Key, onClick: handlePasswordChangeIcon }] : [])
          ]}
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
          <h2 className="text-[16px] font-bold text-center">Deactivate Admin?</h2>
          <p className="mt-2 text-[13px] text-[#53697e] text-center mx-auto">
            This administration account will lose system access.
          </p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      {/* â"€â"€ CHANGE PASSWORD MODAL â"€â"€ */}
      <Modal openModal={openPasswordModal} setOpenModal={setOpenPasswordModal}>
        <form onSubmit={handleUpdatePassword} className="p-2 bg-[#ffffff] rounded-2xl w-full mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#0f172a]">Change Admin Password</h2>
              <p className="text-[11px] text-[#94a3b8]">Update this user's password securely</p>
            </div>
            <button type="button" onClick={() => setOpenPasswordModal(false)} className="text-[#94a3b8] hover:text-[#475569]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 px-2">
            <div>
              <label className="block text-[11px] font-medium text-[#53697e] mb-1">New Password</label>
              <input
                required
                type="password"
                value={newPasswordForm.new}
                onChange={(e) => setNewPasswordForm(p => ({ ...p, new: e.target.value }))}
                className="w-full px-3 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] transition-all outline-none focus:ring-2 focus:ring-[#dbeafe]"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#53697e] mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                value={newPasswordForm.confirm}
                onChange={(e) => setNewPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] transition-all outline-none focus:ring-2 focus:ring-[#dbeafe]"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            {passwordError && <p className="text-[11px] text-[#7b5757] font-medium px-1">{passwordError}</p>}
          </div>
          <div className="mt-6 flex gap-2.5 px-2">
            <button type="button" onClick={() => setOpenPasswordModal(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors">Cancel</button>
            <button disabled={passwordLoading} type="submit" className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-[#ffffff] bg-[#2563eb] hover:bg-[#1d4ed8] shadow-sm shadow-[#dbeafe] disabled:opacity-50 transition-all">
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

