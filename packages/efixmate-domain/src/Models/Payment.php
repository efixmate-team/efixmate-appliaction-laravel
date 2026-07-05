<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_payments';
    protected $primaryKey = 'payment_id';
    public $timestamps = false;

    protected $fillable = [
        'payment_uid',
        'booking_id',
        'gateway',
        'gateway_txn_id',
        'amount',
        'currency',
        'status',
        'payment_mode',
        'payment_status_id',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'initiated_at',
        'completed_at',
        'failed_at',
        'meta',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'payment_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'payment_status_id' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'initiated_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
