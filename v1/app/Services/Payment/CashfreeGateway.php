<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use Illuminate\Support\Facades\Http;

/** Direct port of server/src/services/cashfree.service.js + services/payment/cashfree.js. */
class CashfreeGateway implements PaymentGateway
{
    private const API_VERSION = '2023-08-01';

    public function id(): string
    {
        return 'cashfree';
    }

    private function baseUrl(): string
    {
        return env('CASHFREE_ENV', 'sandbox') === 'production'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }

    private function headers(): array
    {
        return [
            'x-api-version' => self::API_VERSION,
            'x-client-id' => env('CASHFREE_APP_ID', ''),
            'x-client-secret' => env('CASHFREE_SECRET_KEY', ''),
        ];
    }

    public function isConfigured(): bool
    {
        return (bool) (env('CASHFREE_APP_ID') && env('CASHFREE_SECRET_KEY'));
    }

    public function getPublicConfig(): array
    {
        return ['cashfree_env' => env('CASHFREE_ENV', 'sandbox')];
    }

    public function createOrder(array $data): array
    {
        abort_unless($this->isConfigured(), 503, 'Cashfree is not configured.');

        $rupees = (float) ($data['amount'] ?? 0);
        abort_if($rupees <= 0, 422, 'Invalid payment amount');

        $orderId = 'efm_'.$data['bookingId'].'_'.now()->timestamp;

        $response = Http::withHeaders($this->headers())->post("{$this->baseUrl()}/orders", [
            'order_id' => $orderId,
            'order_amount' => $rupees,
            'order_currency' => 'INR',
            'order_note' => "Booking #{$data['bookingId']}",
            'customer_details' => [
                'customer_id' => (string) ($data['customerId'] ?? ''),
                'customer_name' => $data['customerName'] ?? 'Customer',
                'customer_email' => $data['customerEmail'] ?? 'customer@efixmate.com',
                'customer_phone' => $data['customerPhone'] ?? '9999999999',
            ],
        ]);

        abort_unless($response->successful(), 502, $response->json('message') ?? 'Cashfree order creation failed');

        $order = $response->json();

        return [
            'gatewayOrderId' => $order['cf_order_id'] ?? $order['order_id'],
            'cashfree_payment_session_id' => $order['payment_session_id'] ?? null,
            'cashfree_env' => env('CASHFREE_ENV', 'sandbox'),
        ];
    }

    public function getOrderStatus(string $cfOrderId): array
    {
        $response = Http::withHeaders($this->headers())->get("{$this->baseUrl()}/orders/{$cfOrderId}");
        abort_unless($response->successful(), 502, $response->json('message') ?? 'Failed to fetch Cashfree order');

        return $response->json();
    }

    public function getOrderPayments(string $cfOrderId): array
    {
        $response = Http::withHeaders($this->headers())->get("{$this->baseUrl()}/orders/{$cfOrderId}/payments");
        abort_unless($response->successful(), 502, $response->json('message') ?? 'Failed to fetch Cashfree payments');

        return $response->json() ?? [];
    }

    public function verifyPayment(array $data): array
    {
        $orderRow = $data['orderRow'];
        $order = $this->getOrderStatus($orderRow['gateway_order_id']);

        if (($order['order_status'] ?? null) !== 'PAID') {
            return ['valid' => false, 'reason' => 'Payment not confirmed. Gateway status: '.($order['order_status'] ?? 'UNKNOWN')];
        }

        $cfPaymentId = 'cf_'.$orderRow['gateway_order_id'];
        try {
            $payments = $this->getOrderPayments($orderRow['gateway_order_id']);
            $success = collect($payments)->firstWhere('payment_status', 'SUCCESS');
            if (! empty($success['cf_payment_id'])) $cfPaymentId = (string) $success['cf_payment_id'];
        } catch (\Throwable) {
            // non-fatal — order already confirmed PAID
        }

        return ['valid' => true, 'gatewayPaymentId' => $cfPaymentId, 'raw' => ['order' => $order]];
    }

    public function verifyWebhookSignature(string $rawBody, string $timestamp, string $signature): bool
    {
        $secret = env('CASHFREE_SECRET_KEY');
        if (! $secret) return false;

        $expected = base64_encode(hash_hmac('sha256', "{$timestamp}{$rawBody}", $secret, true));

        return hash_equals($expected, $signature);
    }
}
