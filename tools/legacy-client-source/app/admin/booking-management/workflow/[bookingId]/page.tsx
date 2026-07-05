"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Input from "@/app/admin/(components)/Forms/Input";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import { BookingShell } from "../(components)/BookingShell";
import { BookingTimeline } from "../(components)/BookingTimeline";
import { FraudIndicators } from "../(components)/FraudIndicators";
import { DispatchModal } from "../(components)/DispatchModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import {
  parseTechnicianIds,
  validateInternalNote,
  validateReschedule,
} from "@/src/features/bookings/validation";
import { useBookingDetail, useBookingTagsCatalog } from "@/src/features/bookings/hooks/useBookingWorkflow";

export default function BookingWorkflowDetailPage() {
  const params = useParams();
  const bookingId = Number(params.bookingId);
  const toast = useToast();
  const { detail, loading, error, refresh } = useBookingDetail(bookingId);
  const tagCatalog = useBookingTagsCatalog();

  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [note, setNote] = useState("");
  const [techIds, setTechIds] = useState("");
  const [primaryTech, setPrimaryTech] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const booking = detail?.booking as Record<string, unknown> | undefined;

  const act = async (fn: () => Promise<{ status: boolean; message?: string }>, okMsg: string) => {
    const res = await fn();
    if (res.status) {
      toast.success(okMsg);
      refresh();
    } else toast.error(res.message || "Action failed");
  };

  const submitNote = () => {
    const err = validateInternalNote(note);
    if (err) return toast.error(err);
    void act(() => adminOperationalAPI.bookings.internalNote(bookingId, { note }), "Note added");
    setNote("");
  };

  const submitMultiAssign = () => {
    const ids = parseTechnicianIds(techIds);
    if (!ids.length) return toast.error("Enter technician IDs (comma-separated)");
    void act(
      () =>
        adminOperationalAPI.bookings.assignMultiple(bookingId, {
          technicianIds: ids,
          primaryTechnicianId: primaryTech ? Number(primaryTech) : ids[0],
        }),
      "Technicians assigned"
    );
  };

  const submitReschedule = () => {
    const err = validateReschedule(scheduledDate);
    if (err) return toast.error(err);
    void act(
      () => adminOperationalAPI.bookings.reschedule(bookingId, { scheduledDate, scheduledTime }),
      "Booking rescheduled"
    );
  };

  const submitTags = () => {
    void act(() => adminOperationalAPI.bookings.setTags(bookingId, { tagIds: selectedTags }), "Tags updated");
  };

  if (loading && !detail) {
    return (
      <BookingShell title="Loading…">
        <p className="text-sm text-[#53697e]">Loading booking…</p>
      </BookingShell>
    );
  }

  if (error || !detail || !booking) {
    return (
      <BookingShell title="Booking not found">
        <p className="text-sm text-[#dc2626]">{error || "Not found"}</p>
        <Link href="/admin/booking-management/workflow" className="text-sm text-[#2563eb]">
          Back to queue
        </Link>
      </BookingShell>
    );
  }

  return (
    <BookingShell
      title={String(booking.booking_uid || `Booking #${bookingId}`)}
      description={`${booking.customer_name} · ${booking.service_name}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/booking-management/workflow">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void act(() => adminOperationalAPI.bookings.autoAssign(bookingId), "Auto-assigned")}
          >
            Auto-assign
          </Button>
          <Button
            size="sm"
            onClick={() => setDispatchOpen(true)}
          >
            Dispatch
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void act(() => adminOperationalAPI.bookings.emergency(bookingId, {}), "Marked emergency")}
          >
            Emergency
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void act(
                () => adminOperationalAPI.bookings.escalate({ bookingId, reason: "Workflow escalation" }),
                "Escalated"
              )
            }
          >
            Escalate
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Status & SLA</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{String(booking.lifecycle_state)}</Badge>
              <Badge variant="secondary">{String(booking.status_name)}</Badge>
              {booking.is_emergency ? <Badge variant="danger">Emergency</Badge> : null}
              {booking.sla_due_at ? (
                <span className="text-[#475569]">SLA due {new Date(String(booking.sla_due_at)).toLocaleString()}</span>
              ) : null}
              <span className="text-[#475569]">
                Scheduled {new Date(String(booking.scheduled_date)).toLocaleDateString()}{" "}
                {booking.scheduled_time ? String(booking.scheduled_time) : ""}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTimeline events={detail.timeline} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-[#334155]">
                {detail.internalNotes.map((n) => (
                  <li key={n.note_id} className="rounded-lg border border-[#e2e8f0] p-2">
                    <p>{n.note}</p>
                    <p className="text-xs text-[#94a3b8]">
                      {[n.first_name, n.last_name].filter(Boolean).join(" ") || "Admin"} ·{" "}
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              <Textarea title="Add note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              <Button size="sm" onClick={submitNote}>
                Save note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {detail.fraud ? <FraudIndicators fraud={detail.fraud} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>Technicians</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {detail.technicians.length ? (
                detail.technicians.map((t) => (
                  <div key={t.technician_id} className="flex justify-between">
                    <span>{t.technician_name}</span>
                    <Badge variant={t.is_primary ? "default" : "secondary"}>{t.assignment_role}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-[#94a3b8]">No assignments</p>
              )}
              <Input
                title="Technician IDs"
                value={techIds}
                onChange={(e) => setTechIds(e.target.value)}
                placeholder="1, 2, 3"
              />
              <Input
                title="Primary ID (optional)"
                value={primaryTech}
                onChange={(e) => setPrimaryTech(e.target.value)}
              />
              <Button size="sm" className="w-full" onClick={submitMultiAssign}>
                Multi-assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() =>
                  void act(
                    () =>
                      adminOperationalAPI.bookings.reassign({
                        bookingId,
                        technicianId: parseTechnicianIds(techIds)[0],
                        reason: "Manual reassignment",
                      }),
                    "Reassigned"
                  )
                }
              >
                Manual reassign (first ID)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reschedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                title="Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <Input title="Time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              <Button size="sm" className="w-full" onClick={submitReschedule}>
                Reschedule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {detail.tags.map((t) => (
                  <Badge key={t.tag_id} variant="secondary">
                    {t.name}
                  </Badge>
                ))}
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto text-sm">
                {tagCatalog.map((t) => (
                  <label key={t.tag_id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(t.tag_id)}
                      onChange={(e) =>
                        setSelectedTags((prev) =>
                          e.target.checked ? [...prev, t.tag_id] : prev.filter((id) => id !== t.tag_id)
                        )
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  if (!selectedTags.length && detail.tags.length) {
                    setSelectedTags(detail.tags.map((t) => t.tag_id));
                  }
                  submitTags();
                }}
              >
                Save tags
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <DispatchModal
        bookingId={bookingId}
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        onDispatched={() => { toast.success("Job dispatched — technicians notified"); refresh(); }}
      />
    </BookingShell>
  );
}
