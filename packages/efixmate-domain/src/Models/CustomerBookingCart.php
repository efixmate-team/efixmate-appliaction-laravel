<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CustomerBookingCart extends Model
{
    use HasIsDeletedFlag, HasUuids;

    protected $table = 'efm_customer_booking_cart';
    protected $primaryKey = 'cart_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'area_id',
        'address_id',
        'slot_id',
        'scheduled_date',
        'scheduled_time',
        'instructions',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'area_id' => 'integer',
        'address_id' => 'integer',
        'slot_id' => 'integer',
        'scheduled_date' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
