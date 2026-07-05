"use client";

import { useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { NOTIFICATION_CHANNELS } from "@/src/features/notifications/constants";
import { validateBroadcastForm } from "@/src/features/notifications/validation";
import type { BroadcastFormValues, NotificationCampaign, NotificationTemplate } from "@/src/features/notifications/types";
import { NotificationShell } from "../(components)/NotificationShell";
import { ChannelBadge } from "../(components)/ChannelBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryStatusBadge } from "../(components)/DeliveryStatusBadge";

export default function NotificationBroadcastPage() {
  const toast = useToast();
  const canSend = usePermission("/admin/notifications", "SEND");
  const [form, setForm] = useState<BroadcastFormValues>({
    name: "",
    channel: "push",
    messageBody: "",
    segment: "all",
  });
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await adminOperationalAPI.notifications.templates({ page: 1, limit: 100, isActive: true });
      if (res.status && res.data) setTemplates((res.data as { rows: NotificationTemplate[] }).rows || []);
    })();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.notifications.campaigns({ page, limit, isBroadcast: true });
    if (res.status && res.data) {
      const d = res.data as { rows: NotificationCampaign[]; total: number };
      setCampaigns(d.rows || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadCampaigns();
  }, [page, limit]);

  const sendBroadcast = async () => {
    const v = validateBroadcastForm(form);
    if (!v.ok) {
      toast.error("Validation", v.message);
      return;
    }
    if (!canSend) {
      toast.error("Permission denied", "NOTIFICATION_SEND required");
      return;
    }
    setSending(true);
    const res = await adminOperationalAPI.notifications.broadcast({
      name: form.name,
      channel: form.channel,
      templateId: form.templateId,
      messageBody: form.messageBody,
      segment: form.segment,
      audience: { type: "segment", segment: form.segment },
    });
    setSending(false);
    if (res.status) {
      toast.success("Broadcast sent", "Messages queued for delivery");
      setForm({ name: "", channel: form.channel, messageBody: "", segment: "all" });
      loadCampaigns();
    } else toast.error("Broadcast failed", res.message);
  };

  const sendCampaign = async (campaignId: number) => {
    if (!canSend) return;
    const res = await adminOperationalAPI.notifications.send({ campaignId });
    if (res.status) {
      toast.success("Campaign sent");
      loadCampaigns();
    } else toast.error("Send failed", res.message);
  };

  return (
    <NotificationShell title="Broadcast messaging" description="Send one-to-many campaigns across channels.">
      <Card>
        <CardHeader>
          <CardTitle>New broadcast</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input title="Campaign name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select
            title="Channel"
            value={form.channel}
            onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as BroadcastFormValues["channel"] }))}
            options={NOTIFICATION_CHANNELS}
          />
          <Select
            title="Template (optional)"
            value={form.templateId ? String(form.templateId) : ""}
            onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value ? Number(e.target.value) : undefined }))}
            options={[
              { value: "", label: "None" },
              ...templates
                .filter((t) => t.channel === form.channel)
                .map((t) => ({ value: String(t.template_id), label: t.template_key })),
            ]}
          />
          <Select
            title="Audience segment"
            value={form.segment}
            onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
            options={[
              { value: "all", label: "All users" },
              { value: "customers", label: "Customers" },
              { value: "technicians", label: "Technicians" },
              { value: "active", label: "Active last 30 days" },
            ]}
          />
          <div className="md:col-span-2">
            <Textarea
              title="Message body"
              name="messageBody"
              id="broadcast-body"
              placeholder="Your broadcast message"
              className=""
              maxLength={5000}
              value={form.messageBody}
              onChange={(e) => setForm((f) => ({ ...f, messageBody: e.target.value }))}
              rows={4}
            />
          </div>
          <Button onClick={() => void sendBroadcast()} loading={sending} disabled={!canSend}>
            Send broadcast
          </Button>
        </CardContent>
      </Card>

      <PaginatedTable
        title="Broadcast campaigns"
        data={campaigns}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={loadCampaigns}
        rowKey="campaign_id"
        showRefresh
      >
        <Column header="Name" dataKey="name" />
        <Column header="Channel" dataKey="channel" render={(_v, row: NotificationCampaign) => <ChannelBadge channel={row.channel} />} />
        <Column header="Status" dataKey="status" render={(_v, row: NotificationCampaign) => <DeliveryStatusBadge status={row.status} />} />
        <Column header="Sent at" dataKey="sent_at" render={(v) => (v ? new Date(String(v)).toLocaleString() : "—")} />
        <Column
          header="Actions"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={
            [
              {
                label: "Send",
                hidden: (row: NotificationCampaign) => row.status === "sent",
                onClick: (row: NotificationCampaign) => {
                  void sendCampaign(row.campaign_id);
                },
              },
            ] as Array<Record<string, unknown>>
          }
        />
      </PaginatedTable>
    </NotificationShell>
  );
}
