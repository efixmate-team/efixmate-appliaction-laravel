<?php

namespace App\Http\Controllers;

use App\Services\BookingCheckoutHelperService;
use App\Services\FinancialYearService;
use App\Services\Pricing\BookingContextSnapshotService;
use App\Services\Pricing\BookingPriceBreakdownService;
use App\Services\Pricing\BookingPricingSnapshotService;
use App\Services\Pricing\CartPricingService;
use App\Services\Pricing\CartService;
use App\Services\Pricing\SlotReservationService;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\CustomerBookingCartLine;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Direct port of the remaining server/.../bookingCheckout.controller.js handlers:
 * handleCheckoutFromCart, handleBookingPaymentSummary, handleBookingConfirmationSummary,
 * handleBookingCustomerDetail, handleCartApplyCouponToLocks.
 */
class BookingCheckoutController extends Controller
{
    public function __construct(
        private BookingCheckoutHelperService $helper,
        private CartService $carts,
        private CartPricingService $pricing,
        private BookingPricingSnapshotService $snapshotSvc,
        private BookingContextSnapshotService $contextSvc,
        private BookingPriceBreakdownService $breakdownSvc,
        private SlotReservationService $reservations,
        private FinancialYearService $fy,
    ) {}

    private function generateBookingUid(): string
    {
        return substr('EFX'.now()->timestamp.strtoupper(Str::random(6)), 0, 16);
    }

