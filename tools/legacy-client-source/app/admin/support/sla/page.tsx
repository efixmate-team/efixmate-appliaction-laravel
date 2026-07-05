"use client";

import { useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { TICKET_PRIORITIES } from "@/src/features/support/constants";
import type { SlaPolicy } from "@/src/features/support/types";
import { SupportShell } from "../(components)/SupportShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportSlaPage() {
  const toast = useToast();
  const [rows, setRows] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    priority: "normal",
    firstResponseMinutes: 240,
    resolutionMinutes: 1440,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.support.slaPolicies();
    if (res.status && Array.isArray(res.data)) setRows(res.data as SlaPolicy[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await adminOperationalAPI.support.saveSlaPolicy({
      priority: form.priority,
      firstResponseMinutes: form.firstResponseMinutes,
      resolutionMinutes: form.resolutionMinutes,
    });
    setSaving(false);
    if (res.status) {
      toast.success("SLA policy saved");
      load();
    } else toast.error("Failed", res.message);
  };

  return (
    <SupportShell title="SLA policies" description="First-response and resolution targets by priority.">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Update policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            title="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            options={TICKET_PRIORITIES}
          />
          <Input
            title="First response (minutes)"
            type="number"
            value={String(form.firstResponseMinutes)}
            onChange={(e) => setForm((f) => ({ ...f, firstResponseMinutes: Number(e.target.value) }))}
          />
          <Input
            title="Resolution (minutes)"
            type="number"
            value={String(form.resolutionMinutes)}
            onChange={(e) => setForm((f) => ({ ...f, resolutionMinutes: Number(e.target.value) }))}
          />
          <Button onClick={() => void save()} loading={saving}>
            Save policy
          </Button>
        </CardContent>
      </Card>

      <PaginatedTable
        title="Active policies"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={20}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="policy_id"
        showRefresh
      >
        <Column header="Priority" dataKey="priority" />
        <Column header="First response (min)" dataKey="first_response_minutes" />
        <Column header="Resolution (min)" dataKey="resolution_minutes" />
        <Column header="Active" dataKey="is_active" render={(v) => (v ? "Yes" : "No")} />
      </PaginatedTable>
    </SupportShell>
  );
}
