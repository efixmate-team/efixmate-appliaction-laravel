<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerBookingCartLine extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_booking_cart_line';
    protected $primaryKey = 'line_id';
    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'service_id',
        'quantity',
        'booking_type_id',
        'photo_urls',
        'sort_order',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'line_id' => 'integer',
        'service_id' => 'integer',
        'quantity' => 'integer',
        'booking_type_id' => 'integer',
        'photo_urls' => 'array',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
