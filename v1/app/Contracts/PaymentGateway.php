<?php

namespace App\Contracts;

/**
 * Direct port of the interface implied by server/src/services/payment/*.js adapters
 * (razorpay.js, cashfree.js — each a plain object with these same methods).
 */
interface PaymentGateway
{
    public function id(): string;

    public function isConfigured(): bool;

    /** Client-safe fields merged into the create-order API response. */
    public function getPublicConfig(): array;

    /** @return array{gatewayOrderId: string, ...} */
    public function createOrder(array $data): array;

    /** @return array{valid: bool, gatewayPaymentId?: string, raw?: mixed, reason?: string} */
    public function verifyPayment(array $data): array;
}
