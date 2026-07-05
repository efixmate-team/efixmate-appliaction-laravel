"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CartSlot } from "@/lib/booking";
import { defaultScheduledDate, slotLabel as formatSlotLabel } from "@/lib/booking";

type Props = {
  slots: CartSlot[];
  selectedSlotId: string | null;
  onSelect: (slot: CartSlot) => void;
};

export function SlotPicker({ slots, selectedSlotId, onSelect }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? slots : slots.slice(0, 6);

  if (!slots.length) {
    return (
      <p className="text-[13px] text-[#5c6a7f]">
        No slots available for your area. Check your service address.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((slot) => {
          const selected = selectedSlotId === String(slot.slot_id);
          const dateLabel = defaultScheduledDate(slot.is_instant);
          const isToday = dateLabel === new Date().toISOString().slice(0, 10);
          return (
            <button
              key={slot.slot_id}
              type="button"
              disabled={!slot.available}
              onClick={() => onSelect(slot)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                selected
                  ? "border-[#0e55d9] bg-[#eef4ff]"
                  : slot.available
                    ? "border-[#e2e8f0] bg-[#ffffff] hover:border-[#0e55d9]/40"
                    : "border-[#f1f5f9] bg-[#f8fafc] opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                {isToday ? "Today" : "Tomorrow"}
              </p>
              <p className="mt-0.5 text-[12px] font-black text-[#0f172a]">
                {formatSlotLabel(slot)}
              </p>
              <p className="text-[11px] font-semibold text-[#0e55d9]">{slot.time}</p>
              {slot.is_instant && (
                <span className="mt-1 inline-block rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[9px] font-bold text-[#047857]">
                  Instant
                </span>
              )}
            </button>
          );
        })}
      </div>
      {slots.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-3 flex items-center gap-1 text-[12px] font-bold text-[#0e55d9]"
        >
          {showAll ? "Show fewer slots" : "View all slots"}
          <ChevronDown size={14} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
