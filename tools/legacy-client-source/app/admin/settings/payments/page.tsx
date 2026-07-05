"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck, CreditCard, Loader2, RefreshCw, RotateCcw, Save, ShieldAlert, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminAPI } from "@/lib/api";

type GatewayConfig = {
  id: string;
  name: string;
  logo: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  acceptEnabled: boolean;
  acceptDefault: boolean;
  refundEnabled: boolean;
  refundDefault: boolean;
};

const GATEWAY_META = [
  {
    id: "razorpay",
    name: "Razorpay",
    logo: "RP",
    color: "text-[#3395ff]",
    accentBg: "bg-[#eff6ff]",
    accentBorder: "border-[#bfdbfe]",
    badgeColor: "bg-[#dbeafe] text-[#1d4ed8]",
  },
  {
    id: "cashfree",
    name: "Cashfree",
    logo: "CF",
    color: "text-[#059669]",
    accentBg: "bg-[#f0fdf4]",
    accentBorder: "border-[#bbf7d0]",
    badgeColor: "bg-[#dcfce7] text-[#15803d]",
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "ST",
    color: "text-[#635bff]",
    accentBg: "bg-[#f5f4ff]",
    accentBorder: "border-[#c7c3ff]",
    badgeColor: "bg-[#ede9fe] text-[#5b21b6]",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    logo: "PP",
    color: "text-[#7c3aed]",
    accentBg: "bg-[#faf5ff]",
    accentBorder: "border-[#ddd6fe]",
    badgeColor: "bg-[#ede9fe] text-[#6d28d9]",
  },
] as const;

type GatewayId = typeof GATEWAY_META[number]["id"];

type PaymentSettings = {
  accept: Record<GatewayId, { enabled: boolean; isDefault: boolean }>;
  refund: Record<GatewayId, { enabled: boolean; isDefault: boolean }>;
};

const DEFAULT_SETTINGS: PaymentSettings = {
  accept: {
    razorpay: { enabled: true, isDefault: true },
    cashfree: { enabled: false, isDefault: false },
    stripe: { enabled: false, isDefault: false },
    phonepe: { enabled: false, isDefault: false },
  },
  refund: {
    razorpay: { enabled: true, isDefault: true },
    cashfree: { enabled: false, isDefault: false },
    stripe: { enabled: false, isDefault: false },
    phonepe: { enabled: false, isDefault: false },
  },
};

function mergeSettings(raw: Partial<PaymentSettings> | null | undefined): PaymentSettings {
  if (!raw) return DEFAULT_SETTINGS;
  return {
    accept: { ...DEFAULT_SETTINGS.accept, ...(raw.accept || {}) },
    refund: { ...DEFAULT_SETTINGS.refund, ...(raw.refund || {}) },
  };
}

