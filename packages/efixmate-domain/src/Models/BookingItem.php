<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingItem extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_items';
    protected $primaryKey = 'item_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'service_id',
        'booking_type_id',
        'unit_id',
        'quantity',
        'unit_price',
        'line_total',
        'display_order',
        'technician_notes',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'booking_id' => 'integer',
        'service_id' => 'integer',
        'booking_type_id' => 'integer',
        'unit_id' => 'integer',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'display_order' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
