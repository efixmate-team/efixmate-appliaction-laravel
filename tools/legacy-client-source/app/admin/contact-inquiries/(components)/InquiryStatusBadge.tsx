import { Badge } from "@/components/ui/badge";
import type { InquiryStatus } from "@/src/features/contact-inquiries/constants";

const variants: Record<InquiryStatus, "default" | "warning" | "success" | "muted"> = {
  new: "default",
  in_progress: "warning",
  resolved: "success",
  closed: "muted",
};

export function InquiryStatusBadge({ status }: { status: string }) {
  const key = (status in variants ? status : "new") as InquiryStatus;
  const label = status.replace(/_/g, " ");
  return (
    <Badge variant={variants[key]} className="normal-case">
      {label}
    </Badge>
  );
}
