"use client";

import { useEffect, useState } from "react";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import { SecurityShell } from "../(components)/SecurityShell";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";

export default function SecurityIpRulesPage() {
  const toast = useToast();
  const [rules, setRules] = useState<Record<string, unknown>[]>([]);
  const [scope, setScope] = useState("global");
  const [ipAddress, setIpAddress] = useState("");
  const [cidr, setCidr] = useState("");
  const [label, setLabel] = useState("");

  const load = async () => {
    const res = await adminOperationalAPI.security.ipRules();
    if (res.status && Array.isArray(res.data)) setRules(res.data as Record<string, unknown>[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const res = await adminOperationalAPI.security.saveIpRule({ scope, ipAddress, cidr, label });
    if (res.status) {
      toast.success("Rule saved");
      void load();
    } else toast.error(res.message || "Failed");
  };

  return (
    <SecurityShell title="IP restrictions" description="Allowlist client networks for admin login.">
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 md:grid-cols-2">
        <Select
          title="Scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          options={[
            { value: "global", label: "Global" },
            { value: "admin", label: "Per admin" },
          ]}
        />
        <Input title="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input title="IP address" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="203.0.113.10" />
        <Input title="CIDR" value={cidr} onChange={(e) => setCidr(e.target.value)} placeholder="203.0.113.0/24" />
        <div className="flex items-end">
          <Button onClick={() => void save()}>Add rule</Button>
        </div>
      </div>

      <ul className="divide-y rounded-xl border border-[#f1f5f9] bg-[#ffffff]">
        {rules.map((r) => (
          <li key={String(r.rule_id)} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <strong>{String(r.label || r.scope)}</strong> - {String(r.ip_address || r.cidr || "-")}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await adminOperationalAPI.security.deleteIpRule(Number(r.rule_id));
                void load();
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </SecurityShell>
  );
}

