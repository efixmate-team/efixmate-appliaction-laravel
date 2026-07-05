import type { TimelineEvent } from "@/src/features/support/types";

export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-[#5c6a7f]">No timeline events yet.</p>;
  }

  return (
    <ol className="relative border-l border-[#e2e8f0] pl-4">
      {events.map((e) => (
        <li key={e.timeline_id} className="mb-4 ml-2">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-[#ffffff] bg-[#f5f3ff]" />
          <p className="text-sm font-medium text-[#1e293b]">{e.event_label || e.event_type}</p>
          <p className="text-xs text-[#53697e]">
            {e.actor_type ? `${e.actor_type}` : "system"} · {new Date(e.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
