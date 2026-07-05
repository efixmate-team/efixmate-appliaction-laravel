<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasDefaultJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Direct job-shape port of platform-invoice (queues/workers/invoice.worker.js),
 * invoked by the invoice generation flow / admin finance "generate invoice"
 * endpoint. Real invoice-generation logic (GST breakdown, PDF, efm_invoices row)
 * is wired in when Stage 6/7 build the admin finance module.
 */
class GenerateInvoiceJob implements ShouldQueue
{
    use Dispatchable, HasDefaultJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        // Real invoice-generation logic not yet ported — see class docblock.
    }
}
