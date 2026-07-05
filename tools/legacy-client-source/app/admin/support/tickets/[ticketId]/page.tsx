"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import { useTicketDetail } from "@/src/features/support/hooks/useSupportTickets";
import { useSupportSocket } from "@/src/features/support/hooks/useSupportSocket";
import { TICKET_PRIORITIES, TICKET_STATUSES, SENDER_TYPE_OPTIONS } from "@/src/features/support/constants";
import { validateInternalNote, validateReply } from "@/src/features/support/validation";
import type { TicketSource } from "@/src/features/support/types";
import Select from "@/app/admin/(components)/Forms/Select";
import Input from "@/app/admin/(components)/Forms/Input";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import { SupportShell } from "../../(components)/SupportShell";
import { TicketStatusBadge } from "../../(components)/TicketStatusBadge";
import { PriorityBadge } from "../../(components)/PriorityBadge";
import { TicketChat } from "../../(components)/TicketChat";
import { TicketTimeline } from "../../(components)/TicketTimeline";
import { TableSkeleton } from "../../(components)/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function TicketDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ticketId = Number(params.ticketId);
  const ticketSource = (searchParams.get("source") || "customer") as TicketSource;
  const toast = useToast();
  const canAssign = usePermission("/admin/support", "ASSIGN");
  const canEscalate = usePermission("/admin/support", "ESCALATE");

  const { detail, loading, error, refresh } = useTicketDetail(ticketId, ticketSource);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [assignAdminId, setAssignAdminId] = useState("");
  const [senderType, setSenderType] = useState("admin");
  const [escalationNote, setEscalationNote] = useState("");

  useSupportSocket({
    ticketId,
    ticketSource,
    onUpdate: () => refresh(),
    onReply: () => refresh(),
  });

  const ticket = detail?.ticket;

  const sendReply = async (message: string, files: File[]) => {
    const v = validateReply(message);
    if (!v.ok && files.length === 0) {
      toast.error("Validation", v.message);
      return;
    }
    setSending(true);
    const fd = new FormData();
    fd.append("ticketSource", ticketSource);
    fd.append("message", message);
    fd.append("senderType", senderType);
    files.forEach((f) => fd.append("attachments", f));
    const res = await adminOperationalAPI.support.replyForm(ticketId, fd);
    setSending(false);
    if (res.status) {
      toast.success("Reply sent");
      refresh();
    } else toast.error("Send failed", res.message);
  };

  const addNote = async () => {
    const v = validateInternalNote(note);
    if (!v.ok) {
      toast.error("Validation", v.message);
      return;
    }
    const res = await adminOperationalAPI.support.internalNote(ticketId, { ticketSource, note });
    if (res.status) {
      toast.success("Note saved");
      setNote("");
      refresh();
    } else toast.error("Failed", res.message);
  };

  const updateStatus = async (status: string) => {
    const res = await adminOperationalAPI.support.updateStatus(ticketId, { ticketSource, status });
    if (res.status) {
      toast.success("Status updated");
      refresh();
    } else toast.error("Failed", res.message);
  };

  const assign = async () => {
    if (!canAssign) return;
    const res = await adminOperationalAPI.support.assign({
      ticketId,
      ticketSource,
      adminId: assignAdminId ? Number(assignAdminId) : undefined,
    });
    if (res.status) {
      toast.success("Ticket assigned");
      refresh();
    } else toast.error("Failed", res.message);
  };

  const escalate = async () => {
    if (!canEscalate) return;
    const res = await adminOperationalAPI.support.escalate({
      ticketId,
      ticketSource,
      note: escalationNote,
    });
    if (res.status) {
      toast.success("Ticket escalated");
      setEscalationNote("");
      refresh();
    } else toast.error("Failed", res.message);
  };

  if (loading && !detail) {
    return (
      <SupportShell title="Loading ticket…">
        <TableSkeleton rows={6} />
      </SupportShell>
    );
  }

  if (error || !ticket) {
    return (
      <SupportShell title="Ticket not found">
        <p className="text-sm text-[#dc2626]">{error || "Ticket could not be loaded."}</p>
      </SupportShell>
    );
  }

  const slaBreached =
    ticket.sla_due_at &&
    new Date(String(ticket.sla_due_at)) < new Date() &&
    !["resolved", "closed"].includes(String(ticket.status));

  return (
    <SupportShell
      title={String(ticket.ticket_number || `Ticket #${ticketId}`)}
      description={String(ticket.subject)}
      actions={
        <div className="flex flex-wrap gap-2">
          <TicketStatusBadge status={String(ticket.status)} />
          <PriorityBadge priority={String(ticket.priority || "normal")} />
          {slaBreached ? <Badge variant="danger">SLA breached</Badge> : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 max-w-xs">
                <Select
                  title="Reply as"
                  value={senderType}
                  onChange={(e) => setSenderType(e.target.value)}
                  options={SENDER_TYPE_OPTIONS}
                />
              </div>
              <TicketChat replies={detail.replies} onSend={sendReply} sending={sending} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#475569]">
              <p>
                <span className="font-medium text-[#1e293b]">Requester:</span> {String(ticket.requester_name)}
              </p>
              <p>
                <span className="font-medium text-[#1e293b]">Source:</span> {ticketSource}
              </p>
              <p>
                <span className="font-medium text-[#1e293b]">Category:</span> {String(ticket.category_name || "—")}
              </p>
              {ticket.sla_due_at ? (
                <p>
                  <span className="font-medium text-[#1e293b]">SLA due:</span>{" "}
                  {new Date(String(ticket.sla_due_at)).toLocaleString()}
                </p>
              ) : null}
              {detail.slaPolicy ? (
                <p className="text-xs text-[#5c6a7f]">
                  Policy: {detail.slaPolicy.first_response_minutes}m first response ·{" "}
                  {detail.slaPolicy.resolution_minutes}m resolution
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                title="Update status"
                value={String(ticket.status)}
                onChange={(e) => void updateStatus(e.target.value)}
                options={TICKET_STATUSES.filter((s) => s.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                title="Admin ID"
                value={assignAdminId}
                onChange={(e) => setAssignAdminId(e.target.value)}
                placeholder="Leave empty for self"
              />
              <Button size="sm" variant="outline" onClick={() => void assign()} disabled={!canAssign}>
                Assign
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                title="Reason"
                name="escalation"
                id="escalation"
                placeholder="Escalation reason"
                className=""
                maxLength={1000}
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                rows={2}
              />
              <Button size="sm" variant="destructive" onClick={() => void escalate()} disabled={!canEscalate}>
                Escalate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="max-h-32 space-y-2 overflow-y-auto text-xs text-[#475569]">
                {detail.internalNotes.map((n) => (
                  <li key={n.note_id} className="rounded-lg bg-[#fffbeb] p-2">
                    <p>{n.note}</p>
                    <p className="mt-1 text-[#5c6a7f]">
                      {[n.first_name, n.last_name].filter(Boolean).join(" ")} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              <Textarea
                title="Add note"
                name="note"
                id="note"
                placeholder="Visible to admins only"
                className=""
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={() => void addNote()}>
                Save note
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTimeline events={detail.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </SupportShell>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <SupportShell title="Ticket">
          <TableSkeleton rows={6} />
        </SupportShell>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
