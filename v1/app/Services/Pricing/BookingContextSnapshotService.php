<?php

namespace App\Services\Pricing;

/** Direct port of server/src/modules/booking/snapshot/bookingContextSnapshot.service.js. */
class BookingContextSnapshotService
{
    public function buildContextSnapshotsFromQuote(array $cart, array $quote, array $locks = []): array
    {
        $slotRow = $quote['slot'] ?? null;

        $serviceSnapshot = [
            'lines' => array_map(fn ($l) => [
                'line_id' => $l['line_id'], 'service_id' => $l['service_id'], 'quantity' => $l['quantity'],
                'unit_price' => $l['unit_price'], 'line_total' => $l['line_total'],
            ], $quote['lines'] ?? []),
            'cart_id' => $cart['cart_id'], 'area_id' => $cart['area_id'], 'address_id' => $cart['address_id'],
        ];

        $slotSnapshot = [
            'slot_id' => $cart['slot_id'], 'scheduled_date' => $quote['scheduled_date'] ?? $cart['scheduled_date'],
            'scheduled_time' => $quote['scheduled_time'] ?? $cart['scheduled_time'],
            'surge_multiplier' => is_array($slotRow) ? ($slotRow['surge_multiplier'] ?? null) : ($slotRow->surge_multiplier ?? null),
            'slot_name' => is_array($slotRow) ? ($slotRow['name'] ?? null) : ($slotRow->name ?? null),
        ];

        $chargeSnapshot = [
            'charges' => $quote['charges'] ?? [], 'charges_total' => $quote['charges_total'] ?? 0,
            'tax_percent' => $quote['tax_percent'] ?? null, 'tax_amount' => $quote['tax_amount'] ?? null,
            'coupon_discount' => $quote['coupon_discount'] ?? 0, 'coupon_code' => $quote['coupon_code'] ?? null,
        ];

        $technicianSnapshot = [
            'locks' => array_map(fn ($l) => ['lock_id' => $l['lock_id'] ?? null, 'service_id' => $l['service_id'] ?? null, 'locked_price' => $l['locked_price'] ?? null], $locks),
            'technician_id' => null,
        ];

        $ruleIds = [];
        foreach ($quote['lines'] ?? [] as $l) {
            foreach ($l['breakdown']['applied_rules'] ?? [] as $rule) {
                if (! empty($rule['rule_id'])) {
                    $ruleIds[] = $rule['rule_id'];
                }
            }
        }
        $ruleIds = array_values(array_unique($ruleIds));
        sort($ruleIds);
        $fingerprint = substr(hash('sha256', implode(',', $ruleIds)), 0, 16);

        return [
            'service_snapshot' => $serviceSnapshot, 'slot_snapshot' => $slotSnapshot,
            'charge_snapshot' => $chargeSnapshot, 'technician_snapshot' => $technicianSnapshot,
            'pricing_rules_fingerprint' => $fingerprint, 'engine_version' => BookingPricingSnapshotService::ENGINE_VERSION,
        ];
    }

    public function attachContextToSnapshotPayload(array $payload, array $context): array
    {
        return array_merge($payload, [
            'service_snapshot' => $context['service_snapshot'],
            'slot_snapshot' => $context['slot_snapshot'],
            'charge_snapshot' => $context['charge_snapshot'],
            'technician_snapshot' => $context['technician_snapshot'],
            'pricing_rules_fingerprint' => $context['pricing_rules_fingerprint'],
            'engine_version' => $context['engine_version'] ?? ($payload['engine_version'] ?? null),
        ]);
    }
}
