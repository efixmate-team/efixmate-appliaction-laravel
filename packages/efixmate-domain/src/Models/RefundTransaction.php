<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class RefundTransaction extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_refund_transactions';
    protected $primaryKey = 'refund_tx_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'gateway_refund_id',
        'refund_type',
        'amount',
        'status',
        'reason',
        'processed_by',
        'legacy_refund_id',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'refund_tx_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'legacy_refund_id' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
