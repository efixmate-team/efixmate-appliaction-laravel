<?php

namespace App\Services\Pricing;

use Efixmate\Domain\Models\CustomerBookingCart;
use Efixmate\Domain\Models\MapCouponArea;
use Efixmate\Domain\Models\MapCouponService;
use Efixmate\Domain\Models\MstrCharge;
use Efixmate\Domain\Models\MstrCoupon;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\MstrTax;
use Efixmate\Domain\Models\MstrTimeSlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Direct port of server/src/modules/user/lib/bookingQuote.js +
 * fetchDefaultTaxPercent/fetchPlatformFeeFlat from bookingCart.controller.js.
 */
class CartPricingService
{
    public function __construct(private PricingEngineStub $pricingEngine) {}

    public static function roundMoney(float $n): float
    {
        return round(max(0, $n) * 100) / 100;
    }

    public function fetchDefaultTaxPercent(): float
    {
        $tax = MstrTax::where('is_active', true)->orderBy('tax_id')->first();
        $p = $tax ? (float) $tax->tax_percentage : 18.0;

        return is_finite($p) && $p >= 0 ? $p : 18.0;
    }

    /** Returns null when the platform charge is percentage-based (caller computes on subtotal). */
    public function fetchPlatformFeeFlat(): ?float
    {
        $charge = MstrCharge::where('is_active', true)
            ->where(function ($q) {
                $q->whereRaw('LOWER(charge_name) LIKE ?', ['%platform%'])
                    ->orWhereRaw('LOWER(charge_name) LIKE ?', ['%convenience%']);
            })
            ->orderBy('charge_id')->first();

        if (! $charge) {
            return 0.0;
        }

        $v = (float) $charge->charge_value;
        if (! is_finite($v) || $v < 0) {
            return 0.0;
        }

        return strtoupper((string) $charge->charge_type) === 'PERCENTAGE' ? null : $v;
    }

    /** @return array{subtotal: float, platform_fee: float, tax_percent: float, tax_amount: float, total: float} */
    public function computePriceFromLineSubtotal(float $lineSubtotal): array
    {
        $taxPct = $this->fetchDefaultTaxPercent();
        $platformFlat = $this->fetchPlatformFeeFlat();

        if ($platformFlat === null) {
            $charge = MstrCharge::where('is_active', true)
                ->where(function ($q) {
                    $q->whereRaw('LOWER(charge_name) LIKE ?', ['%platform%'])
                        ->orWhereRaw('LOWER(charge_name) LIKE ?', ['%convenience%']);
                })->first();
            $pct = $charge ? (float) $charge->charge_value : 0;
            $pct = is_finite($pct) ? $pct : 0;
            $platformFee = $lineSubtotal * $pct / 100;
        } else {
            $platformFee = $platformFlat;
        }

        $taxableBase = $lineSubtotal + $platformFee;
        $taxAmount = $taxableBase * $taxPct / 100;
        $total = $taxableBase + $taxAmount;

        return [
            'subtotal' => self::roundMoney($lineSubtotal),
            'platform_fee' => self::roundMoney($platformFee),
            'tax_percent' => $taxPct,
            'tax_amount' => self::roundMoney($taxAmount),
            'total' => self::roundMoney($total),
        ];
    }

    private function computeChargeAmount(array $charge, float $subtotal): float
    {
        $type = strtoupper((string) ($charge['type'] ?? ''));
        $value = (float) ($charge['value'] ?? 0);
        if (! is_finite($value) || $value < 0) {
            return 0.0;
        }

        return $type === 'PERCENTAGE' ? self::roundMoney($subtotal * $value / 100) : self::roundMoney($value);
    }

