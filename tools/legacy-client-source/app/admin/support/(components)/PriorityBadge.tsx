import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/src/features/support/types";

const variants: Record<TicketPriority, "muted" | "default" | "warning" | "danger"> = {
  low: "muted",
  normal: "default",
  high: "warning",
  urgent: "danger",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={variants[priority as TicketPriority] || "default"} className="normal-case">
      {priority}
    </Badge>
  );
}
