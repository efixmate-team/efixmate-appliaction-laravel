"use client";

import { useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import { usePaginatedTemplates } from "@/src/features/notifications/hooks/useNotificationCenter";
import { NOTIFICATION_CHANNELS } from "@/src/features/notifications/constants";
import { parseVariablesInput, validateTemplateForm } from "@/src/features/notifications/validation";
import type { NotificationTemplate, TemplateFormValues } from "@/src/features/notifications/types";
import { NotificationShell } from "../(components)/NotificationShell";
import { ChannelBadge } from "../(components)/ChannelBadge";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "../(components)/ErrorAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyForm: TemplateFormValues = {
  channel: "push",
  templateKey: "",
  title: "",
  body: "",
  variables: "",
  isActive: true,
};

export default function NotificationTemplatesPage() {
  const toast = useToast();
  const canEdit = usePermission("/admin/notifications", "EDIT");
  const canCreate = usePermission("/admin/notifications", "CREATE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<TemplateFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh } = usePaginatedTemplates({
    page,
    limit,
    channel: channel || undefined,
    search: search || undefined,
  });

  const save = async () => {
    const v = validateTemplateForm(form);
    if (!v.ok) {
      toast.error("Validation", v.message);
      return;
    }
    if (!canEdit && !canCreate) {
      toast.error("Permission denied");
      return;
    }
    setSaving(true);
    const res = await adminOperationalAPI.notifications.saveTemplate({
      templateId: form.templateId,
      channel: form.channel,
      templateKey: form.templateKey,
      title: form.title,
      body: form.body,
      variables: parseVariablesInput(form.variables),
      isActive: form.isActive,
    });
    setSaving(false);
    if (res.status) {
      toast.success(form.templateId ? "Template updated" : "Template created");
      setForm(emptyForm);
      refresh();
    } else toast.error("Save failed", res.message);
  };

  const editRow = (row: NotificationTemplate) => {
    setForm({
      templateId: row.template_id,
      channel: row.channel,
      templateKey: row.template_key,
      title: row.title || "",
      body: row.body,
      variables: Array.isArray(row.variables) ? row.variables.join(", ") : "",
      isActive: row.is_active,
    });
  };

  const deactivate = async (row: NotificationTemplate) => {
    if (!canEdit) {
      toast.error("Permission denied");
      return;
    }
    const res = await adminOperationalAPI.notifications.deleteTemplate(row.template_id);
    if (res.status) {
      toast.success("Template deactivated");
      refresh();
    } else toast.error("Failed", res.message);
  };

  return (
    <NotificationShell title="Notification templates" description="Reusable message templates per channel.">
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{form.templateId ? "Edit template" : "New template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              title="Channel"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as TemplateFormValues["channel"] }))}
              options={NOTIFICATION_CHANNELS.map((c) => ({ value: c.value, label: c.label }))}
            />
            <Input
              title="Template key"
              value={form.templateKey}
              onChange={(e) => setForm((f) => ({ ...f, templateKey: e.target.value }))}
              placeholder="booking_confirmed"
            />
            <Input title="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Textarea
              title="Body"
              name="body"
              id="template-body"
              placeholder="Message body with {{variables}}"
              className=""
              maxLength={5000}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={5}
            />
            <Input
              title="Variables (comma-separated)"
              value={form.variables}
              onChange={(e) => setForm((f) => ({ ...f, variables: e.target.value }))}
              placeholder="customerName, bookingId"
            />
            <Toggle
              title="Active"
              checked={form.isActive}
              onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={() => void save()} loading={saving} disabled={!canEdit && !canCreate}>
                Save
              </Button>
              {form.templateId ? (
                <Button variant="outline" onClick={() => setForm(emptyForm)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          <div className="grid gap-3 rounded-xl border bg-[#ffffff] p-4 sm:grid-cols-3">
            <Select
              title="Channel filter"
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setPage(1);
              }}
              options={[{ value: "", label: "All channels" }, ...NOTIFICATION_CHANNELS]}
            />
            <Input
              title="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Key or title"
            />
            <div className="flex items-end">
              <Button variant="outline" onClick={() => refresh()}>
                Apply
              </Button>
            </div>
          </div>

          {error ? <ErrorAlert message={error} onRetry={refresh} /> : null}

          <PaginatedTable
            title="Templates"
            data={data?.rows || []}
            total={data?.total || 0}
            loading={loading}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onRefresh={refresh}
            rowKey="template_id"
            showRefresh
          >
            <Column header="Key" dataKey="template_key" />
            <Column
              header="Channel"
              dataKey="channel"
              render={(_v, row: NotificationTemplate) => <ChannelBadge channel={row.channel} />}
            />
            <Column header="Title" dataKey="title" />
            <Column
              header="Active"
              dataKey="is_active"
              render={(v) => (v ? "Yes" : "No")}
            />
            <Column
              header="Actions"
              dataKey="_actions"
              type="actions"
              align="right"
              actions={[
                { label: "Edit", onClick: (row: NotificationTemplate) => editRow(row) },
                {
                  label: "Deactivate",
                  onClick: (row: NotificationTemplate) => {
                    void deactivate(row);
                  },
                },
              ]}
            />
          </PaginatedTable>
        </div>
      </div>
    </NotificationShell>
  );
}
