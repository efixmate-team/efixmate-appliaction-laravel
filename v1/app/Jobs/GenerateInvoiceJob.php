<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasDefaultJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use App\Services\FinancialYearService;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Direct job-shape port of platform-invoice (queues/workers/invoice.worker.js) —
 * generates the GST breakdown + efm_invoices row for a completed/paid booking.
 * $data expects: ['booking_id' => int, 'generated_by' => ?int].
 */
class GenerateInvoiceJob implements ShouldQueue
{
    use Dispatchable, HasDefaultJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        $bookingId = $this->data['booking_id'] ?? null;
        if (! $bookingId || Invoice::where('booking_id', $bookingId)->exists()) {
            return;
        }

        $booking = Booking::find($bookingId);
        if (! $booking) {
            return;
        }

        $amount = (float) ($booking->final_price ?? $booking->estimated_price ?? 0);
        $gstRate = 18.0;
        $taxableAmount = round($amount / (1 + $gstRate / 100), 2);
        $gstAmount = round($amount - $taxableAmount, 2);
        $isIntraState = true; // Single-country/state deployment for now; interstate GST split deferred.

        Invoice::create([
            'booking_id' => $bookingId,
            'invoice_number' => 'INV-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
            'amount' => $amount,
            'status' => 'generated',
            'taxable_amount' => $taxableAmount,
            'gst_amount' => $gstAmount,
            'cgst_amount' => $isIntraState ? round($gstAmount / 2, 2) : 0,
            'sgst_amount' => $isIntraState ? round($gstAmount / 2, 2) : 0,
            'igst_amount' => $isIntraState ? 0 : $gstAmount,
            'gst_rate' => $gstRate,
            'customer_id' => $booking->customer_id,
            'generated_by' => $this->data['generated_by'] ?? null,
            'is_active' => true,
            'fy_id' => app(FinancialYearService::class)->resolveFyIdForDate(),
            'created_at' => now(),
        ]);
    }
}