    /** POST /api/user/booking/checkout */
    public function checkout(Request $request)
    {
        $customerId = $request->user()?->customer_id;
        abort_if(! $customerId, 403, 'A customer session is required.');

        $lockIds = $request->input('lock_ids') ?? $request->input('lockIds');
        abort_if(! is_array($lockIds) || empty($lockIds), 400, 'lock_ids array is required');

        $cart = $this->carts->getActiveCart($customerId);
        abort_if(! $cart, 404, 'No active booking cart.');
        abort_if(! $cart->address_id, 400, 'Select a service address on the cart before checkout.');

        $lineRows = CustomerBookingCartLine::where('cart_id', $cart->cart_id)->orderBy('line_id')->get();
        abort_if($lineRows->isEmpty(), 400, 'Cart has no lines.');
        abort_if($lineRows->count() !== count($lockIds), 400, "Expected {$lineRows->count()} lock_ids ... got ".count($lockIds).'.');

        $dateStr = substr((string) $cart->scheduled_date, 0, 10);
        $locks = [];
        foreach ($lockIds as $i => $lockId) {
            $line = $lineRows[$i];
            $lock = BookingLock::find($lockId);
            $invalid = ! $lock || (int) $lock->customer_id !== (int) $customerId || ! $lock->is_active || now()->greaterThan($lock->expires_at);
            abort_if($invalid, 410, "Lock invalid or expired (index {$i}).");
            $mismatched = (int) $lock->service_id !== (int) $line->service_id || (int) $lock->slot_id !== (int) $cart->slot_id || (int) $lock->area_id !== (int) $cart->area_id;
            abort_if($mismatched, 400, "Lock {$i}+1 does not match cart line or slot.");
            abort_if(substr((string) $lock->scheduled_date, 0, 10) !== $dateStr, 400, 'Lock scheduled date does not match cart.');
            $locks[] = $lock;
        }

        $lineSubtotal = array_sum(array_map(fn ($l) => (float) $l->locked_price, $locks));

        $lineSnapshots = [];
        foreach ($lineRows as $i => $line) {
            $service = MstrService::find($line->service_id);
            $btLabel = $line->booking_type_id ? DB::table('efm_lkp_booking_type')->where('booking_type_id', $line->booking_type_id)->value('booking_type') : null;
            $photos = is_string($line->photo_urls) ? (json_decode($line->photo_urls, true) ?: []) : ($line->photo_urls ?? []);

            $lineSnapshots[] = [
                'line_id' => $line->line_id, 'service_id' => $line->service_id, 'service_name' => $service?->service,
                'quantity' => $line->quantity ?: 1, 'booking_type_id' => $line->booking_type_id, 'booking_type_label' => $btLabel,
                'line_total' => CartPricingService::roundMoney((float) $locks[$i]->locked_price), 'lock_id' => $locks[$i]->lock_id,
                'photos' => array_map(fn ($p) => PublicUrlResolver::resolve($request, $p), $photos),
                'service_icon' => PublicUrlResolver::resolve($request, $service?->service_icon ?? $service?->image_url),
                'image' => PublicUrlResolver::resolve($request, $service?->image_url ?? $service?->service_icon),
            ];
        }

        $price = $this->pricing->computePriceFromLineSubtotal($lineSubtotal);

        $firstService = MstrService::find($lineRows[0]->service_id);
        $serviceCategoryId = $firstService?->category_id;
        abort_if(! $serviceCategoryId, 500, 'Primary service category missing.');
        $bookingTypeId = $lineRows[0]->booking_type_id > 0 ? $lineRows[0]->booking_type_id : 1;
        $instructions = substr((string) ($cart->instructions ?? ''), 0, 400);
        $timeStr = $cart->scheduled_time;

        $snapshot = [
            'v' => 1, 'lines' => $lineSnapshots, 'price' => $price, 'currency' => 'INR',
            'scheduled_date' => $dateStr, 'scheduled_time' => $timeStr, 'slot_id' => $cart->slot_id, 'customer_instructions' => $instructions,
        ];
        $problemDescription = substr(json_encode($snapshot), 0, 8000);
        $bookingUid = $this->generateBookingUid();
        $fyId = $this->fy->resolveFyIdForDate();

        $booking = DB::transaction(function () use ($request, $customerId, $cart, $lineRows, $locks, $lockIds, $price, $serviceCategoryId, $bookingTypeId, $problemDescription, $dateStr, $timeStr, $bookingUid, $fyId, $lineSnapshots) {
            $booking = \Efixmate\Domain\Models\Booking::create([
                'booking_uid' => $bookingUid, 'customer_id' => $customerId, 'address_id' => $cart->address_id,
                'service_category_id' => $serviceCategoryId, 'service_id' => $lineRows[0]->service_id, 'booking_type_id' => $bookingTypeId,
                'quantity' => 1, 'base_price' => $price['subtotal'], 'unit_price' => $price['total'], 'estimated_price' => $price['total'],
                'booking_status_id' => BookingStatus::PENDING, 'payment_status_id' => 1, 'problem_description' => $problemDescription,
                'scheduled_date' => $dateStr, 'scheduled_time' => $timeStr, 'area_id' => $cart->area_id, 'slot_id' => $cart->slot_id,
                'fy_id' => $fyId, 'created_by' => 'user', 'created_at' => now(),
            ]);

            $snapPayload = $this->snapshotSvc->buildSnapshotPayload([
                'bookingId' => $booking->booking_id, 'serviceId' => $lineRows[0]->service_id, 'areaId' => $cart->area_id, 'slotId' => $cart->slot_id,
                'bookingTypeId' => $bookingTypeId, 'scheduledAt' => "{$dateStr}T".($timeStr ?: '00:00').':00', 'customerId' => $customerId,
                'quantity' => 1, 'lockedPrice' => $price['total'], 'lockId' => $locks[0]?->lock_id, 'linesSnapshot' => $lineSnapshots, 'fallbackBasePrice' => $price['subtotal'],
            ]);
            $snapPayload['final_price'] = $price['total'];
            $snapPayload['subtotal_before_tax'] = $price['subtotal'];
            $snapPayload['locked_price'] = $price['total'];
            $snapPayload['taxes'] = $price['tax_amount'] > 0 ? [['name' => 'GST', 'rate' => $price['tax_percent'], 'amount' => $price['tax_amount']]] : [];

            $quote = $this->pricing->buildCartQuote($cart, $lineRows, (int) $cart->slot_id, $dateStr, (string) $timeStr, $locks[0]->coupon_code ?? null);
            if ($quote['ok']) {
                $context = $this->contextSvc->buildContextSnapshotsFromQuote($cart->toArray(), $quote['data'], collect($locks)->map(fn ($l) => $l->toArray())->all());
                $snapPayload = $this->contextSvc->attachContextToSnapshotPayload($snapPayload, $context);
            }

            $snapRow = $this->snapshotSvc->insertSnapshot($snapPayload);

            $booking->update(['final_price' => $price['total'], 'estimated_price' => $price['total']]);

            $breakdownInput = array_merge($snapPayload, ['booking_id' => $booking->booking_id, 'snapshot_id' => $snapRow?->snapshot_id]);
            ['header' => $header, 'lines' => $breakdownLines] = $this->breakdownSvc->buildFromSnapshot($breakdownInput, ['platformFees' => $price['platform_fee'], 'customerPayable' => $price['total']]);
            $this->breakdownSvc->insert($header, $breakdownLines);

            BookingStatusLog::create([
                'booking_id' => $booking->booking_id, 'old_status' => null, 'new_status' => BookingStatus::PENDING,
                'changed_by' => (string) $customerId, 'remark' => 'Booking created from cart checkout', 'created_at' => now(),
            ]);

            foreach ($lockIds as $lockId) {
                BookingLock::where('lock_id', $lockId)->update(['is_active' => false, 'lock_status' => 'CONSUMED']);
            }

            $reservationIds = collect($locks)->pluck('reservation_id')->filter()->unique();
            foreach ($reservationIds as $rid) {
                $this->reservations->consumeReservation($rid);
            }

            $cart->update(['is_active' => false, 'updated_at' => now()]);

            return $booking;
        });

        return response()->json(['status' => true, 'message' => 'Booking created. Proceed to payment.', 'data' => [
            'booking_id' => $booking->booking_id, 'booking_uid' => $booking->booking_uid, 'amount_due' => $price['total'],
            'currency' => 'INR', 'price' => $price, 'snapshot' => $snapshot,
        ]], 201);
    }