    /** @return array{charges: array, charges_total: float} */
    public function fetchAggregatedCharges(?int $areaId, array $serviceIds, float $subtotal): array
    {
        $global = MstrCharge::where('is_active', true)->orderBy('charge_id')->get()
            ->map(fn ($c) => ['id' => $c->charge_id, 'name' => $c->charge_name, 'type' => $c->charge_type, 'value' => (float) $c->charge_value]);

        $byId = [];
        foreach ($global as $c) {
            $byId[$c['id']] = $c;
        }

        if ($areaId && ! empty($serviceIds)) {
            $areaRows = DB::table('efm_map_area_service_charge as m')
                ->leftJoin('efm_mstr_charges as c', 'c.charge_id', '=', 'm.charge_id')
                ->where('m.area_id', $areaId)->where('m.is_active', true)
                ->whereIn('m.service_id', $serviceIds)
                ->select('m.charge_id as id', 'c.charge_name as name', DB::raw('COALESCE(m.charge_type, c.charge_type) as type'), DB::raw('COALESCE(m.charge_value, c.charge_value) as value'))
                ->get();

            foreach ($areaRows as $r) {
                $byId[$r->id] = ['id' => $r->id, 'name' => $r->name, 'type' => $r->type, 'value' => (float) $r->value];
            }
        }

        $chargesTotal = 0;
        $charges = [];
        foreach ($byId as $c) {
            $amount = $this->computeChargeAmount($c, $subtotal);
            $charges[] = array_merge($c, ['computed_amount' => $amount]);
            $chargesTotal += $amount;
        }

        return ['charges' => $charges, 'charges_total' => self::roundMoney($chargesTotal)];
    }

    /** @return array{ok: bool, status?: int, message?: ?string, discount: float, coupon_code?: ?string} */
    public function previewCouponDiscount(?string $couponCode, ?int $areaId, $lines, float $subtotal): array
    {
        if (! $couponCode) {
            return ['ok' => true, 'discount' => 0, 'message' => null];
        }

        $coupon = MstrCoupon::whereRaw('UPPER(coupon_code) = ?', [strtoupper($couponCode)])->where('is_active', true)->first();
        if (! $coupon) {
            return ['ok' => false, 'status' => 404, 'message' => 'Invalid coupon', 'discount' => 0];
        }

        $now = now();
        if ($coupon->valid_from && $now->lt($coupon->valid_from)) {
            return ['ok' => false, 'status' => 400, 'message' => 'Coupon not yet active', 'discount' => 0];
        }
        if ($coupon->valid_until && $now->gt($coupon->valid_until)) {
            return ['ok' => false, 'status' => 400, 'message' => 'Coupon expired', 'discount' => 0];
        }
        if ($coupon->min_order_amount !== null && $subtotal < (float) $coupon->min_order_amount) {
            return ['ok' => false, 'status' => 400, 'message' => 'Order amount below coupon minimum', 'discount' => 0];
        }

        $serviceRows = MapCouponService::where('coupon_id', $coupon->coupon_id)->whereNotNull('service_id')->pluck('service_id')->all();
        $catRows = MapCouponService::where('coupon_id', $coupon->coupon_id)->whereNotNull('category_id')->pluck('category_id')->all();

        if (! empty($serviceRows) || ! empty($catRows)) {
            foreach ($lines as $line) {
                $lineServiceId = is_array($line) ? $line['service_id'] : $line->service_id;
                $svc = MstrService::find($lineServiceId);
                $okService = in_array($lineServiceId, $serviceRows, true);
                $okCat = $svc && in_array($svc->category_id, $catRows, true);
                if (! $okService && ! $okCat) {
                    return ['ok' => false, 'status' => 400, 'message' => 'Coupon not valid for every service in the cart.', 'discount' => 0];
                }
            }
        }

        $areaRows = MapCouponArea::where('coupon_id', $coupon->coupon_id)->pluck('area_id')->all();
        if (! empty($areaRows) && ! in_array($areaId, $areaRows, true)) {
            return ['ok' => false, 'status' => 400, 'message' => 'Coupon not valid for this service area.', 'discount' => 0];
        }

        if (strtoupper((string) $coupon->discount_type) === 'PERCENTAGE') {
            $discount = $subtotal * (float) $coupon->discount_value / 100;
            if ($coupon->max_discount_amount !== null && $discount > (float) $coupon->max_discount_amount) {
                $discount = (float) $coupon->max_discount_amount;
            }
        } else {
            $discount = min((float) $coupon->discount_value, $subtotal);
        }

        return ['ok' => true, 'discount' => self::roundMoney($discount), 'coupon_code' => $coupon->coupon_code, 'message' => null];
    }

