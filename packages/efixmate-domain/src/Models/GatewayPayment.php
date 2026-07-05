<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class GatewayPayment extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_gateway_payment';
    protected $primaryKey = 'payment_id';
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'gateway_payment_id',
        'gateway_signature',
        'amount',
        'currency',
        'payment_mode_id',
        'payment_status_id',
        'paid_at',
        'raw_response',
        'is_active',
        'created_by',
        'created_at',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
    ];

    protected $casts = [
        'payment_id' => 'integer',
        'order_id' => 'integer',
        'amount' => 'decimal:2',
        'payment_mode_id' => 'integer',
        'payment_status_id' => 'integer',
        'paid_at' => 'datetime',
        'raw_response' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