    /** GET /api/user/bookings/{bookingId}/payment-summary */
    public function paymentSummary(Request $request, int $bookingId)
    {
        $booking = $this->helper->loadOwnBooking($request->user()->customer_id, $bookingId);
        abort_if(! $booking, 404, 'Booking not found');

        $snap = $this->helper->parseCheckoutSnapshot($booking->problem_description);
        $address = DB::table('efm_customer_address')->where('address_id', $booking->address_id)->select('address', 'city', 'state', 'pincode')->first();
        $addressSummary = $address ? trim(implode(', ', array_filter([$address->address, $address->city, $address->pincode]))) : '';
        $slot = $booking->slot_id ? DB::table('efm_mstr_time_slots')->where('slot_id', $booking->slot_id)->select('slot_id', 'name', 'start_time', 'end_time')->first() : null;
        $scheduledDate = substr((string) $booking->scheduled_date, 0, 10);
        $amount = $snap['price']['total'] ?? (float) ($booking->estimated_price ?? $booking->unit_price ?? $booking->base_price ?? 0);

        return response()->json(['status' => true, 'data' => [
            'booking_id' => $booking->booking_id, 'booking_uid' => $booking->booking_uid, 'amount_due' => round($amount, 2), 'currency' => 'INR',
            'scheduled_date' => $scheduledDate, 'scheduled_time' => $booking->scheduled_time, 'slot' => $slot ?: ($booking->slot_id ? ['slot_id' => $booking->slot_id] : null),
            'address' => $address, 'address_summary' => $addressSummary, 'lines' => $snap['lines'] ?? [],
            'price_breakup' => $snap['price'] ?? ['subtotal' => $booking->base_price, 'total' => $amount], 'payment_status_id' => $booking->payment_status_id,
        ]]);
    }

    /** GET /api/user/bookings/{bookingId}/confirmation */
    public function confirmationSummary(Request $request, int $bookingId)
    {
        $booking = $this->helper->loadOwnBooking($request->user()->customer_id, $bookingId);
        abort_if(! $booking, 404, 'Booking not found');

        $snap = $this->helper->parseCheckoutSnapshot($booking->problem_description);
        $lines = $snap['lines'] ?? [];
        $paid = (int) $booking->payment_status_id === 2
            ? (float) ($booking->final_price ?? $booking->estimated_price ?? 0)
            : (float) ($snap['price']['total'] ?? $booking->estimated_price ?? 0);
        $slot = $booking->slot_id ? DB::table('efm_mstr_time_slots')->where('slot_id', $booking->slot_id)->select('start_time', 'end_time', 'name')->first() : null;
        $scheduledDate = substr((string) $booking->scheduled_date, 0, 10);

        return response()->json(['status' => true, 'data' => [
            'booking_id' => $booking->booking_id, 'booking_uid' => $booking->booking_uid, 'scheduled_date' => $scheduledDate,
            'scheduled_time' => $booking->scheduled_time, 'time_slot_label' => $this->helper->formatSlotLabel($scheduledDate, $booking->scheduled_time, $slot),
            'address_summary' => '', 'service_count' => count($lines) ?: 1, 'total_paid_amount' => round($paid, 2), 'currency' => 'INR',
            'payment_status_id' => $booking->payment_status_id, 'booking_status_id' => $booking->booking_status_id,
        ]]);
    }

