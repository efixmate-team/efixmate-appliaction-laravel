<?php

namespace App\Http\Controllers;

use App\Services\Payment\PaymentGatewayRegistry;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\GatewayPayment;
use Efixmate\Domain\Models\LkpPaymentModes;
use Efixmate\Domain\Models\LogPayment;
use Efixmate\Domain\Models\PaymentOrder;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

/**
 * Direct port of server/src/modules/user/controller/payment.controller.js plus the
 * initiatePayment/verifyPayment/applyGatewayWebhookSuccess methods it delegates to
 * on user.controller.js (UserController). Gateway adapters come from Stage 2's
 * PaymentGatewayRegistry (RazorpayGateway/CashfreeGateway).
 */
class PaymentController extends Controller
{
    public function __construct(private PaymentGatewayRegistry $gateways) {}

    /** GET /api/user/payment/methods */
    public function methodsCatalog()
    {
        $modes = LkpPaymentModes::where('is_active', true)->orderBy('order_seq')->orderBy('payment_mode_id')->get();

        return response()->json(['status' => true, 'data' => [
            'currency' => 'INR',
            'db_modes' => $modes,
            'ui_groups' => [
                ['id' => 'upi', 'label' => 'UPI', 'options' => [
                    ['id' => 'gpay', 'label' => 'Google Pay', 'method_key' => 'UPI'],
                    ['id' => 'phonepe', 'label' => 'PhonePe', 'method_key' => 'UPI'],
                    ['id' => 'paytm', 'label' => 'Paytm UPI', 'method_key' => 'UPI'],
                    ['id' => 'bhim', 'label' => 'BHIM UPI', 'method_key' => 'UPI'],
                ]],
                ['id' => 'cards', 'label' => 'Cards', 'options' => [
                    ['id' => 'card', 'label' => 'Debit / Credit Card', 'method_key' => 'CARD'],
                ]],
                ['id' => 'wallets', 'label' => 'Wallets', 'options' => [
                    ['id' => 'paytm_wallet', 'label' => 'Paytm Wallet', 'method_key' => 'WALLET'],
                    ['id' => 'mobikwik', 'label' => 'Mobikwik Wallet', 'method_key' => 'WALLET'],
                ]],
            ],
        ]]);
    }

