<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingPriceBreakdown extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_price_breakdown';
    protected $primaryKey = 'breakdown_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'snapshot_id', 'currency', 'quantity', 'base_price', 'area_amount',
        'slot_amount', 'surge_amount', 'technician_charges', 'platform_fees',
        'tax_amount', 'discount_amount', 'coupon_amount', 'commission_amount',
        'wallet_deduction', 'cashback_amount', 'subtotal_before_tax', 'customer_payable',
        'technician_settlement', 'platform_revenue', 'lines_meta', 'calculation_meta',
        'schema_version', 'country_id', 'state_id', 'city_id', 'area_id', 'fy_id',
        'created_at',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'quantity' => 'integer',
        'base_price' => 'decimal:2',
        'area_amount' => 'decimal:2',
        'slot_amount' => 'decimal:2',
        'surge_amount' => 'decimal:2',
        'technician_charges' => 'decimal:2',
        'platform_fees' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'coupon_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'wallet_deduction' => 'decimal:2',
        'cashback_amount' => 'decimal:2',
        'subtotal_before_tax' => 'decimal:2',
        'customer_payable' => 'decimal:2',
        'technician_settlement' => 'decimal:2',
        'platform_revenue' => 'decimal:2',
        'lines_meta' => 'array',
        'calculation_meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }

    public function lines()
    {
        return $this->hasMany(BookingPriceBreakdownLine::class, 'breakdown_id', 'breakdown_id');
    }
}