    /** GET /api/user/bookings/{bookingId} */
    public function customerDetail(Request $request, int $bookingId)
    {
        $booking = $this->helper->loadOwnBooking($request->user()->customer_id, $bookingId);
        abort_if(! $booking, 404, 'Booking not found');

        $snap = $this->helper->parseCheckoutSnapshot($booking->problem_description);
        $address = DB::table('efm_customer_address')->where('address_id', $booking->address_id)->first();
        $slot = $booking->slot_id ? DB::table('efm_mstr_time_slots')->where('slot_id', $booking->slot_id)->select('slot_id', 'name', 'start_time', 'end_time')->first() : null;

        $gateway = DB::table('efm_payment_orders as o')
            ->join('efm_gateway_payment as g', 'g.order_id', '=', 'o.order_id')
            ->leftJoin('efm_lkp_payment_modes as pm', 'pm.payment_mode_id', '=', 'g.payment_mode_id')
            ->where('o.booking_id', $bookingId)
            ->orderByDesc('g.payment_id')
            ->select('g.gateway_payment_id', 'g.amount', 'g.paid_at', 'g.payment_mode_id', 'pm.payment_mode')
            ->first();

        $logs = BookingStatusLog::where('booking_id', $bookingId)->orderBy('created_at')->get(['old_status', 'new_status', 'remark', 'created_at']);

        $lines = $this->helper->enrichBookingLines($request, $snap['lines'] ?? [], $booking);

        $priceBreakup = $snap['price'] ?? ['subtotal' => $booking->base_price, 'platform_fee' => 0, 'tax_percent' => $this->pricing->fetchDefaultTaxPercent(), 'tax_amount' => 0, 'total' => (float) ($booking->estimated_price ?? $booking->final_price ?? 0)];

        $timeline = $this->helper->buildTimeline($booking);

        $problemImages = collect($lines)->pluck('photos')->flatten()->filter()->unique()->values()->all();
        $cancelLog = $logs->where('new_status', BookingStatus::CANCELLED)->last();

        $problemDescription = $snap ? ($snap['customer_instructions'] ?? '') : (is_string($booking->problem_description) ? $booking->problem_description : '');

        return response()->json(['status' => true, 'data' => [
            'booking' => [
                'booking_id' => $booking->booking_id, 'booking_uid' => $booking->booking_uid, 'booking_number' => $booking->booking_uid,
                'service_name' => $booking->service_name, 'booking_status_id' => $booking->booking_status_id, 'booking_status_label' => $booking->booking_status_label,
                'payment_status_id' => $booking->payment_status_id, 'payment_mode_id' => $booking->payment_mode_id, 'payment_mode_label' => $booking->payment_mode_label,
                'service_icon' => PublicUrlResolver::resolve($request, $booking->service_icon ?? $booking->service_image_url),
                'scheduled_date' => substr((string) $booking->scheduled_date, 0, 10), 'scheduled_time' => $booking->scheduled_time,
                'slot' => $slot, 'slot_summary' => $this->helper->formatSlotLabel(substr((string) $booking->scheduled_date, 0, 10), $booking->scheduled_time, $slot),
                'address' => $address, 'category_name' => $booking->category_name, 'booking_type_id' => $booking->booking_type_id,
                'customer_instructions' => $snap['customer_instructions'] ?? '', 'problem_description' => $problemDescription, 'problem_images' => $problemImages,
                'created_at' => $booking->created_at, 'cancelled_at' => $booking->cancelled_at, 'cancellation_reason' => $cancelLog->remark ?? null,
            ],
            'lines' => $lines, 'price_breakup' => $priceBreakup,
            'payment' => [
                'payment_mode_id' => $booking->payment_mode_id ?? $gateway->payment_mode_id ?? null,
                'payment_mode' => $booking->payment_mode_label ?? $gateway->payment_mode ?? null,
                'payment_status_id' => $booking->payment_status_id,
                'payment_status' => [30 => 'Pending', 31 => 'Paid', 32 => 'Failed', 33 => 'Refunded', 34 => 'Partial Refund'][$booking->payment_status_id] ?? 'Pending',
                'transaction_id' => $gateway->gateway_payment_id ?? null, 'amount' => $gateway ? (float) $gateway->amount : null, 'paid_at' => $gateway->paid_at ?? null,
            ],
            'timeline' => $timeline,
        ]]);
    }

