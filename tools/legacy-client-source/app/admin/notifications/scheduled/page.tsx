"use client";

import { useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import { usePaginatedSchedules } from "@/src/features/notifications/hooks/useNotificationCenter";
import { NOTIFICATION_CHANNELS, SCHEDULE_STATUS_OPTIONS } from "@/src/features/notifications/constants";
import { validateScheduleForm } from "@/src/features/notifications/validation";
import type { NotificationSchedule, ScheduleFormValues } from "@/src/features/notifications/types";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { NotificationShell } from "../(components)/NotificationShell";
import { ChannelBadge } from "../(components)/ChannelBadge";
import { DeliveryStatusBadge } from "../(components)/DeliveryStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "../(components)/ErrorAlert";

const emptyForm: ScheduleFormValues = {
  title: "",
  channel: "push",
  scheduledAt: "",
  messageBody: "",
};

export default function NotificationScheduledPage() {
  const toast = useToast();
  const canEdit = usePermission("/admin/notifications", "EDIT");
  const canSend = usePermission("/admin/notifications", "SEND");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<ScheduleFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh } = usePaginatedSchedules({
    page,
    limit,
    status: status || undefined,
  });

  const save = async () => {
    const v = validateScheduleForm(form);
    if (!v.ok) {
      toast.error("Validation", v.message);
      return;
    }
    if (!canEdit) {
      toast.error("Permission denied");
      return;
    }
    setSaving(true);
    const payload = {
      scheduleId: form.scheduleId,
      title: form.title,
      channel: form.channel,
      templateId: form.templateId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      payload: { body: form.messageBody },
      audience: { type: "segment", segment: "all" },
    };
    const res = form.scheduleId
      ? await adminOperationalAPI.notifications.updateSchedule(form.scheduleId, payload)
      : await adminOperationalAPI.notifications.saveSchedule(payload);
    setSaving(false);
    if (res.status) {
      toast.success(form.scheduleId ? "Schedule updated" : "Schedule created");
      setForm(emptyForm);
      refresh();
    } else toast.error("Save failed", res.message);
  };

  const runNow = async (row: NotificationSchedule) => {
    if (!canSend) {
      toast.error("Permission denied");
      return;
    }
    const res = await adminOperationalAPI.notifications.runSchedule(row.schedule_id);
    if (res.status) {
      toast.success("Schedule executed");
      refresh();
    } else toast.error("Run failed", res.message);
  };

  const cancel = async (row: NotificationSchedule) => {
    if (!canEdit) return;
    const res = await adminOperationalAPI.notifications.cancelSchedule(row.schedule_id);
    if (res.status) {
      toast.success("Schedule cancelled");
      refresh();
    } else toast.error("Cancel failed", res.message);
  };

  const processDue = async () => {
    const res = await adminOperationalAPI.notifications.processDueSchedules();
    if (res.status) {
      toast.success("Due schedules processed");
      refresh();
    } else toast.error("Process failed", res.message);
  };

  return (
    <NotificationShell
      title="Scheduled notifications"
      description="Plan future sends; run manually or process due jobs."
      actions={
        <Button variant="outline" size="sm" onClick={() => void processDue()}>
          Process due
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{form.scheduleId ? "Edit schedule" : "New schedule"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input title="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Select
              title="Channel"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as ScheduleFormValues["channel"] }))}
              options={NOTIFICATION_CHANNELS}
            />
            <Input
              title="Scheduled at"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
            <Textarea
              title="Message"
              name="messageBody"
              id="schedule-body"
              placeholder="Scheduled message"
              className=""
              maxLength={5000}
              value={form.messageBody}
              onChange={(e) => setForm((f) => ({ ...f, messageBody: e.target.value }))}
              rows={4}
            />
            <Button onClick={() => void save()} loading={saving} disabled={!canEdit}>
              Save schedule
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <Select
            title="Status filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={SCHEDULE_STATUS_OPTIONS}
          />
          {error ? <ErrorAlert message={error} onRetry={refresh} /> : null}
          <PaginatedTable
            title="Schedules"
            data={data?.rows || []}
            total={data?.total || 0}
            loading={loading}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onRefresh={refresh}
            rowKey="schedule_id"
            showRefresh
          >
            <Column header="Title" dataKey="title" />
            <Column header="Channel" dataKey="channel" render={(_v, row: NotificationSchedule) => <ChannelBadge channel={row.channel} />} />
            <Column
              header="Scheduled"
              dataKey="scheduled_at"
              render={(v) => new Date(String(v)).toLocaleString()}
            />
            <Column header="Status" dataKey="status" render={(_v, row: NotificationSchedule) => <DeliveryStatusBadge status={row.status} />} />
            <Column
              header="Actions"
              dataKey="_actions"
              type="actions"
              align="right"
              actions={
                [
                  {
                    label: "Run now",
                    hidden: (row: NotificationSchedule) => row.status !== "pending",
                    onClick: (row: NotificationSchedule) => {
                      void runNow(row);
                    },
                  },
                  {
                    label: "Cancel",
                    hidden: (row: NotificationSchedule) => row.status !== "pending",
                    onClick: (row: NotificationSchedule) => {
                      void cancel(row);
                    },
                  },
                ] as Array<Record<string, unknown>>
              }
            />
          </PaginatedTable>
        </div>
      </div>
    </NotificationShell>
  );
}
