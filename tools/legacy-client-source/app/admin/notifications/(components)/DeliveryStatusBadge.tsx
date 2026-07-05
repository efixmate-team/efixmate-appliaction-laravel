import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "@/src/features/notifications/types";

const statusVariant: Record<DeliveryStatus, "default" | "success" | "warning" | "danger" | "muted"> = {
  queued: "muted",
  processing: "warning",
  sent: "default",
  delivered: "success",
  failed: "danger",
  cancelled: "muted",
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const key = status as DeliveryStatus;
  return (
    <Badge variant={statusVariant[key] || "muted"} className="normal-case">
      {status}
    </Badge>
  );
}
