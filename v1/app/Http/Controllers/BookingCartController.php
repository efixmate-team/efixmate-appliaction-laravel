<?php

namespace App\Http\Controllers;

use App\Services\FileUploadService;
use App\Services\Pricing\CartPricingService;
use App\Services\Pricing\CartService;
use App\Services\Pricing\SlotReservationService;
use App\Services\Pricing\TimeSlotService;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\CustomerBookingCart;
use Efixmate\Domain\Models\CustomerBookingCartLine;
use Efixmate\Domain\Models\MstrTimeSlot;
use Efixmate\Domain\Support\UploadSlots;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/user/controller/bookingCart.controller.js. */
class BookingCartController extends Controller
{
    public function __construct(
        private CartService $carts,
        private CartPricingService $pricing,
        private SlotReservationService $reservations,
        private TimeSlotService $timeSlots,
        private FileUploadService $uploads,
    ) {}

    private function customerId(Request $request): int
    {
        $id = $request->user()?->customer_id;
        abort_if(! $id, 403, 'A customer session is required.');

        return $id;
    }

    /** POST /api/user/booking/cart */
    public function open(Request $request)
    {
        $customerId = $this->customerId($request);
        $resolved = $this->carts->resolveAreaForCustomer($customerId);

        $cart = DB::transaction(function () use ($customerId, $resolved) {
            $this->carts->deactivateCustomerCarts($customerId);

            return CustomerBookingCart::create([
                'customer_id' => $customerId,
                'area_id' => $resolved['ok'] ? $resolved['areaId'] : null,
                'address_id' => $resolved['ok'] ? $resolved['address']['address_id'] : null,
                'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        });

        return response()->json(['status' => true, 'message' => 'Booking cart opened', 'data' => $this->carts->buildCartSummaryPayload($cart, $request)], 201);
    }

    /** POST /api/user/booking/cart/ensure */
    public function ensure(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);

        if ($cart) {
            $synced = $this->carts->syncCartFromSelectedAddress($cart, $customerId);
            if ($synced['ok']) {
                $cart = $synced['cart'];
            }

            return response()->json(['status' => true, 'message' => 'Existing cart returned', 'data' => $this->carts->buildCartSummaryPayload($cart, $request)]);
        }

        $resolved = $this->carts->resolveAreaForCustomer($customerId);
        $cart = CustomerBookingCart::create([
            'customer_id' => $customerId,
            'area_id' => $resolved['ok'] ? $resolved['areaId'] : null,
            'address_id' => $resolved['ok'] ? $resolved['address']['address_id'] : null,
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'New cart created', 'data' => $this->carts->buildCartSummaryPayload($cart, $request)], 201);
    }

    /** GET /api/user/booking/cart */
    public function show(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);

        if ($cart) {
            $synced = $this->carts->syncCartFromSelectedAddress($cart, $customerId);
            if (! $synced['ok']) {
                return response()->json(['status' => false, 'message' => $synced['message'], 'code' => $synced['code']], $this->carts->statusForCode($synced['code']));
            }
            $cart = $synced['cart'];
        }

        return response()->json(['status' => true, 'data' => $this->carts->buildCartSummaryPayload($cart, $request)]);
    }

    /** PATCH /api/user/booking/cart */
    public function update(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active booking cart. Open a cart first.');

        $updates = [];
        $addressId = $request->input('address_id') ?? $request->input('addressId');
        if ($addressId !== null) {
            $resolved = $this->carts->resolveCartAddress($customerId, $addressId);
            if (! $resolved['ok']) {
                return response()->json(['status' => false, 'message' => $resolved['message'], 'code' => $resolved['code']], $this->carts->statusForCode($resolved['code']));
            }
            $addressChanged = (int) $cart->address_id !== (int) $resolved['address']['address_id'];
            $updates['address_id'] = $resolved['address']['address_id'];
            $updates['area_id'] = $resolved['areaId'];
            if ($addressChanged) {
                $updates['slot_id'] = null;
                $updates['scheduled_date'] = null;
                $updates['scheduled_time'] = null;
            }
        }
        if ($request->has('slot_id') || $request->has('slotId')) {
            $updates['slot_id'] = (int) ($request->input('slot_id') ?? $request->input('slotId'));
        }
        if ($request->has('scheduled_date') || $request->has('booking_date')) {
            $updates['scheduled_date'] = substr((string) ($request->input('scheduled_date') ?? $request->input('booking_date')), 0, 10);
        }
        if ($request->has('scheduled_time') || $request->has('time')) {
            $updates['scheduled_time'] = substr((string) ($request->input('scheduled_time') ?? $request->input('time')), 0, 32);
        }
        if ($request->has('instructions') || $request->has('problem_description')) {
            $updates['instructions'] = substr((string) ($request->input('instructions') ?? $request->input('problem_description') ?? ''), 0, 250);
        }

        abort_if(empty($updates), 400, 'No updatable fields supplied.');
        $updates['updated_at'] = now();
        $cart->update($updates);

        $next = $this->carts->getActiveCart($customerId);
        $synced = $this->carts->syncCartFromSelectedAddress($next, $customerId);
        if (! $synced['ok']) {
            return response()->json(['status' => false, 'message' => $synced['message'], 'code' => $synced['code']], $this->carts->statusForCode($synced['code']));
        }

        return response()->json(['status' => true, 'message' => 'Cart updated', 'data' => $this->carts->buildCartSummaryPayload($synced['cart'], $request)]);
    }

    /** DELETE /api/user/booking/cart */
    public function destroy(Request $request)
    {
        $customerId = $this->customerId($request);
        CustomerBookingCart::where('customer_id', $customerId)->where('is_active', true)->update(['is_active' => false, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Cart cleared']);
    }

    /** POST /api/user/booking/cart/lines */
    public function addLine(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart. POST /user/booking/cart first.');

        $serviceId = (int) ($request->input('service_id') ?? $request->input('serviceId'));
        abort_if(! $serviceId, 400, 'service_id is required');

        $qty = min(99, max(1, (int) $request->input('quantity', 1)));
        $btRaw = $request->input('booking_type_id') ?? $request->input('bookingTypeId');
        $bt = ($btRaw !== null && $btRaw !== '') ? (int) $btRaw : null;

        $existing = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->where('service_id', $serviceId)->first();

        if ($existing) {
            $newQty = min(99, $existing->quantity + $qty);
            $existing->update(['quantity' => $newQty, 'booking_type_id' => $bt ?? $existing->booking_type_id, 'updated_at' => now()]);
            $line = $existing->fresh();
        } else {
            $sortOrder = ((int) CustomerBookingCartLine::where('cart_id', $cart->cart_id)->max('sort_order')) + 1;
            $line = CustomerBookingCartLine::create([
                'cart_id' => $cart->cart_id, 'service_id' => $serviceId, 'quantity' => $qty,
                'booking_type_id' => $bt, 'sort_order' => $sortOrder, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $cart->update(['updated_at' => now()]);
        $summary = $this->carts->buildCartSummaryPayload($cart->fresh(), $request);

        return response()->json(['status' => true, 'message' => 'Line added', 'data' => array_merge($summary, ['added_line' => $line])], 201);
    }

    /** PATCH /api/user/booking/cart/lines/{lineId} */
    public function updateLine(Request $request, int $lineId)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $qtyRaw = $request->input('quantity') ?? $request->input('qty');
        abort_if($qtyRaw === null, 400, 'quantity is required');
        $qty = min(99, max(1, (int) $qtyRaw));

        $line = CustomerBookingCartLine::where('line_id', $lineId)->where('cart_id', $cart->cart_id)->first();
        abort_if(! $line, 404, 'Line not found on this cart');
        $line->update(['quantity' => $qty, 'updated_at' => now()]);

        $cart->update(['updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Quantity updated', 'data' => $this->carts->buildCartSummaryPayload($cart->fresh(), $request)]);
    }

    /** DELETE /api/user/booking/cart/lines/{lineId} */
    public function deleteLine(Request $request, int $lineId)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $deleted = CustomerBookingCartLine::where('line_id', $lineId)->where('cart_id', $cart->cart_id)->delete();
        abort_if(! $deleted, 404, 'Line not found');

        $cart->update(['updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Line removed', 'data' => $this->carts->buildCartSummaryPayload($cart->fresh(), $request)]);
    }

    /** POST /api/user/booking/cart/lines/{lineId}/photos */
    public function uploadLinePhotos(Request $request, int $lineId)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $line = CustomerBookingCartLine::where('line_id', $lineId)->where('cart_id', $cart->cart_id)->first();
        abort_if(! $line, 404, 'Line not found');

        $files = $request->file('photos', []);
        $files = is_array($files) ? $files : [$files];
        abort_if(empty($files), 400, 'Attach one or more images (field name: photos)');

        $urls = array_map(fn ($f) => $this->uploads->store($f, UploadSlots::USER_PROBLEM_IMAGES, $customerId, true), $files);
        $existing = is_string($line->photo_urls) ? (json_decode($line->photo_urls, true) ?: []) : ($line->photo_urls ?? []);
        $merged = array_slice(array_merge($existing, $urls), 0, 8);

        $line->update(['photo_urls' => $merged, 'updated_at' => now()]);
        $cart->update(['updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Photos uploaded', 'data' => $this->carts->buildCartSummaryPayload($cart->fresh(), $request)]);
    }

    /** DELETE /api/user/booking/cart/lines/{lineId}/photos?url=... */
    public function deleteLinePhoto(Request $request, int $lineId)
    {
        $customerId = $this->customerId($request);
        $url = (string) $request->query('url', '');
        abort_if($url === '', 400, 'Query param url is required');

        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $line = CustomerBookingCartLine::where('line_id', $lineId)->where('cart_id', $cart->cart_id)->first();
        abort_if(! $line, 404, 'Line not found');

        $existing = is_string($line->photo_urls) ? (json_decode($line->photo_urls, true) ?: []) : ($line->photo_urls ?? []);
        $next = array_values(array_filter($existing, fn ($u) => $u !== $url));

        $line->update(['photo_urls' => $next, 'updated_at' => now()]);
        $cart->update(['updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Photo removed', 'data' => $this->carts->buildCartSummaryPayload($cart->fresh(), $request)]);
    }

    /** GET /api/user/booking/cart/slots */
    public function slots(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $synced = $this->carts->syncCartFromSelectedAddress($cart, $customerId);
        if (! $synced['ok']) {
            return response()->json(['status' => false, 'message' => $synced['message'], 'code' => $synced['code']], $this->carts->statusForCode($synced['code']));
        }

        $slots = $this->timeSlots->fetchAreaSlotsPayload((int) $synced['cart']->area_id);

        return response()->json(['status' => true, 'data' => ['area_id' => (int) $synced['cart']->area_id, 'slots' => $slots]]);
    }

    /** GET /api/user/booking/cart/slots-by-address */
    public function slotsByAddress(Request $request)
    {
        $customerId = $this->customerId($request);
        $addressId = $request->query('address_id') ?? $request->query('addressId');
        abort_if(! $addressId, 400, 'address_id is required');

        $resolved = $this->carts->resolveCartAddress($customerId, $addressId);
        if (! $resolved['ok']) {
            return response()->json(['status' => false, 'message' => $resolved['message'], 'code' => $resolved['code']], $this->carts->statusForCode($resolved['code']));
        }

        $today = now()->toDateString();
        $requestedDate = substr((string) ($request->query('date') ?? $request->query('scheduled_date') ?? ''), 0, 10);
        $scheduledDate = $requestedDate ?: $today;

        $slots = $this->timeSlots->fetchAreaSlotsPayload($resolved['areaId'], $scheduledDate);
        $datedSlots = array_map(function ($slot) use ($scheduledDate, $today) {
            $slot['scheduled_date'] = $scheduledDate;
            if ($scheduledDate > $today) {
                $slot['available'] = true;
            }

            return $slot;
        }, $slots);

        return response()->json(['status' => true, 'data' => [
            'address_id' => (int) $addressId, 'area_id' => $resolved['areaId'], 'scheduled_date' => $scheduledDate, 'slots' => $datedSlots,
        ]]);
    }

    /** POST /api/user/booking/cart/quote */
    public function quote(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');

        $synced = $this->carts->syncCartFromSelectedAddress($cart, $customerId);
        if (! $synced['ok']) {
            return response()->json(['status' => false, 'message' => $synced['message'], 'code' => $synced['code']], $this->carts->statusForCode($synced['code']));
        }
        $cart = $synced['cart'];

        $slotId = $request->input('slot_id') ?? $request->input('slotId') ?? $cart->slot_id;
        $scheduledDate = $request->input('scheduled_date') ?? $request->input('booking_date') ?? $cart->scheduled_date;
        $scheduledTime = $request->input('scheduled_time') ?? $request->input('time') ?? $cart->scheduled_time;
        $couponCode = $request->input('coupon_code') ?? $request->input('couponCode');

        abort_if(! $slotId || ! $scheduledDate || ! $scheduledTime, 400, 'slot_id, scheduled_date, and scheduled_time are required (on cart or in body).');

        $lines = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->orderBy('line_id')->get();
        abort_if($lines->isEmpty(), 400, 'Cart has no service lines.');

        $quote = $this->pricing->buildCartQuote($cart, $lines, (int) $slotId, (string) $scheduledDate, (string) $scheduledTime, $couponCode);
        if (! $quote['ok']) {
            return response()->json(['status' => false, 'message' => $quote['message']], $quote['status'] ?? 400);
        }

        $this->pricing->persistQuoteOnCart($cart->cart_id, $quote['data']);

        return response()->json(['status' => true, 'data' => $quote['data']]);
    }

    /** POST /api/user/booking/cart/lock and /prepare-locks (deprecated alias) */
    public function lock(Request $request)
    {
        $customerId = $this->customerId($request);
        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active cart.');
        abort_if(! $cart->slot_id || ! $cart->scheduled_date || ! $cart->scheduled_time, 400, 'Select slot, scheduled_date, and scheduled_time on the cart before preparing locks.');

        $lines = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->orderBy('line_id')->get();
        abort_if($lines->isEmpty(), 400, 'Cart has no service lines.');

        $dateStr = substr((string) $cart->scheduled_date, 0, 10);
        $timeStr = substr((string) $cart->scheduled_time, 0, 32);
        $areaId = (int) $cart->area_id;
        $slotId = (int) $cart->slot_id;
        $n = $lines->count();

        $reservation = $this->reservations->reserveForLock($areaId, $slotId, $dateStr, $timeStr, $customerId, $n, 10);
        if (! $reservation['ok']) {
            return response()->json(['status' => false, 'message' => $reservation['message'], 'data' => $reservation['data'] ?? null], $reservation['status'] ?? 409);
        }

        $expiresAt = now()->addMinutes(10);
        $results = DB::transaction(function () use ($lines, $customerId, $areaId, $slotId, $dateStr, $expiresAt, $reservation) {
            $out = [];
            foreach ($lines as $line) {
                $slotMeta = MstrTimeSlot::where('slot_id', $slotId)->first();
                $pricing = app(\App\Services\Pricing\PricingEngineStub::class)->calculate((int) $line->service_id, [
                    'areaId' => $areaId, 'slotId' => $slotId, 'scheduledAt' => $dateStr,
                    'slotSurgeMultiplier' => (float) ($slotMeta->surge_multiplier ?? 1),
                ]);
                $unit = (float) $pricing['final_price'];
                $qty = (int) ($line->quantity ?: 1);
                $lockedPrice = $unit * $qty;

                $lock = BookingLock::create([
                    'customer_id' => $customerId, 'area_id' => $areaId, 'service_id' => $line->service_id,
                    'slot_id' => $slotId, 'scheduled_date' => $dateStr, 'locked_price' => $lockedPrice,
                    'status' => 'ACTIVE', 'lock_status' => 'ACTIVE', 'expires_at' => $expiresAt, 'is_active' => true, 'created_at' => now(),
                ]);

                $this->reservations->bindLockToReservation($reservation['reservation_id'], $lock->lock_id);

                $out[] = ['line_id' => $line->line_id, 'service_id' => $line->service_id, 'quantity' => $qty, 'lock_id' => $lock->lock_id, 'locked_price' => $lockedPrice, 'breakdown' => $pricing];
            }

            return $out;
        });

        return response()->json(['status' => true, 'message' => 'Locks created for each line. Use lock_ids with checkout.', 'data' => [
            'lock_ids' => array_column($results, 'lock_id'), 'locks' => $results,
            'expires_at' => $expiresAt->toIso8601String(), 'reservation_id' => $reservation['reservation_id'], 'address_id' => $cart->address_id,
        ]]);
    }

    /** GET /api/user/booking/cart/lines-availability */
    public function linesAvailability(Request $request)
    {
        $customerId = $request->user()?->customer_id;
        abort_if(! $customerId, 401, 'Unauthorized');

        $cart = $this->carts->getActiveCart($customerId);
        if (! $cart) {
            return response()->json(['status' => true, 'result' => []]);
        }

        $serviceIds = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->pluck('service_id')->unique()->values();
        if ($serviceIds->isEmpty()) {
            return response()->json(['status' => true, 'result' => []]);
        }

        $areaId = $cart->area_id ? (int) $cart->area_id : null;
        if (! $areaId) {
            return response()->json(['status' => true, 'result' => $serviceIds->map(fn ($id) => ['service_id' => $id, 'is_available' => true])->values()]);
        }

        $available = DB::table('efm_map_technician_services as mts')
            ->join('efm_technicians as t', 't.technician_id', '=', 'mts.technician_id')
            ->join('efm_technician_areas as ta', 'ta.technician_id', '=', 't.technician_id')
            ->where('t.is_active', true)->whereIn('mts.service_id', $serviceIds)->where('ta.area_id', $areaId)
            ->distinct()->pluck('mts.service_id')->all();

        return response()->json(['status' => true, 'result' => $serviceIds->map(fn ($id) => ['service_id' => $id, 'is_available' => in_array($id, $available)])->values()]);
    }
}