    /** POST /api/user/booking/cart/apply-coupon */
    public function applyCouponToLocks(Request $request)
    {
        $couponCode = $request->input('coupon_code') ?? $request->input('couponCode');
        $lockIds = $request->input('lock_ids') ?? $request->input('lockIds');
        abort_if(! $couponCode || ! is_array($lockIds) || empty($lockIds), 400, 'coupon_code and lock_ids[] are required');

        $customerId = $request->user()->customer_id;
        $coupon = \Efixmate\Domain\Models\MstrCoupon::whereRaw('UPPER(coupon_code) = ?', [strtoupper($couponCode)])->where('is_active', true)->first();
        abort_if(! $coupon, 404, 'Invalid coupon');
        abort_if($coupon->valid_from && now()->lt($coupon->valid_from), 400, 'Coupon not yet active');
        abort_if($coupon->valid_until && now()->gt($coupon->valid_until), 400, 'Coupon expired');

        $locks = [];
        foreach ($lockIds as $lid) {
            $lock = BookingLock::where('lock_id', $lid)->where('customer_id', $customerId)->where('is_active', true)->first();
            abort_if(! $lock || now()->greaterThan($lock->expires_at), 410, "Lock invalid or expired: {$lid}");
            $locks[] = $lock;
        }

        $serviceRows = \Efixmate\Domain\Models\MapCouponService::where('coupon_id', $coupon->coupon_id)->whereNotNull('service_id')->pluck('service_id')->all();
        $catRows = \Efixmate\Domain\Models\MapCouponService::where('coupon_id', $coupon->coupon_id)->whereNotNull('category_id')->pluck('category_id')->all();
        if (! empty($serviceRows) || ! empty($catRows)) {
            foreach ($locks as $lock) {
                $svc = MstrService::find($lock->service_id);
                $okService = in_array($lock->service_id, $serviceRows, true);
                $okCat = $svc && in_array($svc->category_id, $catRows, true);
                abort_if(! $okService && ! $okCat, 400, 'Coupon not valid for every service in the cart.');
            }
        }

        $areaMap = \Efixmate\Domain\Models\MapCouponArea::where('coupon_id', $coupon->coupon_id)->pluck('area_id')->all();
        if (! empty($areaMap)) {
            foreach ($locks as $lock) {
                abort_if(! in_array($lock->area_id, $areaMap, true), 400, 'Coupon not valid for this service area.');
            }
        }

        $sumBefore = array_sum(array_map(fn ($l) => (float) $l->locked_price, $locks));
        abort_if($coupon->min_order_amount !== null && $sumBefore < (float) $coupon->min_order_amount, 400, 'Order amount below coupon minimum');

        if (strtoupper((string) $coupon->discount_type) === 'PERCENTAGE') {
            $discountTotal = $sumBefore * (float) $coupon->discount_value / 100;
            if ($coupon->max_discount_amount !== null && $discountTotal > (float) $coupon->max_discount_amount) {
                $discountTotal = (float) $coupon->max_discount_amount;
            }
        } else {
            $discountTotal = min((float) $coupon->discount_value, $sumBefore);
        }

        $after = max(0, $sumBefore - $discountTotal);
        $factor = $sumBefore > 0 ? $after / $sumBefore : 1;

        $allocated = 0;
        $results = [];
        $count = count($locks);
        foreach ($locks as $i => $lock) {
            $orig = (float) $lock->locked_price;
            if ($i < $count - 1) {
                $newPrice = max(0, round($orig * $factor * 100) / 100);
                $allocated += $newPrice;
            } else {
                $newPrice = max(0, round(($after - $allocated) * 100) / 100);
            }
            $lock->update(['locked_price' => $newPrice, 'coupon_code' => $coupon->coupon_code]);
            $results[] = ['lock_id' => $lock->lock_id, 'was' => round($orig, 2), 'now' => $newPrice];
        }

        return response()->json(['status' => true, 'message' => 'Coupon applied to all locks', 'data' => [
            'coupon_code' => $coupon->coupon_code, 'discount_total' => round($discountTotal, 2), 'sum_before' => round($sumBefore, 2), 'sum_after' => round($after, 2), 'locks' => $results,
        ]]);
    }
}
