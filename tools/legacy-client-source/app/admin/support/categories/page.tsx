"use client";

import { useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import type { TicketCategory } from "@/src/features/support/types";
import { SupportShell } from "../(components)/SupportShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportCategoriesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ categoryId: 0, name: "", slug: "", description: "", sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.support.categories({});
    if (res.status && Array.isArray(res.data)) setRows(res.data as TicketCategory[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const res = await adminOperationalAPI.support.saveCategory({
      categoryId: form.categoryId || undefined,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    });
    setSaving(false);
    if (res.status) {
      toast.success("Category saved");
      setForm({ categoryId: 0, name: "", slug: "", description: "", sortOrder: 0, isActive: true });
      load();
    } else toast.error("Failed", res.message);
  };

  return (
    <SupportShell title="Complaint categories" description="Organize tickets by issue type.">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{form.categoryId ? "Edit category" : "New category"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input title="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input title="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
            <Input title="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <Input
              title="Sort order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
            <Toggle title="Active" checked={form.isActive} onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))} />
            <Button onClick={() => void save()} loading={saving}>
              Save
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <PaginatedTable
            title="Categories"
            data={rows}
            total={rows.length}
            loading={loading}
            page={1}
            limit={rows.length || 20}
            onPageChange={() => {}}
            onLimitChange={() => {}}
            onRefresh={load}
            rowKey="category_id"
            showRefresh
          >
            <Column header="Name" dataKey="name" />
            <Column header="Slug" dataKey="slug" />
            <Column header="Order" dataKey="sort_order" />
            <Column header="Active" dataKey="is_active" render={(v) => (v ? "Yes" : "No")} />
            <Column
              header="Actions"
              dataKey="_actions"
              type="actions"
              actions={[
                {
                  label: "Edit",
                  onClick: (row: TicketCategory) =>
                    setForm({
                      categoryId: row.category_id,
                      name: row.name,
                      slug: row.slug,
                      description: row.description || "",
                      sortOrder: row.sort_order,
                      isActive: row.is_active,
                    }),
                },
              ]}
            />
          </PaginatedTable>
        </div>
      </div>
    </SupportShell>
  );
}
