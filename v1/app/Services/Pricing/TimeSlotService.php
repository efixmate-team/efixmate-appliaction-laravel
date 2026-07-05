<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\MstrTimeSlot;

/**
 * Stand-in for server/src/modules/user/lib/timeSlots.js's fetchAreaSlotsPayload/
 * getSlotForArea (not directly researched — reconstructed from how callers use it:
 * a list of an area's active time slots with a real-time `available` flag driven
 * by the same held-units-vs-capacity accounting used at lock time).
 */
class TimeSlotService
{
    public function __construct(private SlotReservationService $reservations) {}

    public function getSlotForArea(int $slotId, int $areaId): ?MstrTimeSlot
    {
        return MstrTimeSlot::where('slot_id', $slotId)->where('area_id', $areaId)
            ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
            ->first();
    }

    /** @return array<int, array> */
    public function fetchAreaSlotsPayload(int $areaId, ?string $dateStr = null): array
    {
        $dateStr ??= now()->toDateString();

        return MstrTimeSlot::where('area_id', $areaId)->where('is_active', true)
            ->orderBy('start_time')->get()
            ->map(function (MstrTimeSlot $slot) use ($areaId, $dateStr) {
                $maxCap = (int) ($slot->max_capacity ?? 50);
                $used = $this->reservations->getHeldUnits($areaId, $slot->slot_id, $dateStr, (string) $slot->start_time);

                return [
                    'slot_id' => $slot->slot_id, 'name' => $slot->name,
                    'start_time' => $slot->start_time, 'end_time' => $slot->end_time,
                    'surge_multiplier' => (float) ($slot->surge_multiplier ?: 1),
                    'max_capacity' => $maxCap, 'is_instant' => (bool) $slot->is_instant,
                    'available' => $used < $maxCap,
                ];
            })->all();
    }
}
