<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingPricing extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_pricing';
    protected $primaryKey = 'pricing_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'subtotal',
        'platform_fee',
        'surge_amount',
        'manual_discount',
        'coupon_code',
        'coupon_discount',
        'tax_rate',
        'tax_amount',
        'final_amount',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'updated_at',
    ];

    protected $casts = [
        'pricing_id' => 'integer',
        'booking_id' => 'integer',
        'subtotal' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'surge_amount' => 'decimal:2',
        'manual_discount' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
