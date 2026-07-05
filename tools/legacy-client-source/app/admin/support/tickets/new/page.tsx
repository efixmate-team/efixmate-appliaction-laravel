"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import { TICKET_PRIORITIES, TICKET_SOURCES } from "@/src/features/support/constants";
import { validateCreateTicket } from "@/src/features/support/validation";
import type { TicketCategory } from "@/src/features/support/types";
import { SupportShell } from "../../(components)/SupportShell";
import { Button } from "@/components/ui/button";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export default function CreateTicketPage() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ticketSource: "customer",
    requesterId: "",
    subject: "",
    description: "",
    priority: "normal",
    categoryId: "",
    bookingId: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await adminOperationalAPI.support.categories({ activeOnly: true });
      if (res.status && Array.isArray(res.data)) setCategories(res.data as TicketCategory[]);
    })();
  }, []);

  const submit = async () => {
    const v = validateCreateTicket({
      subject: form.subject,
      requesterId: Number(form.requesterId),
      ticketSource: form.ticketSource,
    });
    if (!v.ok) {
      toast.error("Validation", v.message);
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("ticketSource", form.ticketSource);
    fd.append("requesterId", form.requesterId);
    fd.append("subject", form.subject);
    fd.append("description", form.description);
    fd.append("priority", form.priority);
    if (form.categoryId) fd.append("categoryId", form.categoryId);
    if (form.bookingId) fd.append("bookingId", form.bookingId);
    files.forEach((f) => fd.append("attachments", f));

    const res = await adminOperationalAPI.support.createTicketForm(fd);
    setSaving(false);
    if (res.status && res.data) {
      const t = res.data as { ticket_id: number; ticket_source?: string };
      toast.success("Ticket created");
      router.push(`/admin/support/tickets/${t.ticket_id}?source=${t.ticket_source || form.ticketSource}`);
    } else toast.error("Failed", res.message);
  };

  return (
    <SupportShell title="Create ticket" description="Open a support ticket on behalf of a customer or technician.">
      <div className="mx-auto max-w-xl space-y-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4">
        <Select
          title="Source"
          value={form.ticketSource}
          onChange={(e) => setForm((f) => ({ ...f, ticketSource: e.target.value }))}
          options={TICKET_SOURCES.filter((s) => s.value)}
        />
        <Input
          title={form.ticketSource === "technician" ? "Technician ID" : "Customer ID"}
          value={form.requesterId}
          onChange={(e) => setForm((f) => ({ ...f, requesterId: e.target.value }))}
        />
        <Input title="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
        <Textarea
          title="Description"
          name="description"
          id="desc"
          placeholder=""
          className=""
          maxLength={5000}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
        />
        <Select
          title="Priority"
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          options={TICKET_PRIORITIES}
        />
        <Select
          title="Category"
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          options={[
            { value: "", label: "None" },
            ...categories.map((c) => ({ value: String(c.category_id), label: c.name })),
          ]}
        />
        <Input
          title="Booking ID (optional)"
          value={form.bookingId}
          onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))}
        />
        <Input
          title="Attachments"
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []).filter((f) => f.size <= MAX_ATTACHMENT_BYTES))}
        />
        <Button onClick={() => void submit()} loading={saving}>
          Create ticket
        </Button>
      </div>
    </SupportShell>
  );
}

