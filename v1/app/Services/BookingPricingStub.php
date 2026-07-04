<?php

namespace App\Services;

use Efixmate\Domain\Models\MstrService;

/**
 * Deliberately trivial pricing calculator, named so its temporary status is
 * unambiguous. The real pricing engine (coupons, surge, area/slot adjustments,
 * commission rules) is out of scope for the foundation phase's booking slice —
 * see Stage 6 in the migration plan.
 */
class BookingPricingStub
{
    /**
     * The real system prices per booking_type_id/city_id via efm_service_pricing +
     * a full pricing-rule engine. This stub has no such context — it just multiplies
     * the service's flat base_price by quantity.
     */
    public function calculate(MstrService $service, int $quantity): float
    {
        return round((float) $service->base_price * max($quantity, 1), 2);
    }
}
