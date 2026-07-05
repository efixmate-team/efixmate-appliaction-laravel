<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\MstrService;

/**
 * Stand-in for Node's PricingEngine.calculate() (server/src/services/pricing/pricingEngine.js
 * and friends) — the real engine matches area/slot/surge/discount/tax/coupon rules from a
 * pricing-rules table and is explicitly Stage 8 scope in the migration plan. This stub
 * mirrors the exact shape Node's own buildSnapshotPayload() falls back to when the real
 * engine throws, so every downstream consumer (cart summary, quote, lock, snapshot) works
 * against a consistent contract today and only needs this one class swapped out later.
 */
class PricingEngineStub
{
    /**
     * @param array{areaId?: ?int, slotId?: ?int, scheduledAt?: ?string, slotSurgeMultiplier?: float, quantity?: int} $context
     */
    public function calculate(int $serviceId, array $context = []): array
    {
        $service = MstrService::find($serviceId);
        $base = (float) ($service?->base_price ?? 0);

        return [
            'service_id' => $serviceId,
            'base_price' => $base,
            'catalog_base_price' => $base,
            'final_price' => $base,
            'area_adjustment' => 0,
            'slot_adjustment' => 0,
            'surge_charge' => 0,
            'discount_amount' => 0,
            'coupon_amount' => 0,
            'tax_amount' => 0,
            'subtotal_before_tax' => $base,
            'quantity' => $context['quantity'] ?? 1,
            'applied_rules' => [],
            'context' => [
                'area_id' => $context['areaId'] ?? null,
                'slot_id' => $context['slotId'] ?? null,
                'scheduled_at' => $context['scheduledAt'] ?? null,
                'city_id' => null,
            ],
        ];
    }
}
