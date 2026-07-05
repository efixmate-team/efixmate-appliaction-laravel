<?php

namespace App\Services\Pricing;

use App\Support\GeoAreaResolver;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\CustomerAddress;
use Efixmate\Domain\Models\CustomerBookingCart;
use Efixmate\Domain\Models\CustomerBookingCartLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of the cart-lifecycle helpers in
 * server/src/modules/user/controller/bookingCart.controller.js: getActiveCart,
 * resolveAreaForCustomer, resolveCartAddress, syncCartFromSelectedAddress,
 * buildCartSummaryPayload.
 */
class CartService
{
    public function __construct(private PricingEngineStub $pricingEngine, private CartPricingService $pricing) {}

    public function getActiveCart(int $customerId): ?CustomerBookingCart
    {
        return CustomerBookingCart::where('customer_id', $customerId)->where('is_active', true)
            ->orderByDesc('updated_at')->first();
    }

    public function deactivateCustomerCarts(int $customerId): void
    {
        CustomerBookingCart::where('customer_id', $customerId)->where('is_active', true)
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    /** @return array{ok: bool, code?: string, message?: string, areaId?: int, address?: array} */
    public function resolveAreaForCustomer(int $customerId): array
    {
        $addr = CustomerAddress::where('customer_id', $customerId)
            ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
            ->orderByDesc('is_selected')->orderByDesc('address_id')->first();

        if (! $addr) {
            return ['ok' => false, 'code' => 'NO_ADDRESS', 'message' => 'Add a service address before opening a booking cart.'];
        }

        $areaId = GeoAreaResolver::resolveAreaIdForAddress($addr->toArray());
        if (! $areaId) {
            $lat = $addr->latitude;
            $lng = $addr->longitude;
            if (! is_numeric($lat) || ! is_numeric($lng)) {
                return ['ok' => false, 'code' => 'NO_COORDS', 'message' => 'Selected address is missing coordinates; update the address with a map pin.'];
            }

            return ['ok' => false, 'code' => 'NO_AREA', 'message' => 'No active service area covers this address.'];
        }

        return ['ok' => true, 'areaId' => $areaId, 'address' => $addr->toArray()];
    }

    /** @return array{ok: bool, code?: string, message?: string, areaId?: int, address?: array} */
    public function resolveCartAddress(int $customerId, mixed $addressId): array
    {
        $addressId = (int) $addressId;
        if ($addressId <= 0) {
            return ['ok' => false, 'code' => 'INVALID_ADDRESS', 'message' => 'Invalid service address.'];
        }

        $addr = CustomerAddress::where('customer_id', $customerId)->where('address_id', $addressId)
            ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
            ->first();

        if (! $addr) {
            return ['ok' => false, 'code' => 'ADDRESS_NOT_FOUND', 'message' => 'Selected address was not found.'];
        }

        $areaId = GeoAreaResolver::resolveAreaIdForAddress($addr->toArray());
        if (! $areaId) {
            return ['ok' => false, 'code' => 'NO_AREA', 'message' => 'No active service area covers this address.'];
        }

        return ['ok' => true, 'areaId' => $areaId, 'address' => $addr->toArray()];
    }

    /** @return array{ok: bool, code?: string, message?: string, cart?: CustomerBookingCart} */
    public function syncCartFromSelectedAddress(CustomerBookingCart $cart, int $customerId): array
    {
        if ($cart->address_id) {
            $resolved = $this->resolveCartAddress($customerId, $cart->address_id);
            if (! $resolved['ok']) {
                return $resolved;
            }
            if ((int) $cart->area_id === $resolved['areaId']) {
                return ['ok' => true, 'cart' => $cart];
            }
            $cart->update(['area_id' => $resolved['areaId'], 'updated_at' => now()]);

            return ['ok' => true, 'cart' => $cart->fresh()];
        }

        $resolved = $this->resolveAreaForCustomer($customerId);
        if (! $resolved['ok']) {
            return $resolved;
        }

        $addressId = $resolved['address']['address_id'];
        $sameArea = (int) $cart->area_id === (int) $resolved['areaId'];
        $sameAddr = (int) $cart->address_id === (int) $addressId;
        if ($sameArea && $sameAddr) {
            return ['ok' => true, 'cart' => $cart];
        }

        $cart->update(['area_id' => $resolved['areaId'], 'address_id' => $addressId, 'updated_at' => now()]);

        return ['ok' => true, 'cart' => $cart->fresh()];
    }

    /** HTTP status for a resolver failure code, matching the repeated mapping in Node's handlers. */
    public function statusForCode(string $code): int
    {
        return match ($code) {
            'NO_ADDRESS', 'NO_COORDS', 'INVALID_ADDRESS' => 400,
            'ADDRESS_NOT_FOUND' => 404,
            default => 422,
        };
    }

    public function buildCartSummaryPayload(?CustomerBookingCart $cart, Request $request): array
    {
        if (! $cart) {
            return ['cart' => null, 'lines' => [], 'address' => null, 'price' => null, 'slot' => null];
        }

        $rows = DB::table('efm_customer_booking_cart_line as l')
            ->join('efm_mstr_services as s', 's.service_id', '=', 'l.service_id')
            ->leftJoin('efm_mstr_service_category as c', 'c.category_id', '=', 's.category_id')
            ->where('l.cart_id', $cart->cart_id)
            ->select('l.*', 's.service as service_name', 's.base_price as service_list_price', 's.description as service_description',
                's.image_url', 's.service_icon', 's.service_color', 's.category_id', 'c.category_name')
            ->orderBy('l.sort_order')->orderBy('l.line_id')->get();

        $lineSubtotal = 0;
        $linePayload = [];
        foreach ($rows as $row) {
            try {
                $pricing = $this->pricingEngine->calculate((int) $row->service_id, ['areaId' => $cart->area_id, 'slotId' => $cart->slot_id, 'scheduledAt' => $cart->scheduled_date]);
                $unit = (float) $pricing['final_price'];
            } catch (\Throwable) {
                $unit = (float) ($row->service_list_price ?? 0);
            }
            $qty = (int) ($row->quantity ?: 1);
            $lineTotal = $unit * $qty;
            $lineSubtotal += $lineTotal;

            $photos = is_string($row->photo_urls) ? (json_decode($row->photo_urls, true) ?: []) : ($row->photo_urls ?? []);

            $linePayload[] = [
                'line_id' => (int) $row->line_id, 'service_id' => (int) $row->service_id, 'service_name' => $row->service_name,
                'category_id' => $row->category_id, 'category_name' => $row->category_name,
                'quantity' => $qty, 'booking_type_id' => $row->booking_type_id,
                'unit_price' => $unit, 'line_total' => CartPricingService::roundMoney($lineTotal),
                'photos' => array_map(fn ($p) => PublicUrlResolver::resolve($request, $p), $photos),
                'service_icon' => PublicUrlResolver::resolve($request, $row->service_icon ?? $row->image_url),
                'image' => PublicUrlResolver::resolve($request, $row->image_url ?? $row->service_icon),
                'service_color' => $row->service_color, 'description' => $row->service_description,
            ];
        }

        $price = $this->pricing->computePriceFromLineSubtotal($lineSubtotal);

        $address = null;
        if ($cart->address_id) {
            $address = CustomerAddress::where('address_id', $cart->address_id)->where('customer_id', $cart->customer_id)
                ->first(['address_id', 'address', 'city', 'state', 'country', 'pincode', 'latitude', 'longitude'])?->toArray();
        }
        if (! $address) {
            $addr = CustomerAddress::where('customer_id', $cart->customer_id)
                ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
                ->orderByDesc('is_selected')->orderByDesc('address_id')->first();
            $address = $addr?->toArray();
        }

        $slot = null;
        if ($cart->slot_id) {
            $slotRow = DB::table('efm_mstr_time_slots')->where('slot_id', $cart->slot_id)->first();
            if ($slotRow) {
                $firstServiceId = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->value('service_id');
                $slotPrice = null;
                if ($firstServiceId) {
                    $slotPricing = $this->pricingEngine->calculate((int) $firstServiceId, [
                        'areaId' => $cart->area_id, 'slotId' => $cart->slot_id, 'slotSurgeMultiplier' => (float) ($slotRow->surge_multiplier ?: 1),
                    ]);
                    $slotPrice = $slotPricing['final_price'];
                }
                $slot = (array) $slotRow;
                $slot['price'] = $slotPrice;
            } else {
                $slot = ['slot_id' => $cart->slot_id];
            }
        }

        return [
            'cart' => [
                'cart_id' => $cart->cart_id, 'customer_id' => (int) $cart->customer_id,
                'area_id' => $cart->area_id ? (int) $cart->area_id : null, 'address_id' => $cart->address_id ? (int) $cart->address_id : null,
                'slot_id' => $cart->slot_id ? (int) $cart->slot_id : null,
                'scheduled_date' => $cart->scheduled_date ? substr((string) $cart->scheduled_date, 0, 10) : null,
                'scheduled_time' => $cart->scheduled_time, 'instructions' => $cart->instructions ?? '',
            ],
            'lines' => $linePayload, 'address' => $address, 'slot' => $slot, 'price' => $price,
        ];
    }
}
