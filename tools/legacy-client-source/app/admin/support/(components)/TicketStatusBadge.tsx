import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/src/features/support/types";

const variants: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
  open: "default",
  pending: "muted",
  in_progress: "default",
  waiting_customer: "warning",
  waiting_technician: "warning",
  escalated: "danger",
  resolved: "success",
  closed: "muted",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variants[status as TicketStatus] || "muted"} className="normal-case">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
