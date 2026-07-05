"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Smartphone,
  UserPlus,
  CalendarCheck,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RangeKey = "7d" | "30d" | "90d" | "year";

interface RateMetric {
  label: string;
  rate: number;
  numerator: number;
  denominator: number | null;
}

interface CacMetric {
  label: string;
  spend: number;
  new_customers: number;
  value: number | null;
}

interface TrackerData {
  range: RangeKey;
  app_install: RateMetric;
  registration: RateMetric;
  booking: RateMetric;
  repeat_customer: RateMetric;
  tech_acceptance: RateMetric;
  cac: CacMetric;
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "Year" },
];

const CARD_CONFIG = [
  {
    key: "app_install" as const,
    icon: Smartphone,
    color: "#3b82f6",
    bg: "#eff6ff",
    isRate: true,
  },
  {
    key: "registration" as const,
    icon: UserPlus,
    color: "#10b981",
    bg: "#ecfdf5",
    isRate: false,
  },
  {
    key: "booking" as const,
    icon: CalendarCheck,
    color: "#6366f1",
    bg: "#eef2ff",
    isRate: true,
  },
  {
    key: "repeat_customer" as const,
    icon: RefreshCw,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    isRate: true,
  },
  {
    key: "tech_acceptance" as const,
    icon: CheckCircle2,
    color: "#0d9488",
    bg: "#f0fdfa",
    isRate: true,
  },
] as const;

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-[#e2e8f0]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[#e2e8f0]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 animate-pulse rounded bg-[#e2e8f0]" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[#f1f5f9]" />
      </CardContent>
    </Card>
  );
}

function RateCard({
  data,
  icon: Icon,
  color,
  bg,
  isRate,
}: {
  data: RateMetric;
  icon: React.ElementType;
  color: string;
  bg: string;
  isRate: boolean;
}) {
  const primary = isRate ? `${data.rate}%` : data.numerator.toLocaleString("en-IN");
  const sub =
    isRate && data.denominator !== null
      ? `${data.numerator.toLocaleString("en-IN")} of ${data.denominator.toLocaleString("en-IN")}`
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: bg }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <CardTitle className="text-sm font-medium text-[#64748b]">
            {data.label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-[#0f172a]">{primary}</p>
        {sub ? (
          <p className="mt-1 text-xs text-[#94a3b8]">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CacCard({
  data,
  onSpendSaved,
}: {
  data: CacMetric;
  onSpendSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    () => new Date().toISOString().slice(0, 7) + "-01"
  );
  const [spend, setSpend] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!spend || isNaN(Number(spend))) return;
    setSaving(true);
    await adminOperationalAPI.tracker.setSpend({
      period_month: month,
      spend: Number(spend),
    });
    setSaving(false);
    setOpen(false);
    setSpend("");
    onSpendSaved();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7ed]">
            <TrendingUp className="h-5 w-5 text-[#f97316]" />
          </div>
          <CardTitle className="text-sm font-medium text-[#64748b]">
            Customer Acquisition Cost
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.value !== null ? (
          <>
            <p className="text-2xl font-bold text-[#0f172a]">
              ₹{Number(data.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              ₹{Number(data.spend).toLocaleString("en-IN")} spend ÷{" "}
              {data.new_customers.toLocaleString("en-IN")} customers
            </p>
          </>
        ) : (
          <p className="text-2xl font-bold text-[#cbd5e1]">₹—</p>
        )}

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-xs text-[#0284c7] underline-offset-2 hover:underline"
          >
            {data.spend > 0 ? "Update spend →" : "Set marketing spend →"}
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <input
              type="month"
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              value={month.slice(0, 7)}
              onChange={(e) => setMonth(e.target.value + "-01")}
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrackerPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    const res = await adminOperationalAPI.tracker.metrics({ range: r });
    if (res.status && res.data) {
      setData(res.data as TrackerData);
    } else {
      setError(res.message || "Failed to load tracker metrics.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">Tracker</h1>
            <p className="mt-0.5 text-sm text-[#53697e]">
              Key business-health metrics across the platform.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(range)}
          disabled={loading}
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Range selector */}
      <nav className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              range === opt.key
                ? "bg-white text-[#0f172a] shadow-sm"
                : "text-[#53697e] hover:text-[#1e293b]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </nav>

      {/* Error */}
      {error ? (
        <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </p>
      ) : null}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading || !data
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : [
              ...CARD_CONFIG.map((cfg) => (
                <RateCard
                  key={cfg.key}
                  data={data[cfg.key] as RateMetric}
                  icon={cfg.icon}
                  color={cfg.color}
                  bg={cfg.bg}
                  isRate={cfg.isRate}
                />
              )),
              <CacCard
                key="cac"
                data={data.cac}
                onSpendSaved={() => void load(range)}
              />,
            ]}
      </div>
    </div>
  );
}
