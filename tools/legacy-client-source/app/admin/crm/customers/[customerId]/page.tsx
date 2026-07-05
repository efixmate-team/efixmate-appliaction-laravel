"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CrmShell } from "../../(components)/CrmShell";
import { ActivityTimeline } from "../../(components)/ActivityTimeline";
import { useCustomer360, useCustomerTimeline } from "@/src/features/crm/hooks/useCrm";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { COMM_CHANNELS } from "@/src/features/crm/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/app/admin/(components)/Forms/Input";
import { BookingsPanel } from "./(components)/BookingsPanel";

type Tab = "timeline" | "wallet" | "loyalty" | "referrals" | "notes" | "comms" | "block" | "bookings";

export default function CrmCustomer360Page() {
  const params = useParams();
  const customerId = Number(params.customerId);
  const { data, loading, refresh } = useCustomer360(customerId);
  const { events, loading: timelineLoading } = useCustomerTimeline(customerId);

  const [tab, setTab] = useState<Tab>("timeline");
  const [wallet, setWallet] = useState<{ wallet?: { balance?: number }; ledger?: { rows?: unknown[] } } | null>(null);
  const [loyalty, setLoyalty] = useState<{ balance?: { points_balance?: number; tier?: string }; ledger?: { rows?: unknown[] } } | null>(null);
  const [referrals, setReferrals] = useState<{ events?: unknown[]; invites?: unknown[] } | null>(null);
  const [notes, setNotes] = useState<unknown[]>([]);
  const [comms, setComms] = useState<unknown[]>([]);
  const [blockHistory, setBlockHistory] = useState<unknown[]>([]);
  const [msg, setMsg] = useState("");

  const customer = (data?.customer || {}) as Record<string, unknown>;
  const name = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

  const loadTab = useCallback(async () => {
    if (!customerId) return;
    if (tab === "wallet") {
      const res = await adminOperationalAPI.crm.wallet(customerId);
      if (res.status && res.data) setWallet(res.data as typeof wallet);
    }
    if (tab === "loyalty") {
      const res = await adminOperationalAPI.crm.loyalty(customerId);
      if (res.status && res.data) setLoyalty(res.data as typeof loyalty);
    }
    if (tab === "referrals") {
      const res = await adminOperationalAPI.crm.referrals(customerId);
      if (res.status && res.data) setReferrals(res.data as typeof referrals);
    }
    if (tab === "notes") {
      const res = await adminOperationalAPI.crm.notes(customerId);
      if (res.status && res.data) setNotes(Array.isArray(res.data) ? res.data : []);
    }
    if (tab === "comms") {
      const res = await adminOperationalAPI.crm.communications(customerId);
      if (res.status && res.data) setComms((res.data as { rows?: unknown[] }).rows || []);
    }
    if (tab === "block") {
      const res = await adminOperationalAPI.crm.blockHistory(customerId);
      if (res.status && res.data) setBlockHistory(Array.isArray(res.data) ? res.data : []);
    }
  }, [tab, customerId]);

  useEffect(() => {
    void loadTab();
  }, [loadTab]);

  const fmt = (n: number | undefined) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const handleBlock = async () => {
    const reason = window.prompt("Block reason?");
    if (!reason) return;
    const res = await adminOperationalAPI.crm.block(customerId, { reason });
    setMsg(res.message || (res.status ? "Blocked" : "Failed"));
    void refresh();
    void loadTab();
  };

  const handleUnblock = async () => {
    const res = await adminOperationalAPI.crm.unblock(customerId, { reason: "Admin unblock" });
    setMsg(res.message || (res.status ? "Unblocked" : "Failed"));
    void refresh();
    void loadTab();
  };

  const handleSpamScan = async () => {
    const res = await adminOperationalAPI.crm.spamScan(customerId);
    setMsg(res.status ? `Spam scan complete (score updated)` : res.message || "Scan failed");
    void refresh();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "timeline", label: "Activity" },
    { id: "bookings", label: "Bookings" },
    { id: "wallet", label: "Wallet" },
    { id: "loyalty", label: "Loyalty" },
    { id: "referrals", label: "Referrals" },
    { id: "notes", label: "Notes" },
    { id: "comms", label: "Communications" },
    { id: "block", label: "Block / Spam" },
  ];

  return (
    <CrmShell
      title={loading ? "Customer 360°" : name || `Customer #${customerId}`}
      description={String(customer.mobile_number || "")}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/crm/customers">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => void handleSpamScan()}>
            Spam scan
          </Button>
          {customer.is_blocked ? (
            <Button size="sm" onClick={() => void handleUnblock()}>
              Unblock
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => void handleBlock()}>
              Block
            </Button>
          )}
        </div>
      }
    >
      {msg ? <p className="text-sm text-[#475569]">{msg}</p> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">CLV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-[#047857]">
              {fmt(Number(customer.lifetime_value || 0))}
            </p>
            <p className="text-xs text-[#53697e]">{Number(customer.total_bookings || 0)} bookings</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Loyalty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{Number(customer.points_balance || customer.loyalty_points || 0)}</p>
            <p className="text-xs text-[#53697e]">Tier: {String(customer.tier || "standard")}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {customer.spam_flag ? (
                <span className="text-[#b45309]">Spam {Number(customer.spam_score || 0)}</span>
              ) : (
                <span className="text-[#334155]">{Number(customer.spam_score || 0)}</span>
              )}
            </p>
            <p className="text-xs text-[#53697e]">
              {customer.is_blocked ? "Blocked" : "Active"} · {Number(data?.open_complaints || 0)} open complaints
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{fmt(Number((data?.wallet as { balance?: number })?.balance || 0))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[#e2e8f0]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id ? "border-b-2 border-[#0284c7] text-[#0369a1]" : "text-[#53697e]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4">
        {tab === "timeline" && (
          <ActivityTimeline events={events} loading={timelineLoading} />
        )}

        {tab === "bookings" && (
          <BookingsPanel customerId={customerId} />
        )}

        {tab === "wallet" && (
          <WalletPanel customerId={customerId} wallet={wallet} onDone={() => void loadTab()} />
        )}

        {tab === "loyalty" && (
          <LoyaltyPanel customerId={customerId} loyalty={loyalty} onDone={() => void loadTab()} />
        )}

        {tab === "referrals" && (
          <div className="space-y-4 text-sm">
            <h3 className="font-medium">Referral events</h3>
            {(referrals?.events as unknown[])?.length ? (
              <ul className="space-y-2">
                {(referrals?.events as Record<string, unknown>[]).map((e) => (
                  <li key={String(e.referral_id)} className="rounded-lg bg-[#f8fafc] p-2">
                    {String(e.event_type)} · {String(e.status)} · {String(e.reward_points)} pts
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#53697e]">No referral events.</p>
            )}
            <h3 className="font-medium">Invites</h3>
            {(referrals?.invites as unknown[])?.length ? (
              <ul className="space-y-2">
                {(referrals?.invites as Record<string, unknown>[]).map((i) => (
                  <li key={String(i.invite_id)} className="rounded-lg bg-[#f8fafc] p-2">
                    {String(i.invitee_mobile)} · {String(i.status)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#53697e]">No invites sent.</p>
            )}
          </div>
        )}

        {tab === "notes" && (
          <NotesPanel customerId={customerId} notes={notes} onDone={() => void loadTab()} />
        )}

        {tab === "comms" && (
          <CommsPanel customerId={customerId} comms={comms} onDone={() => void loadTab()} />
        )}

        {tab === "block" && (
          <div className="space-y-3 text-sm">
            <p>
              Status:{" "}
              <strong>{customer.is_blocked ? "Blocked" : "Active"}</strong>
              {customer.blocked_reason ? ` — ${String(customer.blocked_reason)}` : ""}
            </p>
            <h3 className="font-medium">Block history</h3>
            <ul className="space-y-2">
              {(blockHistory as Record<string, unknown>[]).map((h) => (
                <li key={String(h.history_id)} className="rounded-lg bg-[#f8fafc] p-2">
                  {String(h.action)} · {new Date(String(h.created_at)).toLocaleString()}
                  {h.reason ? ` — ${String(h.reason)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CrmShell>
  );
}

function WalletPanel({
  customerId,
  wallet,
  onDone,
}: {
  customerId: number;
  wallet: { wallet?: { balance?: number }; ledger?: { rows?: unknown[] } } | null;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const credit = async () => {
    const res = await adminOperationalAPI.crm.creditWallet(customerId, {
      amount: Number(amount),
      note,
    });
    if (res.status) {
      setAmount("");
      onDone();
    } else alert(res.message);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">Balance: ₹{Number(wallet?.wallet?.balance || 0).toFixed(2)}</p>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Credit amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="max-w-[140px]" />
        <Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-xs" />
        <Button size="sm" onClick={() => void credit()}>
          Credit wallet
        </Button>
      </div>
      <ul className="space-y-1 text-sm">
        {((wallet?.ledger?.rows || []) as Record<string, unknown>[]).map((r) => (
          <li key={String(r.ledger_id)} className="flex justify-between border-b border-[#f1f5f9] py-1">
            <span>{String(r.entry_type)}</span>
            <span>₹{Number(r.amount).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoyaltyPanel({
  customerId,
  loyalty,
  onDone,
}: {
  customerId: number;
  loyalty: { balance?: { points_balance?: number; tier?: string }; ledger?: { rows?: unknown[] } } | null;
  onDone: () => void;
}) {
  const [points, setPoints] = useState("");

  const adjust = async () => {
    const res = await adminOperationalAPI.crm.adjustLoyalty(customerId, {
      points: Number(points),
      note: "Admin adjustment",
    });
    if (res.status) {
      setPoints("");
      onDone();
    } else alert(res.message);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">
        {loyalty?.balance?.points_balance ?? 0} pts · {loyalty?.balance?.tier || "standard"}
      </p>
      <div className="flex gap-2">
        <Input placeholder="+/- points" value={points} onChange={(e) => setPoints(e.target.value)} className="max-w-[120px]" />
        <Button size="sm" onClick={() => void adjust()}>
          Adjust
        </Button>
      </div>
      <ul className="space-y-1 text-sm">
        {((loyalty?.ledger?.rows || []) as Record<string, unknown>[]).map((r) => (
          <li key={String(r.ledger_id)} className="flex justify-between border-b border-[#f1f5f9] py-1">
            <span>{String(r.entry_type)}</span>
            <span>
              {Number(r.points_delta) > 0 ? "+" : ""}
              {String(r.points_delta)} → {String(r.balance_after)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesPanel({
  customerId,
  notes,
  onDone,
}: {
  customerId: number;
  notes: unknown[];
  onDone: () => void;
}) {
  const [text, setText] = useState("");

  const add = async () => {
    const res = await adminOperationalAPI.crm.addNote(customerId, { note: text, isPinned: false });
    if (res.status) {
      setText("");
      onDone();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Add note…" value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
        <Button size="sm" onClick={() => void add()}>
          Save
        </Button>
      </div>
      <ul className="space-y-2">
        {(notes as Record<string, unknown>[]).map((n) => (
          <li key={String(n.note_id)} className="rounded-lg bg-[#f8fafc] p-3 text-sm">
            {n.is_pinned ? <span className="text-xs text-[#d97706]">Pinned · </span> : null}
            {String(n.note)}
            <p className="mt-1 text-xs text-[#94a3b8]">{new Date(String(n.created_at)).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommsPanel({
  customerId,
  comms,
  onDone,
}: {
  customerId: number;
  comms: unknown[];
  onDone: () => void;
}) {
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = async () => {
    const res = await adminOperationalAPI.crm.addCommunication(customerId, {
      channel,
      direction: "outbound",
      subject,
      body,
    });
    if (res.status) {
      setSubject("");
      setBody("");
      onDone();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="rounded border border-[#e2e8f0] px-2 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
          {COMM_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Input placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} className="sm:col-span-2" />
        <Button size="sm" onClick={() => void send()}>
          Log communication
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        {(comms as Record<string, unknown>[]).map((c) => (
          <li key={String(c.comm_id)} className="rounded-lg bg-[#f8fafc] p-2">
            <strong>{String(c.channel)}</strong> · {String(c.direction)} · {String(c.subject || "")}
            <p className="text-[#475569]">{String(c.body || "")}</p>
            <p className="text-xs text-[#94a3b8]">{new Date(String(c.created_at)).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
