<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasCriticalJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\GatewayPayment;
use Efixmate\Domain\Models\PaymentOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Direct port of UserController.applyGatewayWebhookSuccess() +
 * queues/workers/paymentWebhook.worker.js, enqueued by PaymentController::webhook()
 * after a gateway webhook's HMAC signature is verified.
 */
class ProcessPaymentWebhookJob implements ShouldQueue
{
    use Dispatchable, HasCriticalJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        $bookingId = (int) ($this->data['booking_id'] ?? 0);
        if (! $bookingId) {
            return;
        }

        $order = PaymentOrder::where('booking_id', $bookingId)->orderByDesc('order_id')->first();
        if (! $order) {
            return;
        }

        $raw = $this->data['raw'] ?? [];
        $payEntity = data_get($raw, 'payload.payment.entity') ?? data_get($raw, 'payload.payment');
        $gatewayPaymentId = $this->data['gateway_payment_id']
            ?? ($payEntity['id'] ?? null)
            ?? data_get($raw, 'payload.payment_id')
            ?? ($raw['razorpay_payment_id'] ?? null);
        if (! $gatewayPaymentId) {
            return;
        }

        $amount = (float) ($this->data['amount'] ?? $order->amount ?? 0);
        if (isset($payEntity['amount']) && is_numeric($payEntity['amount'])) {
            $paise = (float) $payEntity['amount'];
            $orderAmt = (float) $order->amount;
            if ($orderAmt > 0 && $paise / 100 <= $orderAmt * 1.01 && $paise / 100 >= $orderAmt * 0.99) {
                $amount = $paise / 100;
            } elseif ($amount === 0.0) {
                $amount = $paise / 100;
            }
        }

        $gwPatch = [
            'gateway_signature' => $raw['signature'] ?? data_get($raw, 'payload.signature'),
            'amount' => $amount, 'payment_status_id' => 2, 'paid_at' => now(), 'raw_response' => $raw,
        ];

        $existing = GatewayPayment::where('order_id', $order->order_id)->where('gateway_payment_id', $gatewayPaymentId)->first();
        if ($existing) {
            $existing->update($gwPatch);
        } else {
            GatewayPayment::create(array_merge($gwPatch, [
                'order_id' => $order->order_id, 'gateway_payment_id' => $gatewayPaymentId,
                'created_by' => 'webhook', 'created_at' => now(),
            ]));
        }

        $order->update(['payment_status_id' => 2, 'updated_by' => 'webhook', 'updated_at' => now()]);

        Booking::where('booking_id', $bookingId)->update([
            'final_price' => $amount, 'completed_at' => now(), 'payment_status_id' => 2,
        ]);
    }
}
