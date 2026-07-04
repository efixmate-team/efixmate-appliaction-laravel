<?php

namespace App\Http\Controllers;

use App\Services\BookingPricingStub;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\BookingPriceBreakdown;
use Efixmate\Domain\Models\BookingPriceBreakdownLine;
use Efixmate\Domain\Models\BookingPricingSnapshot;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Customer-facing booking slice. Mapped to server/src/modules/booking/routes/booking.routes.js —
 * see Stage 6 in the migration plan for exactly what's real vs stubbed here (no dispatch,
 * no payment, no commission/settlement; pricing is BookingPricingStub not the real engine).
 */
class BookingController extends Controller
{
    public function __construct(private BookingPricingStub $pricing) {}

    /** POST /api/customer/booking/initiate — lock the slot + freeze a (stubbed) price. */
    public function initiate(Request $request)
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer'],
            'area_id' => ['required', 'integer'],
            'slot_id' => ['required', 'integer'],
            'scheduled_date' => ['required', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $service = MstrService::findOrFail($data['service_id']);
        $quantity = $data['quantity'] ?? 1;
        $price = $this->pricing->calculate($service, $quantity);

        $lock = BookingLock::create([
            'customer_id' => $request->user()->customer_id,
            'area_id' => $data['area_id'],
            'service_id' => $data['service_id'],
            'slot_id' => $data['slot_id'],
            'scheduled_date' => $data['scheduled_date'],
            'locked_price' => $price,
            'status' => 'ACTIVE',
            'expires_at' => now()->addMinutes(10),
            'is_active' => true,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'lock_id' => $lock->lock_id,
                'price' => $price,
                'quantity' => $quantity,
                'expires_at' => $lock->expires_at,
            ],
        ]);
    }

    /** POST /api/customer/booking/create — creates the booking from an active lock. */
    public function create(Request $request)
    {
        $data = $request->validate([
            'lock_id' => ['required', 'uuid'],
            'address_id' => ['required', 'integer'],
            'booking_type_id' => ['required', 'integer'],
            'problem_description' => ['nullable', 'string'],
        ]);

        $customerId = $request->user()->customer_id;

        $lock = BookingLock::where('lock_id', $data['lock_id'])
            ->where('customer_id', $customerId)
            ->where('status', 'ACTIVE')
            ->where('is_active', true)
            ->firstOrFail();

        abort_if(now()->greaterThan($lock->expires_at), 422, 'Price lock has expired.');

        $service = MstrService::findOrFail($lock->service_id);
        $quantity = 1;

        $booking = Booking::create([
            'booking_uid' => 'BKG-' . Str::upper(Str::random(10)),
            'customer_id' => $customerId,
            'address_id' => $data['address_id'],
            'service_category_id' => $service->category_id,
            'service_id' => $service->service_id,
            'booking_type_id' => $data['booking_type_id'],
            'quantity' => $quantity,
            'base_price' => $lock->locked_price,
            'unit_price' => $lock->locked_price,
            'booking_status_id' => BookingStatus::PENDING,
            'problem_description' => $data['problem_description'] ?? null,
            'scheduled_date' => $lock->scheduled_date,
            'area_id' => $lock->area_id,
            'slot_id' => $lock->slot_id,
            'lifecycle_state' => 'CREATED',
            'created_by' => 'customer:' . $customerId,
            'created_at' => now(),
        ]);

        BookingPricingSnapshot::create([
            'booking_id' => $booking->booking_id,
            'base_price' => $lock->locked_price,
            'matched_rules' => [],
            'area_adjustment' => 0,
            'slot_adjustment' => 0,
            'surge_charge' => 0,
            'discounts' => [],
            'taxes' => [],
            'subtotal_before_tax' => $lock->locked_price,
            'final_price' => $lock->locked_price,
            'quantity' => $quantity,
            'currency' => 'INR',
            'locked_price' => $lock->locked_price,
            'lock_id' => $lock->lock_id,
            'engine_version' => 'stub-v1',
            'created_at' => now(),
        ]);

        $breakdown = BookingPriceBreakdown::create([
            'booking_id' => $booking->booking_id,
            'currency' => 'INR',
            'quantity' => $quantity,
            'base_price' => $lock->locked_price,
            'area_amount' => 0,
            'slot_amount' => 0,
            'surge_amount' => 0,
            'technician_charges' => 0,
            'platform_fees' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'coupon_amount' => 0,
            'commission_amount' => 0,
            'wallet_deduction' => 0,
            'cashback_amount' => 0,
            'subtotal_before_tax' => $lock->locked_price,
            'customer_payable' => $lock->locked_price,
            'technician_settlement' => 0,
            'platform_revenue' => 0,
            'lines_meta' => [],
            'schema_version' => 'stub-v1',
            'created_at' => now(),
        ]);

        BookingPriceBreakdownLine::create([
            'breakdown_id' => $breakdown->breakdown_id,
            'booking_id' => $booking->booking_id,
            'line_type' => 'SERVICE',
            'line_category' => 'BASE',
            'direction' => 'DEBIT',
            'amount' => $lock->locked_price,
            'label' => $service->service,
            'sort_order' => 1,
            'created_at' => now(),
        ]);

        $lock->update(['status' => 'CONSUMED', 'is_active' => false]);

        return response()->json(['success' => true, 'data' => $booking]);
    }

    /** GET /api/customer/booking/{id}/pricing-snapshot */
    public function pricingSnapshot(Request $request, int $bookingId)
    {
        $booking = $this->ownedBooking($request, $bookingId);

        return response()->json(['success' => true, 'data' => $booking->pricingSnapshot]);
    }

    /** GET /api/customer/booking/{id}/price-breakdown */
    public function priceBreakdown(Request $request, int $bookingId)
    {
        $booking = $this->ownedBooking($request, $bookingId);
        $breakdown = $booking->priceBreakdown()->with('lines')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'header' => $breakdown,
                'lines' => $breakdown?->lines,
            ],
        ]);
    }

    /** GET /api/customer/bookings */
    public function index(Request $request)
    {
        $bookings = Booking::where('customer_id', $request->user()->customer_id)
            ->orderByDesc('booking_id')
            ->get();

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    /** GET /api/customer/bookings/{id} */
    public function show(Request $request, int $bookingId)
    {
        return response()->json(['success' => true, 'data' => $this->ownedBooking($request, $bookingId)]);
    }

    /** POST /api/customer/booking/{id}/cancel */
    public function cancel(Request $request, int $bookingId)
    {
        $booking = $this->ownedBooking($request, $bookingId);

        $booking->update([
            'booking_status_id' => BookingStatus::CANCELLED,
            'lifecycle_state' => 'CANCELLED',
            'cancelled_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $booking]);
    }

    private function ownedBooking(Request $request, int $bookingId): Booking
    {
        return Booking::where('booking_id', $bookingId)
            ->where('customer_id', $request->user()->customer_id)
            ->firstOrFail();
    }
}
