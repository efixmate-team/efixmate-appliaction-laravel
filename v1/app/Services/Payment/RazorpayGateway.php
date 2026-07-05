<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use Efixmate\Domain\Models\MstrAdminSetting;
use Illuminate\Support\Facades\Http;

/**
 * Direct port of server/src/services/razorpay.service.js +
 * server/src/services/payment/razorpay.js. Uses Laravel's HTTP client against
 * Razorpay's plain REST API (Basic Auth with key_id:key_secret) rather than
 * installing the razorpay/razorpay SDK — functionally identical, since the Node
 * SDK itself is a thin wrapper over the same REST calls (and the Node app already
 * uses plain fetch() for the VPA-validation endpoint, not the SDK, for exactly
 * this reason).
 */
class RazorpayGateway implements PaymentGateway
{
    private ?string $dbKeyId = null;
    private ?string $dbKeySecret = null;
    private bool $dbLoaded = false;

    public function id(): string
    {
        return 'razorpay';
    }

    /** Load credentials from DB if env vars are absent (cached after first call). */
    private function ensureCredentialsLoaded(): void
    {
        if ($this->dbLoaded) return;
        $this->dbLoaded = true;

        if (env('RAZORPAY_KEY_ID') && env('RAZORPAY_KEY_SECRET')) return;

        try {
            $settings = MstrAdminSetting::find(0)?->settings['payment_gateways']['razorpay'] ?? [];
            $this->dbKeyId = $settings['key_id'] ?? null;
            $this->dbKeySecret = $settings['key_secret'] ?? null;
        } catch (\Throwable) {
            // fail silently — env vars remain the authority
        }
    }

    private function keyId(): string
    {
        $this->ensureCredentialsLoaded();

        return env('RAZORPAY_KEY_ID') ?: ($this->dbKeyId ?? '');
    }

    private function keySecret(): string
    {
        $this->ensureCredentialsLoaded();

        return env('RAZORPAY_KEY_SECRET') ?: ($this->dbKeySecret ?? '');
    }

    public function isConfigured(): bool
    {
        return $this->keyId() !== '' && $this->keySecret() !== '';
    }

    public function getPublicConfig(): array
    {
        return ['razorpay_key_id' => $this->keyId(), 'currency' => 'INR'];
    }

    public function createOrder(array $data): array
    {
        abort_unless($this->isConfigured(), 503, 'Razorpay is not configured.');

        $rupees = (float) ($data['amount'] ?? 0);
        abort_if($rupees <= 0, 422, 'Invalid payment amount');

        $response = Http::withBasicAuth($this->keyId(), $this->keySecret())
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => (int) round($rupees * 100),
                'currency' => 'INR',
                'receipt' => $data['receipt'] ?? ('booking_'.$data['bookingId'].'_'.now()->timestamp),
                'notes' => ['booking_id' => (string) $data['bookingId'], ...($data['notes'] ?? [])],
            ]);

        abort_unless($response->successful(), 502, 'Razorpay order creation failed: '.$response->body());

        $order = $response->json();

        return [
            'gatewayOrderId' => $order['id'],
            'razorpay_key_id' => $this->keyId(),
            'currency' => 'INR',
        ];
    }

    public function verifyPayment(array $data): array
    {
        $orderRow = $data['orderRow'];
        $body = $data['body'];

        $orderId = $body['razorpay_order_id'] ?? $orderRow['gateway_order_id'] ?? null;
        $paymentId = $body['razorpay_payment_id'] ?? null;
        $signature = $body['razorpay_signature'] ?? null;

        if (! $orderId || ! $paymentId || ! $signature) {
            return ['valid' => false, 'reason' => 'Missing Razorpay signature fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)'];
        }

        if (! $this->verifySignature($orderId, $paymentId, $signature)) {
            return ['valid' => false, 'reason' => 'Invalid Razorpay payment signature'];
        }

        return ['valid' => true, 'gatewayPaymentId' => $paymentId, 'raw' => $body];
    }

    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        if (! $this->isConfigured()) return false;

        $expected = hash_hmac('sha256', "{$orderId}|{$paymentId}", $this->keySecret());

        return hash_equals($expected, $signature);
    }

    /** @return array{valid: bool, customerName: ?string} */
    public function validateUpiVpa(string $vpa): array
    {
        abort_unless($this->isConfigured(), 503, 'Razorpay is not configured.');

        $response = Http::withBasicAuth($this->keyId(), $this->keySecret())
            ->post('https://api.razorpay.com/v1/payments/validate/vpa', ['vpa' => $vpa]);

        $data = $response->json();
        if (! $response->successful() || ! empty($data['error'])) {
            return ['valid' => false, 'customerName' => null];
        }

        return [
            'valid' => (bool) ($data['success'] ?? false),
            'customerName' => $data['customer_name'] ?? null,
            'vpa' => $data['vpa'] ?? $vpa,
        ];
    }
}
