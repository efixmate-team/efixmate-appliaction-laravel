"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  IndianRupee,
  Loader2,
  Share2,
  Users,
} from "lucide-react";
import { applyReferralCode, getReferral } from "@/lib/api/userClient";

type ReferralRow = {
  id: number | string;
  name: string;
  type: string;
  status: string;
  reward: number;
  joined_at?: string;
  rewarded_at?: string | null;
};

type ReferralPayload = {
  referral_code?: string;
  config?: {
    enabled?: boolean;
    referrer_reward?: number;
    referred_reward?: number;
    trigger?: string;
  };
  stats?: {
    total_referrals?: number;
    rewarded?: number;
    pending?: number;
    total_earned?: number;
    referrals?: ReferralRow[];
  };
};

type ApiResponse<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

function money(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeToApply, setCodeToApply] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  const loadReferral = async () => {
    setLoading(true);
    setError("");
    const res = (await getReferral()) as ApiResponse<ReferralPayload>;
    if (res.status === false) {
      setError(res.message || "Could not load referral details.");
      setData(null);
    } else {
      setData(res.data || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReferral();
  }, []);

  const referralCode = data?.referral_code || "";
  const referrals = useMemo(
    () => data?.stats?.referrals || [],
    [data?.stats?.referrals],
  );

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareCode = async () => {
    if (!referralCode) return;
    const text = `Use my eFixMate referral code ${referralCode}`;
    if (navigator.share) {
      await navigator.share({ title: "eFixMate referral", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const submitApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = codeToApply.trim().toUpperCase();
    if (!trimmed) return;
    setApplying(true);
    setApplyMessage("");
    const res = (await applyReferralCode(trimmed)) as ApiResponse<unknown>;
    setApplying(false);
    if (res.status === false) {
      setApplyMessage(res.message || "Could not apply referral code.");
      return;
    }
    setCodeToApply("");
    setApplyMessage(res.message || "Referral code applied.");
    await loadReferral();
  };

  return (
    <main className="min-h-full bg-[#f8fafc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center gap-3">
          <Link
            href="/profile"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e2e8f0] bg-[#ffffff] text-[#334155]"
            aria-label="Back to profile"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[20px] font-black text-[#0f172a] sm:text-[24px]">
              Refer &amp; Earn
            </h1>
            <p className="mt-0.5 text-[13px] text-[#64748b]">
              Invite friends and track your rewards.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-[#ffffff]">
            <Loader2 className="h-7 w-7 animate-spin text-[#0e55d9]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#ffffff] p-6 text-[14px] font-semibold text-[#b91c1c]">
            {error}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-5">
              <div className="rounded-2xl bg-[#0f172a] p-5 text-[#ffffff] shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22c55e]">
                      <Gift size={21} />
                    </div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#cbd5e1]">
                      Your referral code
                    </p>
                    <p className="mt-1 break-all text-[34px] font-black tracking-normal text-[#ffffff] sm:text-[42px]">
                      {referralCode || "Unavailable"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyCode}
                      disabled={!referralCode}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ffffff] px-4 text-[13px] font-black text-[#0f172a] disabled:opacity-50"
                    >
                      {copied ? <Check size={17} /> : <Copy size={17} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={shareCode}
                      disabled={!referralCode}
                      className="grid h-11 w-11 place-items-center rounded-xl bg-[#2563eb] text-[#ffffff] disabled:opacity-50"
                      aria-label="Share referral code"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
                  <Users className="mb-3 h-5 w-5 text-[#0e55d9]" />
                  <p className="text-[12px] font-semibold text-[#64748b]">Total referrals</p>
                  <p className="mt-1 text-[24px] font-black text-[#0f172a]">
                    {Number(data?.stats?.total_referrals || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
                  <Check className="mb-3 h-5 w-5 text-[#16a34a]" />
                  <p className="text-[12px] font-semibold text-[#64748b]">Rewarded</p>
                  <p className="mt-1 text-[24px] font-black text-[#0f172a]">
                    {Number(data?.stats?.rewarded || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
                  <IndianRupee className="mb-3 h-5 w-5 text-[#ca8a04]" />
                  <p className="text-[12px] font-semibold text-[#64748b]">Total earned</p>
                  <p className="mt-1 text-[24px] font-black text-[#0f172a]">
                    {money(data?.stats?.total_earned)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff]">
                <div className="border-b border-[#e2e8f0] px-4 py-3">
                  <h2 className="text-[15px] font-black text-[#0f172a]">
                    Recent referrals
                  </h2>
                </div>
                {referrals.length ? (
                  <div className="divide-y divide-[#e2e8f0]">
                    {referrals.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#0f172a]">
                            {row.name}
                          </p>
                          <p className="text-[12px] text-[#64748b]">
                            {row.type} {formatDate(row.joined_at) ? `- ${formatDate(row.joined_at)}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-black text-[#0f172a]">
                            {money(row.reward)}
                          </p>
                          <span className="text-[11px] font-bold uppercase text-[#64748b]">
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-10 text-center text-[13px] font-semibold text-[#64748b]">
                    No referrals yet.
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4">
                <h2 className="text-[15px] font-black text-[#0f172a]">
                  Reward details
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-[#64748b]">You earn</span>
                    <span className="text-[15px] font-black text-[#0f172a]">
                      {money(data?.config?.referrer_reward)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-[#64748b]">Friend gets</span>
                    <span className="text-[15px] font-black text-[#0f172a]">
                      {money(data?.config?.referred_reward)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-[#64748b]">Status</span>
                    <span className="text-[12px] font-black uppercase text-[#16a34a]">
                      {data?.config?.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={submitApply}
                className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-4"
              >
                <h2 className="text-[15px] font-black text-[#0f172a]">
                  Apply a code
                </h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={codeToApply}
                    onChange={(event) => setCodeToApply(event.target.value)}
                    placeholder="EFXABC123"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#e2e8f0] px-3 text-[13px] font-bold uppercase outline-none focus:border-[#0e55d9] focus:ring-2 focus:ring-[#0e55d9]/10"
                  />
                  <button
                    type="submit"
                    disabled={applying || !codeToApply.trim()}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-[#0e55d9] text-[#ffffff] disabled:opacity-50"
                    aria-label="Apply referral code"
                  >
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={17} />}
                  </button>
                </div>
                {applyMessage && (
                  <p className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-[12px] font-semibold text-[#475569]">
                    {applyMessage}
                  </p>
                )}
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
