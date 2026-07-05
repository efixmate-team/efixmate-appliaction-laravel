<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\MstrTimeSlot;
use Efixmate\Domain\Models\SlotReservation;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/user/lib/slotReservation.js. */
class SlotReservationService
{
    private const ACTIVE_PIPELINE_STATUS_IDS = [1, 2, 3, 20, 21, 22, 23, 24];

    public function getMaxCapacity(int $slotId, int $areaId): int
    {
        return $this->getSlotMaxCapacity($slotId, $areaId);
    }

    public function getHeldUnits(int $areaId, int $slotId, string $dateStr, string $timeStr): int
    {
        return $this->countHeldUnits($areaId, $slotId, $dateStr, $timeStr);
    }

    private function getSlotMaxCapacity(int $slotId, int $areaId): int
    {
        $slot = MstrTimeSlot::where('slot_id', $slotId)
            ->where(function ($q) use ($areaId) { $q->where('area_id', $areaId)->orWhereNull('area_id'); })
            ->orderByRaw('CASE WHEN area_id = ? THEN 0 ELSE 1 END', [$areaId])
            ->first();

        return (int) ($slot->max_capacity ?? 50);
    }

    private function countHeldUnits(int $areaId, int $slotId, string $dateStr, string $timeStr): int
    {
        $heldReservations = (int) SlotReservation::where('area_id', $areaId)->where('slot_id', $slotId)
            ->where('scheduled_date', $dateStr)->where('scheduled_time', $timeStr)
            ->where('status', 'HELD')->where('reserved_until', '>', now())
            ->sum('reserved_units');

        $activeLocks = BookingLock::where('area_id', $areaId)->where('slot_id', $slotId)
            ->where('scheduled_date', $dateStr)->where('is_active', true)
            ->where('expires_at', '>', now())
            ->where(function ($q) { $q->where('lock_status', 'ACTIVE')->orWhereNull('lock_status'); })
            ->count();

        $bookingCount = DB::table('efm_bookings')->where('area_id', $areaId)->where('slot_id', $slotId)
            ->where('scheduled_date', $dateStr)->where('scheduled_time', $timeStr)
            ->whereIn('booking_status_id', self::ACTIVE_PIPELINE_STATUS_IDS)
            ->whereNotNull('technician_id')->count();

        return $heldReservations + $activeLocks + $bookingCount;
    }

    /** @return array{ok: bool, status?: int, message?: string, data?: array, reservation_id?: string, reserved_until?: \Carbon\Carbon} */
    public function reserveForLock(int $areaId, int $slotId, string $scheduledDate, string $scheduledTime, int $customerId, int $units = 1, int $ttlMinutes = 10): array
    {
        $dateStr = substr($scheduledDate, 0, 10);
        $timeStr = substr($scheduledTime, 0, 32);

        return DB::transaction(function () use ($areaId, $slotId, $dateStr, $timeStr, $customerId, $units, $ttlMinutes) {
            $maxCap = $this->getSlotMaxCapacity($slotId, $areaId);
            $used = $this->countHeldUnits($areaId, $slotId, $dateStr, $timeStr);

            if ($used + $units > $maxCap) {
                return ['ok' => false, 'status' => 409, 'message' => 'Slot capacity exhausted for this time window.', 'data' => ['max_capacity' => $maxCap, 'used' => $used, 'requested' => $units]];
            }

            $reservedUntil = now()->addMinutes($ttlMinutes);
            $reservation = SlotReservation::create([
                'area_id' => $areaId, 'slot_id' => $slotId, 'scheduled_date' => $dateStr, 'scheduled_time' => $timeStr,
                'customer_id' => $customerId, 'reserved_units' => $units, 'reserved_until' => $reservedUntil,
                'status' => 'HELD', 'created_at' => now(),
            ]);

            return ['ok' => true, 'reservation_id' => $reservation->reservation_id, 'reserved_until' => $reservedUntil];
        });
    }

    public function bindLockToReservation(string $reservationId, string $lockId): void
    {
        SlotReservation::where('reservation_id', $reservationId)->update(['lock_id' => $lockId, 'updated_at' => now()]);
        try {
            BookingLock::where('lock_id', $lockId)->update(['reservation_id' => $reservationId]);
        } catch (\Throwable) {
            // efm_booking_locks has no reservation_id column in this schema — matches
            // Node's own .catch(()=>{}) on this statement; SlotReservation.lock_id is
            // the authoritative link used by consumeReservation() below.
        }
    }

    public function consumeReservation(?string $reservationId): void
    {
        if (! $reservationId) {
            return;
        }
        SlotReservation::where('reservation_id', $reservationId)->update(['status' => 'CONSUMED', 'updated_at' => now()]);
    }

    public function releaseReservation(string $reservationId, string $status = 'RELEASED'): void
    {
        SlotReservation::where('reservation_id', $reservationId)->where('status', 'HELD')->update(['status' => $status, 'updated_at' => now()]);
    }
}
