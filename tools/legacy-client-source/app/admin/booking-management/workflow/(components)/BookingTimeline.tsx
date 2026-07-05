import type { TimelineEvent } from "@/src/features/bookings/types";

export function BookingTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-[#94a3b8]">No timeline events yet.</p>;
  }

  return (
    <ol className="relative border-l border-[#e2e8f0] pl-4">
      {events.map((e, i) => (
        <li key={`${e.event_type}-${e.created_at}-${i}`} className="mb-4 ml-2">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-[#ffffff] bg-[#eff6ff]" />
          <p className="text-sm font-medium text-[#1e293b]">{e.event_label}</p>
          <p className="text-xs capitalize text-[#53697e]">
            {e.event_type.replace(/_/g, " ")} · {new Date(e.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
