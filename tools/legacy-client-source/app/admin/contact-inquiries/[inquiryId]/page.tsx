"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContactInquiryShell } from "../(components)/ContactInquiryShell";
import { InquiryStatusBadge } from "../(components)/InquiryStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Select from "@/app/admin/(components)/Forms/Select";
import Textarea from "@/app/admin/(components)/Forms/Textarea";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { INQUIRY_STATUSES } from "@/src/features/contact-inquiries/constants";

type Inquiry = {
  inquiry_id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  admin_notes?: string;
  source?: string;
  ip_address?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
};

export default function ContactInquiryDetailPage() {
  const params = useParams();
  const inquiryId = String(params.inquiryId);
  const toast = useToast();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminOperationalAPI.contactInquiries.get(inquiryId);
    if (res.status && res.data) {
      const row = res.data as Inquiry;
      setInquiry({ ...row, inquiry_id: String(row.inquiry_id) });
      setStatus(row.status);
      setAdminNotes(row.admin_notes || "");
    } else {
      toast.error(res.message || "Inquiry not found");
    }
    setLoading(false);
  }, [inquiryId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await adminOperationalAPI.contactInquiries.update(inquiryId, {
      status,
      admin_notes: adminNotes,
    });
    setSaving(false);
    if (res.status) {
      toast.success("Inquiry updated");
      void load();
    } else {
      toast.error(res.message || "Update failed");
    }
  };

  if (loading && !inquiry) {
    return (
      <ContactInquiryShell title="Loading…">
        <p className="text-sm text-[#53697e]">Loading inquiry…</p>
      </ContactInquiryShell>
    );
  }

  if (!inquiry) {
    return (
      <ContactInquiryShell title="Not found">
        <Link href="/admin/contact-inquiries" className="text-sm text-[#2563eb]">
          Back to inbox
        </Link>
      </ContactInquiryShell>
    );
  }

  return (
    <ContactInquiryShell
      title={`Inquiry #${inquiry.inquiry_id}`}
      description={`From ${inquiry.name} · ${new Date(inquiry.created_at).toLocaleString()}`}
      actions={
        <Link href="/admin/contact-inquiries">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {inquiry.subject ? (
                <p>
                  <span className="font-semibold text-[#334155]">Subject:</span> {inquiry.subject}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap leading-7 text-[#334155]">{inquiry.message}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-[#53697e]">Name</span>
                <br />
                <span className="font-medium">{inquiry.name}</span>
              </p>
              <p>
                <span className="text-[#53697e]">Email</span>
                <br />
                <a href={`mailto:${inquiry.email}`} className="font-medium text-[#2563eb]">
                  {inquiry.email}
                </a>
              </p>
              <p>
                <span className="text-[#53697e]">Phone</span>
                <br />
                <span className="font-medium">{inquiry.phone || "—"}</span>
              </p>
              <p>
                <span className="text-[#53697e]">Source</span>
                <br />
                <span className="font-medium">{inquiry.source || "website"}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <InquiryStatusBadge status={inquiry.status} />
              </div>
              <Select
                title="Update status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={INQUIRY_STATUSES.map((s) => ({ label: s.label, value: s.value }))}
              />
              <Textarea
                title="Admin notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
              />
              <Button className="w-full" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#475569]">
              <p>Received: {new Date(inquiry.created_at).toLocaleString()}</p>
              {inquiry.updated_at ? <p>Updated: {new Date(inquiry.updated_at).toLocaleString()}</p> : null}
              {inquiry.resolved_at ? <p>Resolved: {new Date(inquiry.resolved_at).toLocaleString()}</p> : null}
              {inquiry.ip_address ? <p>IP: {inquiry.ip_address}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </ContactInquiryShell>
  );
}