function GatewayCard({
  meta,
  config,
  configured,
  onToggleEnabled,
  onSetDefault,
}: {
  meta: typeof GATEWAY_META[number];
  config: { enabled: boolean; isDefault: boolean };
  configured?: boolean;
  onToggleEnabled: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      config.enabled ? `${meta.accentBg} ${meta.accentBorder}` : "border-[#e2e8f0] bg-white"
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl font-black text-[13px] border",
            config.enabled ? `${meta.accentBg} ${meta.accentBorder} ${meta.color}` : "bg-[#f1f5f9] border-[#e2e8f0] text-[#94a3b8]"
          )}>
            {meta.logo}
          </div>
          <div>
            <p className={cn("text-[14px] font-bold", config.enabled ? meta.color : "text-[#475569]")}>
              {meta.name}
            </p>
            {config.isDefault && config.enabled && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.badgeColor)}>
                <BadgeCheck className="h-3 w-3" /> Default
              </span>
            )}
            {configured === false && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">
                Keys missing
              </span>
            )}
          </div>
        </div>
        {/* Toggle */}
        <button type="button" onClick={onToggleEnabled}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all border",
            config.enabled
              ? `${meta.accentBorder} ${meta.color} ${meta.accentBg} hover:opacity-80`
              : "border-[#e2e8f0] bg-white text-[#94a3b8] hover:bg-[#f1f5f9]"
          )}
        >
          {config.enabled
            ? <><ToggleRight className="h-4 w-4" /> Enabled</>
            : <><ToggleLeft className="h-4 w-4" /> Disabled</>
          }
        </button>
      </div>

      {/* Set as default */}
      {config.enabled && !config.isDefault && (
        <button type="button" onClick={onSetDefault}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cbd5e1] py-2 text-[12px] font-semibold text-[#64748b] hover:border-[#94a3b8] hover:bg-white transition-colors"
        >
          <BadgeCheck className="h-3.5 w-3.5" /> Set as Default
        </button>
      )}
      {config.enabled && config.isDefault && (
        <div className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white/60 py-2 text-[12px] text-[#94a3b8]">
          <BadgeCheck className="h-3.5 w-3.5" /> Currently Default
        </div>
      )}
      {!config.enabled && (
        <div className="mt-1 flex w-full items-center justify-center rounded-lg bg-[#f8fafc] py-2 text-[12px] italic text-[#cbd5e1]">
          Enable to configure
        </div>
      )}
    </div>
  );
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [gatewayStatus, setGatewayStatus] = useState<Record<GatewayId, { configured: boolean }>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await (adminAPI as any).getPaymentSettings?.();
        if (!alive) return;
        if (res?.status) {
          setSettings(mergeSettings(res.data));
          if (res.gatewayStatus) setGatewayStatus(res.gatewayStatus);
        }
      } catch { /* use defaults */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      const res = await (adminAPI as any).updatePaymentSettings?.(settings);
      if (res?.status) {
        setToast({ type: "ok", text: "Payment settings saved." });
      } else {
        setToast({ type: "err", text: res?.message || "Could not save settings." });
      }
    } catch {
      setToast({ type: "err", text: "Could not reach the server." });
    }
    setSaving(false);
  }

  function toggleEnabled(section: "accept" | "refund", id: GatewayId) {
    setSettings((prev) => {
      const updated = { ...prev[section][id], enabled: !prev[section][id].enabled };
      // If disabling the default, clear isDefault
      if (!updated.enabled) updated.isDefault = false;
      // If no default remains after change, assign the first enabled one
      const next = { ...prev[section], [id]: updated };
      const hasDefault = Object.values(next).some((v) => v.isDefault && v.enabled);
      if (!hasDefault) {
        const firstEnabled = (Object.keys(next) as GatewayId[]).find((k) => next[k].enabled);
        if (firstEnabled) next[firstEnabled] = { ...next[firstEnabled], isDefault: true };
      }
      return { ...prev, [section]: next };
    });
  }

  function setDefault(section: "accept" | "refund", id: GatewayId) {
    setSettings((prev) => {
      const next = Object.fromEntries(
        (Object.keys(prev[section]) as GatewayId[]).map((k) => [k, { ...prev[section][k], isDefault: k === id }])
      ) as PaymentSettings["accept"];
      return { ...prev, [section]: next };
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  const sections: { key: "accept" | "refund"; label: string; description: string; icon: typeof CreditCard }[] = [
    {
      key: "accept",
      label: "Accept Payments",
      description: "Enable gateways used for collecting payments from customers.",
      icon: CreditCard,
    },
    {
      key: "refund",
      label: "Process Refunds",
      description: "Choose which gateways can initiate refunds back to customers.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-bold text-[#0f172a]">
            <CreditCard className="h-5 w-5 text-[#16a34a]" />
            Payment Settings
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Select active payment gateways for accepting and refunding transactions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setSettings(DEFAULT_SETTINGS); setToast(null); }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Defaults
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#16a34a] px-4 text-[13px] font-semibold text-white hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-[13px] font-medium",
          toast.type === "ok"
            ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
            : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
        )}>
          {toast.text}
        </div>
      )}

      {sections.map(({ key, label, description, icon: Icon }) => (
        <section key={key} className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="border-b border-[#f1f5f9] bg-[#f8fafc] px-5 py-3.5">
            <p className="flex items-center gap-2 text-[14px] font-bold text-[#0f172a]">
              <Icon className="h-4 w-4 text-[#16a34a]" />
              {label}
            </p>
            <p className="mt-0.5 text-[12px] text-[#64748b]">{description}</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {GATEWAY_META.map((meta) => (
              <GatewayCard
                key={meta.id}
                meta={meta}
                config={settings[key][meta.id]}
                configured={gatewayStatus[meta.id]?.configured}
                onToggleEnabled={() => toggleEnabled(key, meta.id)}
                onSetDefault={() => setDefault(key, meta.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Note */}
      <div className="flex items-start gap-3 rounded-xl border border-[#fef9c3] bg-[#fefce8] p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ca8a04]" />
        <p className="text-[12px] text-[#92400e] leading-relaxed">
          API keys, merchant IDs, and secret tokens must be configured via environment variables on the server
          and are never stored in the database for security reasons.
          Enabling a gateway here only activates it in the routing logic.
        </p>
      </div>
    </div>
  );
}
