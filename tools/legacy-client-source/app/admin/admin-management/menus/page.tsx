"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, BadgeAlert, Check, X, LayoutTemplate } from "lucide-react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table/Paginatedtable";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Modal from "@/components/modals/Modal";
import MenuFormDrawer, { type MenuFormValues } from "./MenuFormDrawer";

type MenuQueryOverrides = {
  page?: number;
  limit?: number;
  search?: string;
  sortKey?: string | null;
  sortDir?: string | null;
  type?: string;
  fromDate?: string;
  toDate?: string;
  activeOnly?: boolean;
};

import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";

export default function AdminMenus() {
  const user = useAuthStore((state) => state.user);
  const [menus, setMenus] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: string | null; direction: string | null }>({ key: null, direction: null });

  // â"€â"€ Overlay States â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);

  // â"€â"€ Options States â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [menuParent, setMenuParent] = useState<{ id: number; label: string }[]>([]);
  const [menuGroup, setMenuGroup] = useState<{ id: number; label: string }[]>([]);

  // â"€â"€ Deactivate Record state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordid, setToggleRecordId] = useState<any>(null);

  // â"€â"€ Create Form state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editRow, setEditRow] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<MenuFormValues> | null>(null);

  // â"€â"€ Filter state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // â"€â"€ Core fetch â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const fetchMenus = useCallback(async (overrides: MenuQueryOverrides = {}) => {
    try {
      setLoading(true);
      const res = await adminAPI.paginatedMenu({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        sortBy: overrides.sortKey ?? sort.key,
        sortDir: overrides.sortDir ?? sort.direction,
        type: overrides.type ?? typeFilter,
        fromDate: overrides.fromDate ?? fromDate,
        toDate: overrides.toDate ?? toDate,
        // ðŸ"¥ FIX: only send isActive:true if activeOnly is true. 
        // Backend filtering for isActive:false was returning 0 results.
        isActive: (overrides.activeOnly ?? activeOnly) ? true : undefined,
      });
      if (res.status) {
        setMenus(res.data);
        setTotal(res.total);
        setPage(res.page);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sort, typeFilter, fromDate, toDate, activeOnly]);

  // Initial load
  useEffect(() => { fetchMenus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuParents = await adminAPI.getMenuParent();
        const menuGroups = await adminAPI.getMenuGroup();
        setMenuParent(menuParents.parents);
        setMenuGroup(menuGroups.groups);
      } catch (err) {
        console.error("Error fetching menu parents:", err);
      }
    };
    fetchData();
  }, []);

  // â"€â"€ Toolbar handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchMenus({ search: value, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchMenus({ page: p });
  };

  const handleLimitChange = (l: number) => {
    setLimit(l);
    setPage(1);
    fetchMenus({ limit: l, page: 1 });
  };

  const handleSort = ({ key, direction }: { key: string | null; direction: string | null }) => {
    setSort({ key, direction });
    fetchMenus({ sortKey: key, sortDir: direction });
  };

  const [selectedIds, setSelectedIds] = useState<any[]>([]);

  // â"€â"€ Handlers for bulk actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleBulkDelete = async (ids: any[]) => {
    try {
      await Promise.all(ids.map(id => adminAPI.deleteMenu({ menuId: id })));
      setSuccessOverlay(true);
      setTimeout(() => {
        setSuccessOverlay(false);
        fetchMenus();
      }, 2000);
    } catch (err) {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleBulkActivate = async (ids: any[]) => {
    try {
      const response = await adminAPI.bulkActivateMenu({ menuIds: ids });
      if (response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          fetchMenus();
        }, 2000);
      }
    } catch (err) {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  const handleBulkDeactivate = async (ids: any[]) => {
    try {
      const response = await adminAPI.bulkDeactivateMenu({ menuIds: ids });
      if (response.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          fetchMenus();
        }, 2000);
      }
    } catch (err) {
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  // â"€â"€ Filter handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    fetchMenus({ type: value, page: 1 });
  };

  const handleFromDate = (value: string) => {
    setFromDate(value);
    setPage(1);
    fetchMenus({ fromDate: value, page: 1 });
  };

  const handleToDate = (value: string) => {
    setToDate(value);
    setPage(1);
    fetchMenus({ toDate: value, page: 1 });
  };

  const handleActiveOnly = (value: boolean) => {
    setActiveOnly(value);
    setPage(1);
    fetchMenus({ activeOnly: value, page: 1 });
  };

  // â"€â"€ Toggle (is_active) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        const response = await adminAPI.activateMenu({ menuId: row.menu_id });
        if (response.status) {
          setSuccessOverlay(true);
          setTimeout(() => {
            setSuccessOverlay(false);
            fetchMenus();
          }, 2000);
        }
      } else {
        setToggleRecordId(row.menu_id);
        setOpenDeactivateModal(true);
      }
    } catch (err) {
      console.error("Toggle failed, rolling back:", err);
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
      setMenus((prev) =>
        prev.map((m) =>
          m.menu_id === row.menu_id ? { ...m, is_active: !newValue } : m
        )
      );
    }
  };

  const deactivateRecord = async () => {
    try {
      const response = await adminAPI.deactivateMenu({ menuId: toggleRecordid });
      if (response.status) {
        setOpenDeactivateModal(false);
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          fetchMenus();
        }, 2000);
      }
    } catch (error) {
      console.error("Toggle failed, rolling back:", error);
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
    }
  };

  // â"€â"€ Edit handler - opens the Edit form pre-populated with row data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const openCreate = () => {
    setFormMode("create");
    setEditRow(null);
    setFormInitial(null);
    setFormOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setFormMode("edit");
    setFormInitial({
      menu_name: row.menu_name || "",
      menu_path: row.menu_path || "",
      menu_icon: row.menu_icon || "LayoutGrid",
      placement: (String(row.menu_type || "I").toUpperCase() as MenuFormValues["placement"]),
      is_active: row.is_active !== false,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
    setFormInitial(null);
  };

  const handleFormSubmit = async (values: MenuFormValues) => {
    setFormLoading(true);
    try {
      if (formMode === "create") {
        const groupName =
          values.new_group_name ||
          menuGroup.find((g) => String(g.id) === String(values.menu_group_id))?.label ||
          "";
        const response = await adminAPI.createMenu({
          menuName: values.menu_name,
          menuPath: values.menu_path,
          menuIcon: values.menu_icon || "LayoutGrid",
          menuParentId: values.placement === "C" ? values.menu_parent_id || null : null,
          menuGroupId: values.menu_group_id || null,
          menuGroup: groupName,
          menuType: values.placement,
          createdBy: user?.admin_id?.toString() || "system",
        });
        if (response.status) {
          setSuccessOverlay(true);
          setTimeout(() => {
            setSuccessOverlay(false);
            closeForm();
            fetchMenus();
            adminAPI.getMenuGroup().then((r) => r.groups && setMenuGroup(r.groups));
          }, 2000);
        } else {
          setFailedOverlay(true);
        }
      } else if (editRow) {
        const response = await adminAPI.updateMenu({
          menuId: editRow.menu_id,
          menuName: values.menu_name,
          menuPath: values.menu_path,
          menuIcon: values.menu_icon || "LayoutGrid",
          isActive: values.is_active,
          updatedBy: user?.admin_id?.toString() || "system",
        });
        if (response.status) {
          setSuccessOverlay(true);
          setTimeout(() => {
            setSuccessOverlay(false);
            closeForm();
            fetchMenus();
          }, 2000);
        } else {
          setFailedOverlay(true);
        }
      }
    } catch (err) {
      console.error(err);
      setFailedOverlay(true);
    } finally {
      setFormLoading(false);
    }
  };

  // â"€â"€ Delete handler â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleDelete = async (row: any) => {
    const confirmed = window.confirm(
      `Delete menu "${row.menu_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setMenus((prev) => prev.filter((m) => m.menu_id !== row.menu_id));
    setTotal((prev) => prev - 1);

    try {
      const resp = await adminAPI.deleteMenu({ menuId: row.menu_id });
      if (resp.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false);
          const remainingOnPage = menus.length - 1;
          if (remainingOnPage === 0 && page > 1) {
            handlePageChange(page - 1);
          } else {
            fetchMenus();
          }
        }, 2000);
      } else {
        setFailedOverlay(true);
        setTimeout(() => setFailedOverlay(false), 3000);
        fetchMenus();
      }
    } catch (err) {
      console.error("Delete failed, rolling back:", err);
      setFailedOverlay(true);
      setTimeout(() => setFailedOverlay(false), 3000);
      fetchMenus();
    }
  };

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  return (
    <div className="space-y-6">


      {/* â"€â"€ Overlays â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <SuccessOverlay
        show={successOverlay}
        onFinish={() => setSuccessOverlay(false)}
        title="Saved successfully!"
        subtitle="Menu has been updated."
      />
      <FailedOverlay
        show={failedOverlay}
        title="Action failed"
        subtitle="Something went wrong. Please try again."
        onFinish={() => setFailedOverlay(false)}
      />

      <MenuFormDrawer
        open={formOpen}
        mode={formMode}
        initial={formInitial}
        parentOptions={menuParent}
        groupOptions={menuGroup}
        loading={formLoading}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      {/* â"€â"€ Paginated Table â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <PaginatedTable
        showMe={!formOpen}
        data={menus}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSort={handleSort}
        onSearch={handleSearch}
        searchValue={search}

        title="Admin's Menus"
        badge="Admin"
        subtitle={`${total} records found`}

        showSearch
        showFilter
        showAdd
        showRefresh
        addLabel="Add Menu"
        onAdd={openCreate}
        onRefresh={() => fetchMenus()}
        onExport={() => console.log("export")}

        rowKey="menu_id"
        onSelectionChange={setSelectedIds}
        enableSelection={true}
        searchPlaceholder="Search menus..."
        emptyMessage="No menus found. Click 'Add Menu' to get started."

        filters={[
          {
            type: "dropdown",
            value: typeFilter,
            onChange: handleTypeFilter,
            placeholder: "All Types",
            options: [
              { label: "Section heading", value: "p" },
              { label: "Sub-menu", value: "c" },
              { label: "Regular link", value: "i" },
            ],
          },
          {
            type: "daterange",
            fromValue: fromDate,
            toValue: toDate,
            onFromChange: handleFromDate,
            onToChange: handleToDate,
          },
          {
            type: "toggle",
            label: "Active only",
            value: activeOnly,
            onChange: handleActiveOnly,
          },
        ]}
      >
        {/* â"€â"€ Column definitions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        <Column header="SL" type="serial" />

        <Column dataKey="menu_name" header="Menu Name" sortable />

        <Column dataKey="menu_path" header="Path" type="link" />

        <Column dataKey="menu_group" header="Group" type="chips" sortable />

        <Column
          dataKey="menu_type"
          header="Type"
          render={(value) => {
            const key = String(value).toLowerCase();
            const map: Record<string, { label: string; color: string }> = {
              p: { label: "Section", color: "blue" },
              c: { label: "Sub-menu", color: "purple" },
              i: { label: "Link", color: "pink" },
            };
            const cfg = map[key];
            const styles: Record<string, { badge: string; dot: string }> = {
              blue: { badge: "bg-[#eff6ff]   text-[#1d4ed8]   ring-[#bfdbfe]", dot: "bg-[#eff6ff]" },
              purple: { badge: "bg-[#faf5ff] text-[#7e22ce] ring-[#e9d5ff]", dot: "bg-[#faf5ff]" },
              pink: { badge: "bg-[#fdf2f8]   text-[#be185d]   ring-[#fbcfe8]", dot: "bg-[#fdf2f8]" },
              slate: { badge: "bg-[#f1f5f9] text-[#475569]  ring-[#e2e8f0]", dot: "bg-[#94a3b8]" },
            };
            const { badge } = styles[cfg?.color ?? 'slate'];
            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge}`}>
                {cfg?.label ?? value}
              </span>
            );
          }}
        />

        <Column
          dataKey="is_active"
          header="Status"
          type="toggle"
          onToggle={handleToggle}
        />

        <Column
          dataKey="_actions"
          header="Action"
          type="actions"
          align="right"
          actions={[
            {
              label: "Edit",
              icon: Edit2,
              variant: "default",
              onClick: (row: any) => handleEdit(row),
            },
            {
              label: "Activate",
              icon: Check,
              variant: "default",
              onClick: (row: any) => handleToggle(true, row),
              onBulkClick: handleBulkActivate,
            },
            {
              label: "Deactivate",
              icon: X,
              variant: "default",
              onClick: (row: any) => handleToggle(false, row),
              onBulkClick: handleBulkDeactivate,
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "danger",
              onClick: (row: any) => handleDelete(row),
              onBulkClick: handleBulkDelete,
            },
          ]}
        />
      </PaginatedTable>

      {/* â"€â"€ Deactivate Alert Modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#fef2f2]" />
            <div className="absolute inset-0 rounded-2xl bg-[#fee2e2] blur-lg opacity-50 animate-pulse" />
            <div className="relative w-10 h-10 rounded-xl bg-[#fef2f2] shadow-md shadow-[#fecaca] flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-[#ffffff]" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-[16px] font-bold text-[#0f172a] text-center leading-tight">
            Are you sure?
          </h2>
          <p className="mt-2 text-[13px] text-[#94a3b8] text-center leading-relaxed mx-auto">
            Are you sure you want to deactivate this menu? It will disappear from
            the sidebar once deactivated.
          </p>
          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => setOpenDeactivateModal(false)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold
                text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={deactivateRecord}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold
                text-[#ffffff] bg-[#fef2f2] hover:bg-[#dc2626]
                shadow-sm shadow-[#fee2e2] active:scale-[0.98] transition-all"
            >
              Deactivate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
