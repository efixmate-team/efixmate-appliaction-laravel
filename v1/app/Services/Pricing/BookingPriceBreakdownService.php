<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\BookingPriceBreakdown;
use Efixmate\Domain\Models\BookingPriceBreakdownLine;

/** Direct port of server/src/modules/booking/pricing/bookingPriceBreakdown.service.js. */
class BookingPriceBreakdownService
{
    private const SCHEMA_VERSION = 'v2';

    private static function round(float $n): float
    {
        return round(max(0, $n) * 100) / 100;
    }

    private function line(string $type, float $amount, string $label, array $opts = []): array
    {
        return array_merge([
            'line_type' => $type,
            'line_category' => $opts['category'] ?? 'PRICING',
            'direction' => $opts['direction'] ?? 'DEBIT',
            'amount' => self::round($amount),
            'label' => $label,
            'description' => $opts['description'] ?? null,
            'sort_order' => $opts['sort_order'] ?? 0,
            'rate_type' => $opts['rate_type'] ?? null,
            'rate_value' => $opts['rate_value'] ?? null,
            'ref_type' => $opts['ref_type'] ?? null,
            'ref_id' => isset($opts['ref_id']) ? (string) $opts['ref_id'] : null,
            'meta' => $opts['meta'] ?? null,
        ]);
    }

