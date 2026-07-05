<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class PaymentOrder extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_payment_orders';
    protected $primaryKey = 'order_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'booking_id',
        'fy_id',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'amount',
        'currency',
        'payment_type',
        'booking_type_id',
        'gateway_order_id',
        'payment_status_id',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'customer_id' => 'integer',
        'booking_id' => 'integer',
        'fy_id' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'amount' => 'decimal:2',
        'booking_type_id' => 'integer',
        'payment_status_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
