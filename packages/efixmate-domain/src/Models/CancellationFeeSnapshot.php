<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CancellationFeeSnapshot extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cancellation_fee_snapshot';
    protected $primaryKey = 'snapshot_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'policy_id',
        'fee_type',
        'fee_value',
        'hours_before',
        'cancelled_by',
        'created_at',
    ];

    protected $casts = [
        'snapshot_id' => 'integer',
        'booking_id' => 'integer',
        'policy_id' => 'integer',
        'fee_value' => 'decimal:2',
        'hours_before' => 'decimal:2',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