    /** @return array{header: array, lines: array} */
    public function buildFromSnapshot(array $snapshot, array $extras = []): array
    {
        $qty = max(1, (int) ($snapshot['quantity'] ?? 1));
        $base = self::round($snapshot['base_price'] ?? 0);
        $area = self::round($snapshot['area_adjustment'] ?? 0);
        $slot = self::round($snapshot['slot_adjustment'] ?? 0);
        $surge = self::round($snapshot['surge_charge'] ?? 0);
        $platformFees = self::round($extras['platformFees'] ?? 0);
        $technicianCharges = self::round($extras['technicianCharges'] ?? 0);

        $discounts = is_array($snapshot['discounts'] ?? null) ? $snapshot['discounts'] : [];
        $taxes = is_array($snapshot['taxes'] ?? null) ? $snapshot['taxes'] : [];
        $coupon = $snapshot['coupon_data'] ?? null;

        $discountTotal = array_sum(array_column($discounts, 'amount'));
        $couponTotal = self::round($coupon['amount'] ?? 0);
        $taxTotal = array_sum(array_column($taxes, 'amount'));

        $lines = [];
        if ($base > 0) {
            $lines[] = $this->line('BASE_PRICE', $base * $qty, 'Base price', ['sort_order' => 10, 'meta' => ['unit' => $base, 'quantity' => $qty]]);
        }
        if ($area !== 0.0) {
            $lines[] = $this->line('AREA_PRICING', $area * $qty, 'Area adjustment', ['sort_order' => 20]);
        }
        if ($slot !== 0.0) {
            $lines[] = $this->line('SLOT_PRICING', $slot * $qty, 'Slot adjustment', ['sort_order' => 30]);
        }
        if ($surge !== 0.0) {
            $lines[] = $this->line('SURGE_PRICING', $surge * $qty, 'Surge charge', ['sort_order' => 40]);
        }
        if ($technicianCharges > 0) {
            $lines[] = $this->line('TECHNICIAN_CHARGE', $technicianCharges, $extras['technicianChargeLabel'] ?? 'Technician service charge', ['category' => 'FEE', 'sort_order' => 50]);
        }
        if ($platformFees > 0) {
            $lines[] = $this->line('PLATFORM_FEE', $platformFees, $extras['platformFeeLabel'] ?? 'Platform / convenience fee', [
                'category' => 'FEE', 'sort_order' => 55,
                'rate_type' => $extras['platformFeeRateType'] ?? null, 'rate_value' => $extras['platformFeeRateValue'] ?? null,
            ]);
        }
        foreach ($discounts as $d) {
            $amt = (float) ($d['amount'] ?? 0);
            if ($amt > 0) {
                $lines[] = $this->line('DISCOUNT', $amt, $d['title'] ?? 'Discount', [
                    'category' => 'PROMO', 'direction' => 'CREDIT', 'sort_order' => 80,
                    'ref_type' => 'discount', 'ref_id' => $d['discount_id'] ?? null, 'meta' => $d,
                ]);
            }
        }
        if ($couponTotal > 0) {
            $lines[] = $this->line('COUPON', $couponTotal, isset($coupon['code']) ? "Coupon {$coupon['code']}" : 'Coupon', [
                'category' => 'PROMO', 'direction' => 'CREDIT', 'sort_order' => 81,
                'ref_type' => 'coupon', 'ref_id' => $coupon['coupon_id'] ?? null, 'meta' => $coupon,
            ]);
        }
        foreach ($taxes as $t) {
            $amt = (float) ($t['amount'] ?? 0);
            if ($amt > 0) {
                $lines[] = $this->line('TAX', $amt, $t['name'] ?? 'Tax', [
                    'category' => 'TAX', 'sort_order' => 90, 'rate_type' => 'PERCENT', 'rate_value' => $t['rate'] ?? null,
                    'ref_type' => 'tax', 'ref_id' => $t['tax_id'] ?? null, 'meta' => $t,
                ]);
            }
        }
        $commissionAmount = self::round($extras['commissionAmount'] ?? 0);
        if ($commissionAmount > 0) {
            $lines[] = $this->line('COMMISSION', $commissionAmount, $extras['commissionLabel'] ?? 'Platform commission', [
                'category' => 'SETTLEMENT', 'sort_order' => 100, 'ref_type' => 'commission',
                'ref_id' => $extras['commissionRuleId'] ?? null, 'meta' => $extras['commissionMeta'] ?? null,
            ]);
        }
        $walletDeduction = self::round($extras['walletDeduction'] ?? 0);
        if ($walletDeduction > 0) {
            $lines[] = $this->line('WALLET_DEDUCTION', $walletDeduction, 'Wallet applied', [
                'category' => 'WALLET', 'direction' => 'CREDIT', 'sort_order' => 110,
                'ref_type' => 'wallet', 'ref_id' => $extras['walletLedgerId'] ?? null,
            ]);
        }
        $cashback = self::round($extras['cashbackAmount'] ?? 0);
        if ($cashback > 0) {
            $lines[] = $this->line('CASHBACK', $cashback, 'Cashback credit', [
                'category' => 'WALLET', 'direction' => 'CREDIT', 'sort_order' => 120,
                'ref_type' => 'cashback', 'ref_id' => $extras['cashbackCampaignId'] ?? null,
            ]);
        }

        $pricingDebits = ($base + $area + $slot + $surge) * $qty + $technicianCharges + $platformFees;
        $promoCredits = $discountTotal + $couponTotal + $walletDeduction + $cashback;
        $subtotalBeforeTax = self::round($snapshot['subtotal_before_tax'] ?? ($pricingDebits - $discountTotal - $couponTotal));
        $customerPayable = self::round($extras['customerPayable'] ?? $snapshot['final_price'] ?? ($subtotalBeforeTax + $taxTotal - $walletDeduction));
        $technicianSettlement = self::round($extras['technicianSettlement'] ?? max(0, $pricingDebits - $commissionAmount - $promoCredits));
        $platformRevenue = self::round($extras['platformRevenue'] ?? ($platformFees + $commissionAmount + $taxTotal - $technicianSettlement));

        $header = [
            'booking_id' => (int) $snapshot['booking_id'],
            'snapshot_id' => $extras['snapshotId'] ?? $snapshot['snapshot_id'] ?? null,
            'currency' => $snapshot['currency'] ?? 'INR',
            'quantity' => $qty,
            'base_price' => $base * $qty,
            'area_amount' => $area * $qty,
            'slot_amount' => $slot * $qty,
            'surge_amount' => $surge * $qty,
            'technician_charges' => $technicianCharges,
            'platform_fees' => $platformFees,
            'tax_amount' => $taxTotal,
            'discount_amount' => $discountTotal,
            'coupon_amount' => $couponTotal,
            'commission_amount' => $commissionAmount,
            'wallet_deduction' => $walletDeduction,
            'cashback_amount' => $cashback,
            'subtotal_before_tax' => $subtotalBeforeTax,
            'customer_payable' => $customerPayable,
            'technician_settlement' => $technicianSettlement,
            'platform_revenue' => $platformRevenue,
            'lines_meta' => array_map(fn ($l) => ['t' => $l['line_type'], 'a' => $l['amount'], 'd' => $l['direction']], $lines),
            'calculation_meta' => ['engine_version' => $snapshot['engine_version'] ?? null, 'built_at' => now()->toIso8601String(), 'extras_applied' => array_keys(array_filter($extras, fn ($v) => $v !== null))],
            'schema_version' => self::SCHEMA_VERSION,
        ];

        return ['header' => $header, 'lines' => $lines];
    }

    /** @return array{breakdown: BookingPriceBreakdown, lines: array} */
    public function insert(array $header, array $lines): array
    {
        $existing = BookingPriceBreakdown::where('booking_id', $header['booking_id'])->first();
        if ($existing) {
            return ['breakdown' => $existing, 'lines' => BookingPriceBreakdownLine::where('booking_id', $header['booking_id'])->orderBy('sort_order')->orderBy('line_id')->get()->all()];
        }

        $breakdown = BookingPriceBreakdown::create(array_merge($header, ['created_at' => now()]));

        foreach ($lines as $ln) {
            BookingPriceBreakdownLine::create(array_merge($ln, [
                'breakdown_id' => $breakdown->breakdown_id, 'booking_id' => $header['booking_id'], 'created_at' => now(),
            ]));
        }

        return ['breakdown' => $breakdown, 'lines' => $lines];
    }
}
