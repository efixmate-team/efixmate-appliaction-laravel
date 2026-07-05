import { Badge } from "@/components/ui/badge";
import type { NotificationChannel } from "@/src/features/notifications/types";

const channelVariant: Record<NotificationChannel, "default" | "success" | "warning" | "muted"> = {
  push: "default",
  sms: "warning",
  email: "muted",
  whatsapp: "success",
};

export function ChannelBadge({ channel }: { channel: string }) {
  const key = channel as NotificationChannel;
  return (
    <Badge variant={channelVariant[key] || "muted"} className="normal-case">
      {channel}
    </Badge>
  );
}
