<?php

namespace App\Support;

use Illuminate\Http\Request;

/** Direct port of server/src/middleware/idempotency.middleware.js's `idempotencyKeys` map. */
class IdempotencyKeyDerivers
{
    public static function checkout(Request $request): ?string
    {
        $locks = $request->input('lock_ids', $request->input('lockIds'));
        $customerId = $request->user()?->customer_id;
        if (! $customerId || ! is_array($locks) || empty($locks)) return null;

        $sorted = collect($locks)->map(fn ($l) => (string) $l)->sort()->implode(',');

        return substr(hash('sha256', "{$customerId}:{$sorted}"), 0, 40);
    }

    public static function paymentCreateOrder(Request $request): ?string
    {
        $bookingId = $request->input('booking_id', $request->input('bookingId'));
        $customerId = $request->user()?->customer_id;
        if (! $bookingId || ! $customerId) return null;

        return "c{$customerId}:b{$bookingId}";
    }

    public static function paymentVerify(Request $request): ?string
    {
        $orderId = $request->input('orderId', $request->input('order_id'));
        $payId = $request->input('payment_id', $request->input('gatewayPaymentId', $request->input('razorpay_payment_id')));
        if (! $orderId && ! $payId) return null;

        return substr(hash('sha256', ($orderId ?? '').':'.($payId ?? '')), 0, 40);
    }

    public static function adminRefund(Request $request): ?string
    {
        $bookingId = $request->input('bookingId', $request->input('booking_id'));
        $amount = $request->input('amount');
        $adminId = $request->user()?->admin_id;
        if (! $bookingId || $amount === null || ! $adminId) return null;

        return "a{$adminId}:b{$bookingId}:amt{$amount}";
    }

    public static function adminSettlement(Request $request): ?string
    {
        $start = $request->input('periodStart', $request->input('period_start'));
        $end = $request->input('periodEnd', $request->input('period_end'));
        $adminId = $request->user()?->admin_id;
        if (! $start || ! $end || ! $adminId) return null;

        return "a{$adminId}:{$start}:{$end}";
    }

    public static function adminPayoutRetry(Request $request): ?string
    {
        $payoutId = $request->input('payout_id', $request->input('payoutId'));
        $adminId = $request->user()?->admin_id;
        if (! $payoutId || ! $adminId) return null;

        return "a{$adminId}:p{$payoutId}";
    }
}
