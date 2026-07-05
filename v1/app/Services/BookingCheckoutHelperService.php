<?php

namespace App\Services;

use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of the shared helpers in
 * server/src/modules/user/controller/bookingCheckout.controller.js: loadOwnBooking,
 * parseCheckoutSnapshot, formatSlotLabel, plus handleBookingCustomerDetail's
 * enrichBookingLines/buildTimeline (also reused by bookingTrack.controller.js).
 */
class BookingCheckoutHelperService
{
    private const STATUS_LABEL_SQL = "CASE b.booking_status_id WHEN 1 THEN 'PENDING' WHEN 2 THEN 'CONFIRMED' WHEN 3 THEN 'IN PROGRESS' WHEN 4 THEN 'COMPLETED' WHEN 5 THEN 'CANCELLED' WHEN 6 THEN 'FAILED' WHEN 7 THEN 'REFUNDED' WHEN 20 THEN 'BROADCASTED' WHEN 21 THEN 'TECH ACCEPTED' WHEN 22 THEN 'ON THE WAY' WHEN 23 THEN 'ARRIVED' WHEN 24 THEN 'STARTED' WHEN 25 THEN 'NO SERVICE' ELSE 'UNKNOWN' END";

    /** @return object|null stdClass row with joined service/category/payment-mode fields, or null if not found/not owned. */
    public function loadOwnBooking(int $customerId, int $bookingId): ?object
    {
        return DB::table('efm_bookings as b')
            ->leftJoin('efm_mstr_services as s', 's.service_id', '=', 'b.service_id')
            ->leftJoin('efm_mstr_service_category as c', 'c.category_id', '=', 'b.service_category_id')
            ->leftJoin('efm_lkp_payment_modes as pm', 'pm.payment_mode_id', '=', 'b.payment_mode_id')
            ->where('b.booking_id', $bookingId)->where('b.customer_id', $customerId)
            ->selectRaw("b.*, s.service as service_name, s.category_id as primary_category_id, s.image_url as service_image_url, s.service_icon,
                c.category_name, {$this->statusLabelSql()} as booking_status_label, pm.payment_mode as payment_mode_label")
            ->first();
    }

    private function statusLabelSql(): string
    {
        return self::STATUS_LABEL_SQL;
    }

    /** @return array|null decoded snapshot if v===1 and lines is an array, else null. */
    public function parseCheckoutSnapshot(?string $problemDescription): ?array
    {
        if (! $problemDescription) {
            return null;
        }
        $decoded = json_decode($problemDescription, true);
        if (! is_array($decoded) || ($decoded['v'] ?? null) !== 1 || ! isset($decoded['lines']) || ! is_array($decoded['lines'])) {
            return null;
        }

        return $decoded;
    }

    public function formatSlotLabel(string $dateStr, ?string $timeStr, $slotRow): string
    {
        if ($slotRow && ($slotRow->start_time ?? null) && ($slotRow->end_time ?? null)) {
            return "{$dateStr} · {$slotRow->start_time} - {$slotRow->end_time}";
        }
        if ($timeStr) {
            return "{$dateStr} · {$timeStr}";
        }

        return $dateStr;
    }

    /** @param array $lines snapshot lines or a fallback single-line array */
    public function enrichBookingLines(Request $request, array $lines, object $booking): array
    {
        if (empty($lines)) {
            $lines = [[
                'service_id' => $booking->service_id, 'service_name' => $booking->service_name,
                'quantity' => $booking->quantity, 'line_total' => (float) ($booking->unit_price ?? $booking->base_price ?? 0), 'photos' => [],
            ]];
        }

        $serviceIds = collect($lines)->pluck('service_id')->filter()->unique()->values()->all();
        $serviceRows = empty($serviceIds) ? collect() : DB::table('efm_mstr_services')->whereIn('service_id', $serviceIds)
            ->select('service_id', 'image_url', 'service_icon')->get()->keyBy('service_id');

        return array_map(function ($line) use ($request, $serviceRows) {
            $svc = $serviceRows->get($line['service_id'] ?? null);
            $icon = $line['service_icon'] ?? $svc?->service_icon ?? $svc?->image_url ?? null;
            $image = $line['image'] ?? $svc?->image_url ?? $svc?->service_icon ?? null;

            return array_merge($line, [
                'service_icon' => PublicUrlResolver::resolve($request, $icon),
                'image' => PublicUrlResolver::resolve($request, $image),
                'photos' => array_map(fn ($p) => PublicUrlResolver::resolve($request, $p) ?? $p, $line['photos'] ?? []),
            ]);
        }, $lines);
    }

    /** 4-step booking timeline purely derived from booking_status_id/technician_id (status logs unused, matching Node). */
    public function buildTimeline(object $booking): array
    {
        $st = (int) $booking->booking_status_id;
        $paid = (int) $booking->payment_status_id === 2;
        $hasTech = (bool) $booking->technician_id;

        $steps = [
            ['id' => 'confirmed', 'title' => 'Booking Confirmed', 'done' => $paid, 'at' => $booking->created_at, 'subtitle' => 'Your booking has been placed successfully.'],
            ['id' => 'assigned', 'title' => 'Technician Assigned', 'done' => $hasTech || $st >= BookingStatus::TECH_ACCEPTED || $st === BookingStatus::CONFIRMED_LEGACY, 'at' => $booking->assigned_at, 'subtitle' => 'A technician has been assigned to you.'],
            ['id' => 'on_the_way', 'title' => 'On The Way', 'done' => $st >= BookingStatus::ON_THE_WAY, 'at' => null, 'subtitle' => 'Technician will be on the way.'],
            ['id' => 'completed', 'title' => 'Job Completed', 'done' => $st === BookingStatus::COMPLETED, 'at' => $booking->completed_at, 'subtitle' => 'Service will be completed.'],
        ];

        return array_map(fn ($s) => array_merge($s, ['active' => ! $s['done'], 'timestamp' => $s['at']]), $steps);
    }

    public function latestStatusLog(int $bookingId, int $newStatus): ?BookingStatusLog
    {
        return BookingStatusLog::where('booking_id', $bookingId)->where('new_status', $newStatus)->orderByDesc('created_at')->first();
    }
}