    /** POST /api/user/payment/instant-confirm — mock-mode dev bypass, gated to local env in routes. */
    public function instantConfirm(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        abort_if(! $bookingId, 400, 'booking_id is required');

        $booking = Booking::find($bookingId);
        abort_if(! $booking, 404, 'Booking not found');
        abort_if((int) $booking->customer_id !== (int) $request->user()->customer_id, 403, 'Forbidden');

        $amount = (float) ($booking->final_price ?? $booking->estimated_price ?? $booking->unit_price ?? $booking->base_price ?? 0);

        $order = PaymentOrder::create([
            'customer_id' => $booking->customer_id,
            'booking_id' => $bookingId,
            'fy_id' => $booking->fy_id,
            'amount' => $amount,
            'currency' => 'INR',
            'payment_type' => 'mock',
            'gateway_order_id' => "mock_instant_{$bookingId}_".now()->timestamp,
            'payment_status_id' => 2,
            'is_active' => true,
            'created_by' => 'instant_confirm',
            'created_at' => now(),
        ]);

        GatewayPayment::create([
            'order_id' => $order->order_id,
            'gateway_payment_id' => "mock_pay_instant_{$bookingId}_".now()->timestamp,
            'gateway_signature' => 'mock_signature',
            'amount' => $amount,
            'currency' => 'INR',
            'payment_status_id' => 2,
            'paid_at' => now(),
            'raw_response' => ['mode' => 'instant_confirm', 'booking_id' => $bookingId],
            'is_active' => true,
            'created_by' => 'instant_confirm',
            'created_at' => now(),
        ]);

        $booking->update([
            'payment_status_id' => 2, 'booking_status_id' => BookingStatus::CONFIRMED_LEGACY,
            'final_price' => $amount, 'assigned_at' => now(), 'updated_at' => now(), 'updated_by' => 'instant_confirm',
        ]);

        BookingStatusLog::create([
            'booking_id' => $bookingId, 'old_status' => BookingStatus::PENDING, 'new_status' => BookingStatus::CONFIRMED_LEGACY,
            'changed_by' => 'instant_confirm', 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Payment confirmed instantly (mock mode)', 'data' => [
            'booking_id' => $bookingId, 'booking_uid' => $booking->booking_uid, 'amount' => $amount, 'order_id' => $order->order_id,
        ]]);
    }

    /** POST /api/user/payment/create-order and /api/user/payment/retry */
    public function createOrder(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        abort_if(! $bookingId, 400, 'booking_id is required');

        $booking = Booking::find($bookingId);
        abort_if(! $booking, 404, 'Booking not found');
        abort_if((int) $booking->customer_id !== (int) $request->user()->customer_id, 403, 'You cannot pay for this booking');

        $amount = (float) ($booking->final_price ?? $booking->estimated_price ?? $booking->unit_price ?? $booking->base_price ?? 0);
        $paymentMode = strtolower((string) ($request->input('payment_mode') ?? $request->input('paymentMode') ?? 'online'));
        $isCod = $paymentMode === 'cod';
        $effectiveBookingTypeId = $request->input('bookingTypeId') ?? $booking->booking_type_id;

        $gatewayOrderId = 'ORD-'.now()->timestamp;
        $provider = $isCod ? 'cod' : 'mock';
        $gatewayExtra = [];

        if (! $isCod) {
            if (app()->environment('local') && env('PAYMENT_MODE') === 'mock') {
                $gatewayOrderId = "mock_order_{$bookingId}_".now()->timestamp;
                $provider = 'mock';
            } else {
                $adapter = $this->gateways->getActive('accept');
                abort_unless($adapter->isConfigured(), 503, "{$adapter->id()} payment gateway is not configured. Please contact support.");

                $customer = Customer::find($request->user()->customer_id);
                $result = $adapter->createOrder([
                    'amount' => $amount,
                    'bookingId' => $bookingId,
                    'receipt' => "efm_{$bookingId}_".now()->timestamp,
                    'notes' => [
                        'customer_name' => trim("{$customer?->first_name} {$customer?->last_name}"),
                        'customer_phone' => $customer?->mobile_number,
                    ],
                ]);
                $gatewayOrderId = $result['gatewayOrderId'];
                $provider = $adapter->id();
                $gatewayExtra = collect($result)->except('gatewayOrderId')->all();
            }
        }

        $order = PaymentOrder::create([
            'customer_id' => $request->user()->customer_id,
            'booking_id' => $bookingId,
            'amount' => $amount,
            'payment_type' => $isCod ? 'cod' : $provider,
            'booking_type_id' => $effectiveBookingTypeId,
            'gateway_order_id' => $gatewayOrderId,
            'payment_status_id' => 1,
            'is_active' => true,
            'created_by' => 'user',
            'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Payment order initiated', 'data' => array_merge(
            $order->toArray(), ['provider' => $provider], $gatewayExtra
        )], 201);
    }

    /** POST /api/user/payment/verify */
    public function verify(Request $request)
    {
        $orderId = $request->input('orderId');
        if (! $orderId && $request->input('booking_id')) {
            $orderId = PaymentOrder::where('booking_id', $request->input('booking_id'))->orderByDesc('order_id')->value('order_id');
        }
        $gatewayPaymentId = $request->input('gatewayPaymentId') ?? $request->input('payment_id') ?? $request->input('razorpay_payment_id');
        $gatewaySignature = $request->input('gatewaySignature') ?? $request->input('signature') ?? $request->input('razorpay_signature');

        $orderRow = $orderId ? PaymentOrder::find($orderId) : null;

        if ($orderRow) {
            $gatewayId = in_array($orderRow->payment_type, [null, 'online', 'mock'], true) ? 'razorpay' : $orderRow->payment_type;
            $adapter = $this->gateways->get($gatewayId);
            if ($adapter) {
                $result = $adapter->verifyPayment(['orderRow' => $orderRow->toArray(), 'body' => $request->all()]);
                abort_if(! $result['valid'], 400, $result['reason'] ?? 'Payment verification failed');
                $gatewayPaymentId = $result['gatewayPaymentId'];
            }
        }

        abort_if(! $orderId || ! $gatewayPaymentId, 400, 'Order ID and Gateway Payment ID are required');
        abort_if(! $orderRow, 404, 'Payment order not found');
        abort_if((int) $orderRow->customer_id !== (int) $request->user()->customer_id, 403, 'You cannot verify this payment');

        $amount = $request->input('amount', 0);
        $paymentModeId = $request->input('paymentModeId') ?? $request->input('payment_mode_id');

        $gwPatch = [
            'gateway_signature' => $gatewaySignature, 'amount' => $amount, 'payment_mode_id' => $paymentModeId,
            'payment_status_id' => 2, 'paid_at' => now(), 'raw_response' => $request->all(),
        ];

        $transaction = GatewayPayment::where('order_id', $orderId)->where('gateway_payment_id', $gatewayPaymentId)->first();
        if ($transaction) {
            $transaction->update($gwPatch);
        } else {
            $transaction = GatewayPayment::create(array_merge($gwPatch, [
                'order_id' => $orderId, 'gateway_payment_id' => $gatewayPaymentId, 'created_by' => 'user', 'created_at' => now(),
            ]));
        }

        $orderRow->update(['payment_status_id' => 2, 'updated_by' => 'user', 'updated_at' => now()]);

        if ($orderRow->booking_id) {
            Booking::where('booking_id', $orderRow->booking_id)->update([
                'final_price' => $amount, 'completed_at' => now(), 'payment_status_id' => 2,
            ]);
        }

        return response()->json(['status' => true, 'message' => 'Payment verified successfully', 'data' => [
            'payment_order' => $orderRow->fresh(), 'gateway_payment' => $transaction,
        ]]);
    }

    /** POST /api/user/payment/webhook — no auth (gateway calls directly); HMAC-signed. */
    public function webhook(Request $request)
    {
        $signature = $request->header('x-webhook-signature') ?? $request->header('x-razorpay-signature') ?? '';
        $secret = env('PAYMENT_WEBHOOK_SECRET');

        if (! $secret) {
            return response()->json(['status' => false, 'message' => 'Webhook not configured'], 400);
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        if (! $signature || ! hash_equals($expected, $signature)) {
            return response()->json(['status' => false, 'message' => 'Invalid webhook signature'], 401);
        }

        $body = $request->all();
        $payEntity = data_get($body, 'payload.payment.entity') ?? data_get($body, 'payload.payment');
        $event = strtolower((string) ($body['event'] ?? ''));
        $st = strtolower((string) ($payEntity['status'] ?? $body['status'] ?? data_get($body, 'payload.status') ?? ''));
        $paymentId = $payEntity['id'] ?? $body['payment_id'] ?? data_get($body, 'payload.payment_id') ?? $body['razorpay_payment_id'] ?? null;
        $bookingId = (int) ($body['booking_id'] ?? data_get($body, 'payload.booking_id') ?? data_get($payEntity, 'notes.booking_id') ?? 0);
        $amount = (float) ($body['amount'] ?? data_get($body, 'payload.amount') ?? $payEntity['amount'] ?? 0);
        $status = strtoupper((string) ($payEntity['status'] ?? $body['status'] ?? data_get($body, 'payload.status') ?? 'RECEIVED'));

        $isPaid = in_array($event, ['payment.captured', 'order.paid'], true) || in_array($st, ['captured', 'paid'], true);

        if ($bookingId) {
            LogPayment::create([
                'booking_id' => $bookingId, 'payment_id' => $paymentId, 'gateway_type' => 'WEBHOOK',
                'amount' => $amount ?: 0, 'currency' => 'INR', 'status' => $status, 'gateway_res' => $body,
                'webhook_event' => $body['event'] ?? 'payment.webhook', 'attempt_no' => 1, 'created_at' => now(),
            ]);
        }

        if ($bookingId && $isPaid && $paymentId) {
            \App\Jobs\ProcessPaymentWebhookJob::dispatch([
                'booking_id' => $bookingId, 'gateway_payment_id' => $paymentId,
                'amount' => $amount ?: ($body['amount'] ?? null), 'raw' => $body,
            ]);
        }

        return response()->json(['status' => true, 'message' => 'Webhook accepted']);
    }

    /** GET /api/user/payment/status */
    public function statusGet(Request $request)
    {
        $bookingId = $request->query('booking_id');
        abort_if(! $bookingId, 400, 'booking_id is required');

        return response()->json(['status' => true, 'data' => $this->latestPaymentWithGateway((int) $bookingId)]);
    }

    /** POST /api/user/payment/status */
    public function statusPost(Request $request)
    {
        $bookingId = $request->input('booking_id') ?? $request->input('bookingId');
        abort_if(! $bookingId, 400, 'booking_id is required');

        return response()->json(['status' => true, 'data' => $this->latestPaymentWithGateway((int) $bookingId)]);
    }

    /** GET /api/user/payment/processing-state */
    public function processingState(Request $request)
    {
        $bookingId = $request->query('booking_id') ?? $request->query('bookingId');
        abort_if(! $bookingId, 400, 'booking_id is required');

        $booking = Booking::find((int) $bookingId);
        abort_if(! $booking, 404, 'Booking not found');
        abort_if((int) $booking->customer_id !== (int) $request->user()->customer_id, 403, 'Forbidden');

        $data = $this->latestPaymentWithGateway((int) $bookingId);
        $order = $data['payment_order'];
        $gateway = $data['gateway_payment'];

        $bookingPaid = (int) $booking->payment_status_id === 2;
        $orderPaid = $order && (int) $order->payment_status_id === 2;
        $gwPaid = $gateway && (int) $gateway->payment_status_id === 2;

        $stage = 'AWAITING_PAYMENT_ORDER';
        if ($order && ! $gateway) {
            $stage = 'PROCESSING_GATEWAY';
        } elseif ($gateway && ! $gwPaid) {
            $stage = 'VERIFYING_PAYMENT';
        } elseif (($orderPaid && $gwPaid) || $bookingPaid) {
            $stage = $bookingPaid ? 'COMPLETED' : 'FINALIZING_BOOKING';
        }

        $steps = [
            ['id' => 'verify', 'title' => 'Verifying Payment Details', 'state' => ($gwPaid || $bookingPaid) ? 'done' : ($gateway ? 'active' : 'pending'), 'subtitle' => 'Your payment details are being verified securely.'],
            ['id' => 'process', 'title' => 'Processing Payment', 'state' => $bookingPaid ? 'done' : ($orderPaid ? 'active' : 'pending'), 'subtitle' => 'Please do not close this screen.'],
            ['id' => 'finalize', 'title' => 'Finalizing', 'state' => $bookingPaid ? 'done' : (($orderPaid && $gwPaid) ? 'active' : 'pending'), 'subtitle' => 'Almost done! We are confirming your booking.'],
        ];

        $amount = (float) ($booking->final_price ?? $booking->estimated_price ?? $booking->unit_price ?? $booking->base_price ?? 0);

        return response()->json(['status' => true, 'data' => [
            'processing_stage' => $stage, 'booking_uid' => $booking->booking_uid, 'amount' => $amount, 'currency' => 'INR',
            'payment_order' => $order, 'gateway_payment' => $gateway,
            'booking_payment_status_id' => $booking->payment_status_id, 'booking_status_id' => $booking->booking_status_id,
            'steps' => $steps,
        ]]);
    }

    private function latestPaymentWithGateway(int $bookingId): array
    {
        $order = PaymentOrder::where('booking_id', $bookingId)->orderByDesc('order_id')->first();
        $gateway = $order ? GatewayPayment::where('order_id', $order->order_id)->orderByDesc('payment_id')->first() : null;

        return ['payment_order' => $order, 'gateway_payment' => $gateway];
    }
}
