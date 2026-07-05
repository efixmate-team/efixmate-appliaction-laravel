"use client";

import { useEffect, useState } from "react";
import {
  Bell, CheckCircle2, Loader2, Mail, MessageCircle, Phone, RotateCcw, Save, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminAPI } from "@/lib/api";

type Channel = "whatsapp" | "sms" | "email";
type NotifConfig = Record<Channel, boolean>;

type NotificationSettings = {
  otp: NotifConfig;
  bookingConfirmation: NotifConfig;
  paymentConfirmation: NotifConfig;
  technicianAssignment: NotifConfig;
  reminders: NotifConfig;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  otp: { whatsapp: false, sms: true, email: false },
  bookingConfirmation: { whatsapp: true, sms: true, email: true },
  paymentConfirmation: { whatsapp: true, sms: false, email: true },
  technicianAssignment: { whatsapp: true, sms: true, email: false },
  reminders: { whatsapp: false, sms: true, email: true },
};

const NOTIFICATION_TYPES: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "otp", label: "OTP / Verification", description: "One-time passwords for login and identity verification" },
  { key: "bookingConfirmation", label: "Booking Confirmation", description: "Sent when a booking is created or updated" },
  { key: "paymentConfirmation", label: "Payment Confirmation", description: "Sent after a successful or failed payment" },
  { key: "technicianAssignment", label: "Technician Assignment", description: "Notify customer when a technician is assigned" },
  { key: "reminders", label: "Reminders", description: "Service reminders and follow-up messages" },
];

const CHANNEL_META: { key: Channel; label: string; provider: string; icon: typeof MessageCircle; color: string; bg: string; border: string }[] = [
  { key: "whatsapp", label: "WhatsApp", provider: "Meta / WhatsApp Business API", icon: MessageCircle, color: "text-[#16a34a]", bg: "bg-[#f0fdf4]", border: "border-[#86efac]" },
  { key: "sms", label: "SMS", provider: "Twilio / MSG91 / TextLocal", icon: Phone, color: "text-[#0284c7]", bg: "bg-[#f0f9ff]", border: "border-[#7dd3fc]" },
  { key: "email", label: "Email", provider: "SMTP / SendGrid / Mailgun", icon: Mail, color: "text-[#7c3aed]", bg: "bg-[#faf5ff]", border: "border-[#c4b5fd]" },
];

function mergeSettings(raw: Partial<NotificationSettings> | null | undefined): NotificationSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const result = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NotificationSettings)[]) {
    if (raw[key]) result[key] = { ...DEFAULT_SETTINGS[key], ...raw[key] };
  }
  return result;
}

function ChannelToggle({
  channel,
  enabled,
  onToggle,
}: {
  channel: typeof CHANNEL_META[number];
  enabled: boolean;
  onToggle: () => void;
}) {
  const Icon = channel.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all w-full",
        enabled ? `${channel.bg} ${channel.border} shadow-sm` : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        enabled ? channel.bg : "bg-[#f1f5f9]"
      )}>
        <Icon className={cn("h-4 w-4", enabled ? channel.color : "text-[#94a3b8]")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-bold leading-tight", enabled ? channel.color : "text-[#475569]")}>
          {channel.label}
        </p>
        <p className="text-[11px] text-[#94a3b8] truncate">{channel.provider}</p>
      </div>
      <div className={cn(
        "shrink-0 rounded-full p-0.5 transition-colors",
        enabled ? channel.color : "text-[#cbd5e1]"
      )}>
        {enabled
          ? <CheckCircle2 className="h-5 w-5" />
          : <XCircle className="h-5 w-5" />
        }
      </div>
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await (adminAPI as any).getNotificationSettings?.();
        if (!alive) return;
        if (res?.status) setSettings(mergeSettings(res.data));
      } catch { /* endpoint not wired yet — use defaults */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      const res = await (adminAPI as any).updateNotificationSettings?.(settings);
      if (res?.status) {
        setToast({ type: "ok", text: "Notification settings saved." });
      } else {
        setToast({ type: "err", text: res?.message || "Could not save settings." });
      }
    } catch {
      setToast({ type: "err", text: "Could not reach the server." });
    }
    setSaving(false);
  }

  function toggle(type: keyof NotificationSettings, channel: Channel) {
    setSettings((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type][channel] },
    }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-bold text-[#0f172a]">
            <Bell className="h-5 w-5 text-[#7c3aed]" />
            Notification Settings
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Choose which channels to use for each notification type.
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
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#7c3aed] px-4 text-[13px] font-semibold text-white hover:bg-[#6d28d9] disabled:opacity-60"
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

      {/* Channel legend */}
      <div className="flex flex-wrap gap-3">
        {CHANNEL_META.map((ch) => {
          const Icon = ch.icon;
          return (
            <div key={ch.key} className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2", ch.bg, ch.border)}>
              <Icon className={cn("h-3.5 w-3.5", ch.color)} />
              <span className={cn("text-[12px] font-bold", ch.color)}>{ch.label}</span>
              <span className="text-[11px] text-[#94a3b8]">{ch.provider}</span>
            </div>
          );
        })}
      </div>

      {/* Notification type rows */}
      {NOTIFICATION_TYPES.map((notif) => (
        <section key={notif.key} className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="border-b border-[#f1f5f9] bg-[#f8fafc] px-5 py-3.5">
            <p className="text-[14px] font-bold text-[#0f172a]">{notif.label}</p>
            <p className="text-[12px] text-[#64748b]">{notif.description}</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {CHANNEL_META.map((channel) => (
              <ChannelToggle
                key={channel.key}
                channel={channel}
                enabled={settings[notif.key][channel.key]}
                onToggle={() => toggle(notif.key, channel.key)}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="text-[11px] text-[#94a3b8]">
        Provider credentials (API keys, sender IDs, SMTP config) are configured via environment variables on the server.
      </p>
    </div>
  );
}
