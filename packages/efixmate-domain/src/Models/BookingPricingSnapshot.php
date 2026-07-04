<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingPricingSnapshot extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_pricing_snapshot';
    protected $primaryKey = 'snapshot_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'base_price', 'matched_rules', 'area_adjustment', 'slot_adjustment',
        'surge_charge', 'discounts', 'taxes', 'coupon_data', 'subtotal_before_tax',
        'final_price', 'quantity', 'currency', 'locked_price', 'lock_id',
        'engine_version', 'pricing_context', 'lines_snapshot', 'service_snapshot',
        'slot_snapshot', 'charge_snapshot', 'technician_snapshot',
        'pricing_rules_fingerprint', 'country_id', 'state_id', 'city_id', 'area_id',
        'fy_id', 'created_at',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'base_price' => 'decimal:2',
        'area_adjustment' => 'decimal:2',
        'slot_adjustment' => 'decimal:2',
        'surge_charge' => 'decimal:2',
        'subtotal_before_tax' => 'decimal:2',
        'final_price' => 'decimal:2',
        'locked_price' => 'decimal:2',
        'quantity' => 'integer',
        'matched_rules' => 'array',
        'discounts' => 'array',
        'taxes' => 'array',
        'coupon_data' => 'array',
        'pricing_context' => 'array',
        'lines_snapshot' => 'array',
        'service_snapshot' => 'array',
        'slot_snapshot' => 'array',
        'charge_snapshot' => 'array',
        'technician_snapshot' => 'array',
        'created_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }
}
