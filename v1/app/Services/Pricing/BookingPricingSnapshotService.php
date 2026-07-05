<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\BookingPricingSnapshot;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/booking/pricing/bookingPricingSnapshot.service.js. */
class BookingPricingSnapshotService
{
    public const ENGINE_VERSION = 'pricing-runtime-v1';

    public function __construct(private PricingEngineStub $pricingEngine) {}

    private static function round(float $n): float
    {
        return round(max(0, $n) * 100) / 100;
    }

    /** Maps a PricingEngineStub::calculate() breakdown into an efm_booking_pricing_snapshot row shape. */
    public function mapBreakdownToSnapshot(int $bookingId, array $breakdown, array $meta = []): array
    {
        $qty = max(1, (int) ($meta['quantity'] ?? $breakdown['quantity'] ?? 1));
        $finalUnit = self::round(($breakdown['final_price'] ?? 0) / $qty);

        $discounts = ($breakdown['discount_amount'] ?? 0) > 0
            ? [['title' => 'Discount', 'amount' => self::round($breakdown['discount_amount']), 'source' => 'breakdown']]
            : [];

        $couponData = null;
        if (($breakdown['coupon_amount'] ?? 0) > 0) {
            $couponData = ['coupon_id' => null, 'code' => $meta['couponCode'] ?? null, 'amount' => self::round($breakdown['coupon_amount'])];
        } elseif (! empty($meta['couponCode'])) {
            $couponData = ['code' => $meta['couponCode'], 'amount' => 0, 'rejected' => true];
        }

        return [
            'booking_id' => $bookingId,
            'base_price' => self::round($breakdown['catalog_base_price'] ?? $breakdown['base_price'] ?? 0),
            'matched_rules' => $breakdown['applied_rules'] ?? [],
            'area_adjustment' => self::round($breakdown['area_adjustment'] ?? 0),
            'slot_adjustment' => self::round($breakdown['slot_adjustment'] ?? 0),
            'surge_charge' => self::round($breakdown['surge_charge'] ?? 0),
            'discounts' => $discounts,
            'taxes' => [],
            'coupon_data' => $couponData,
            'subtotal_before_tax' => self::round($breakdown['subtotal_before_tax'] ?? $finalUnit),
            'final_price' => self::round($meta['lockedPrice'] ?? $breakdown['final_price'] ?? 0),
            'quantity' => $qty,
            'currency' => $meta['currency'] ?? 'INR',
            'locked_price' => isset($meta['lockedPrice']) ? self::round($meta['lockedPrice']) : null,
            'lock_id' => $meta['lockId'] ?? null,
            'engine_version' => self::ENGINE_VERSION,
            'pricing_context' => [
                'service_id' => $breakdown['service_id'] ?? $meta['serviceId'] ?? null,
                'area_id' => $breakdown['context']['area_id'] ?? $meta['areaId'] ?? null,
                'city_id' => $breakdown['context']['city_id'] ?? null,
                'slot_id' => $breakdown['context']['slot_id'] ?? $meta['slotId'] ?? null,
                'booking_type_id' => $meta['bookingTypeId'] ?? null,
                'customer_id' => $meta['customerId'] ?? null,
                'scheduled_at' => $breakdown['context']['scheduled_at'] ?? $meta['scheduledAt'] ?? null,
                'quoted_at' => now()->toIso8601String(),
            ],
            'lines_snapshot' => $meta['linesSnapshot'] ?? null,
        ];
    }

    /** Pure computation, no DB write — mirrors buildSnapshotPayload(). */
    public function buildSnapshotPayload(array $input): array
    {
        try {
            $breakdown = $this->pricingEngine->calculate($input['serviceId'], [
                'areaId' => $input['areaId'] ?? null, 'slotId' => $input['slotId'] ?? null,
                'scheduledAt' => $input['scheduledAt'] ?? null, 'quantity' => $input['quantity'] ?? 1,
            ]);
        } catch (\Throwable) {
            $fallback = (float) ($input['fallbackBasePrice'] ?? 0);
            $breakdown = [
                'base_price' => $fallback, 'catalog_base_price' => $fallback,
                'final_price' => $input['lockedPrice'] ?? $fallback,
                'applied_rules' => [], 'area_adjustment' => 0, 'slot_adjustment' => 0, 'surge_charge' => 0,
                'discount_amount' => 0, 'coupon_amount' => 0, 'tax_amount' => 0,
                'subtotal_before_tax' => $input['lockedPrice'] ?? $fallback,
                'quantity' => $input['quantity'] ?? 1, 'service_id' => $input['serviceId'],
                'context' => ['area_id' => $input['areaId'] ?? null, 'slot_id' => $input['slotId'] ?? null],
            ];
        }

        return $this->mapBreakdownToSnapshot($input['bookingId'], $breakdown, $input);
    }

    public function insertSnapshot(array $row): ?BookingPricingSnapshot
    {
        $exists = BookingPricingSnapshot::where('booking_id', $row['booking_id'])->exists();
        if ($exists) {
            return null;
        }

        try {
            return BookingPricingSnapshot::create(array_merge($row, ['created_at' => now()]));
        } catch (\Illuminate\Database\QueryException $e) {
            // ON CONFLICT (booking_id) DO NOTHING equivalent — unique constraint race.
            if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return null;
            }
            throw $e;
        }
    }

    public function getSnapshot(int $bookingId): ?BookingPricingSnapshot
    {
        return BookingPricingSnapshot::where('booking_id', $bookingId)->first();
    }
}
