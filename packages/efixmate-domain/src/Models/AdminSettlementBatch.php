<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminSettlementBatch extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_settlement_batches';
    protected $primaryKey = 'batch_id';
    public $timestamps = false;

    protected $fillable = [
        'period_start',
        'period_end',
        'status',
        'total_amount',
        'technician_count',
        'commission_total',
        'tds_total',
        'gst_total',
        'gross_payout_total',
        'net_payout_total',
        'meta',
        'processed_by',
        'processed_at',
        'created_at',
    ];

    protected $casts = [
        'batch_id' => 'integer',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'total_amount' => 'decimal:2',
        'technician_count' => 'integer',
        'commission_total' => 'decimal:2',
        'tds_total' => 'decimal:2',
        'gst_total' => 'decimal:2',
        'gross_payout_total' => 'decimal:2',
        'net_payout_total' => 'decimal:2',
        'meta' => 'array',
        'processed_by' => 'integer',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
