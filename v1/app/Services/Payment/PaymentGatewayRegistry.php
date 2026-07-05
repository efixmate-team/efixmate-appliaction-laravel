<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use Efixmate\Domain\Models\MstrAdminSetting;

/**
 * Direct port of server/src/services/payment/index.js + paymentGateway.service.js.
 * Stripe/phonepe adapters exist in the Node registry too but no route in the
 * researched surface actually exercises them (payment_type normalizes legacy
 * 'online'/'mock' to 'razorpay') — only razorpay + cashfree are ported here;
 * add the others if a later stage's research turns up a real caller.
 */
class PaymentGatewayRegistry
{
    private const SYSTEM_ADMIN_ID = 0;

    private const DEFAULT_GATEWAY = 'razorpay';

    public function __construct(private RazorpayGateway $razorpay, private CashfreeGateway $cashfree) {}

    public function get(string $id): ?PaymentGateway
    {
        return match ($id) {
            'razorpay' => $this->razorpay,
            'cashfree' => $this->cashfree,
            default => null,
        };
    }

    /** @param 'accept'|'refund' $type */
    public function getActive(string $type = 'accept'): PaymentGateway
    {
        return $this->get($this->getActiveGatewayId($type)) ?? $this->razorpay;
    }

    public function getActiveGatewayId(string $type = 'accept'): string
    {
        try {
            $settings = MstrAdminSetting::find(self::SYSTEM_ADMIN_ID)?->settings['payment_gateways'][$type] ?? null;
            if (! $settings) return self::DEFAULT_GATEWAY;

            foreach ($settings as $gatewayId => $config) {
                if (! empty($config['enabled']) && ! empty($config['isDefault'])) {
                    return $gatewayId;
                }
            }

            return self::DEFAULT_GATEWAY;
        } catch (\Throwable) {
            return self::DEFAULT_GATEWAY;
        }
    }

    public function getSettings(): ?array
    {
        try {
            return MstrAdminSetting::find(self::SYSTEM_ADMIN_ID)?->settings['payment_gateways'] ?? null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function saveSettings(array $gatewaySettings): void
    {
        $row = MstrAdminSetting::find(self::SYSTEM_ADMIN_ID);
        $settings = $row?->settings ?? [];
        $settings['payment_gateways'] = $gatewaySettings;

        MstrAdminSetting::updateOrCreate(
            ['admin_id' => self::SYSTEM_ADMIN_ID],
            ['settings' => $settings, 'updated_at' => now()],
        );
    }
}
