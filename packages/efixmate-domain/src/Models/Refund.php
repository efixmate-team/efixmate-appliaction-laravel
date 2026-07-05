<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_refunds';
    protected $primaryKey = 'refund_id';
    public $timestamps = false;

    protected $fillable = [
        'payment_id',
        'gateway_refund_id',
        'amount',
        'reason',
        'refund_status_id',
        'refunded_at',
        'raw_response',
        'created_at',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
    ];

    protected $casts = [
        'refund_id' => 'integer',
        'payment_id' => 'integer',
        'amount' => 'decimal:2',
        'refund_status_id' => 'integer',
        'refunded_at' => 'datetime',
        'raw_response' => 'array',
        'created_at' => 'datetime',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