    /**
     * Direct port of buildCartQuote(). $lines is a Collection/array of
     * CustomerBookingCartLine rows.
     *
     * @return array{ok: bool, status?: int, message?: string, data?: array}
     */
    public function buildCartQuote(CustomerBookingCart $cart, $lines, int $slotId, string $scheduledDate, string $scheduledTime, ?string $couponCode): array
    {
        $areaId = (int) $cart->area_id;

        $slotRow = MstrTimeSlot::where('slot_id', $slotId)->where('area_id', $areaId)
            ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
            ->first();
        if (! $slotRow) {
            return ['ok' => false, 'status' => 400, 'message' => 'Invalid slot for this service area.'];
        }

        $dateStr = substr($scheduledDate, 0, 10);
        $timeStr = substr($scheduledTime, 0, 32);
        $surge = (float) ($slotRow->surge_multiplier ?: 1);

        $subtotal = 0;
        $quoteLines = [];
        foreach ($lines as $line) {
            $pricing = $this->pricingEngine->calculate((int) $line->service_id, [
                'areaId' => $areaId, 'slotId' => $slotId, 'scheduledAt' => $dateStr, 'slotSurgeMultiplier' => $surge,
            ]);
            $qty = (int) ($line->quantity ?: 1);
            $unit = (float) $pricing['final_price'];
            $lineTotal = self::roundMoney($unit * $qty);
            $subtotal += $lineTotal;

            $quoteLines[] = [
                'line_id' => (int) $line->line_id, 'service_id' => (int) $line->service_id,
                'quantity' => $qty, 'unit_price' => $unit, 'line_total' => $lineTotal, 'breakdown' => $pricing,
            ];
        }
        $subtotal = self::roundMoney($subtotal);

        $serviceIds = collect($lines)->pluck('service_id')->unique()->filter()->values()->all();
        ['charges' => $charges, 'charges_total' => $chargesTotal] = $this->fetchAggregatedCharges($areaId, $serviceIds, $subtotal);

        $taxableBeforeCoupon = self::roundMoney($subtotal + $chargesTotal);
        $couponPreview = $this->previewCouponDiscount($couponCode, $areaId, $lines, $taxableBeforeCoupon);
        if (! $couponPreview['ok']) {
            return ['ok' => false, 'status' => $couponPreview['status'], 'message' => $couponPreview['message']];
        }

        $couponDiscount = $couponPreview['discount'] ?: 0;
        $taxableBase = self::roundMoney(max(0, $taxableBeforeCoupon - $couponDiscount));
        $taxPct = $this->fetchDefaultTaxPercent();
        $taxAmount = self::roundMoney($taxableBase * $taxPct / 100);
        $total = self::roundMoney($taxableBase + $taxAmount);

        $quoteId = (string) Str::uuid();
        $data = [
            'quote_id' => $quoteId, 'quoted_at' => now()->toIso8601String(), 'pricing_engine_version' => 'pricing-runtime-v1',
            'area_id' => $areaId, 'slot_id' => $slotId, 'scheduled_date' => $dateStr, 'scheduled_time' => $timeStr,
            'slot' => $slotRow, 'lines' => $quoteLines, 'charges' => $charges,
            'subtotal' => $subtotal, 'charges_total' => $chargesTotal, 'tax_percent' => $taxPct, 'tax_amount' => $taxAmount,
            'coupon_discount' => $couponDiscount, 'coupon_code' => $couponPreview['coupon_code'] ?? null,
            'total' => $total,
        ];

        $data['quote_hash'] = substr(hash('sha256', json_encode([
            'quote_id' => $quoteId, 'area_id' => $areaId, 'slot_id' => $slotId, 'scheduled_date' => $dateStr,
            'scheduled_time' => $timeStr, 'total' => $total,
            'lines' => array_map(fn ($l) => ['service_id' => $l['service_id'], 'line_total' => $l['line_total']], $quoteLines),
        ])), 0, 32);

        return ['ok' => true, 'data' => $data];
    }

    public function persistQuoteOnCart(string $cartId, array $quoteData): void
    {
        try {
            CustomerBookingCart::where('cart_id', $cartId)->update([
                'quote_id' => $quoteData['quote_id'], 'quote_hash' => $quoteData['quote_hash'],
                'quoted_at' => $quoteData['quoted_at'], 'pricing_engine_version' => $quoteData['pricing_engine_version'],
                'updated_at' => now(),
            ]);
        } catch (\Throwable) {
            // Non-critical cache write — swallow, matching Node's .catch(()=>{}).
        }
    }
}
