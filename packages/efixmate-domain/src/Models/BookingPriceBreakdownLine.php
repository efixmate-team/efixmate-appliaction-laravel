<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingPriceBreakdownLine extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_price_breakdown_line';
    protected $primaryKey = 'line_id';
    public $timestamps = false;

    protected $fillable = [
        'breakdown_id', 'booking_id', 'line_type', 'line_category', 'direction',
        'amount', 'rate_type', 'rate_value', 'ref_type', 'ref_id', 'label',
        'description', 'sort_order', 'meta', 'country_id', 'state_id', 'city_id',
        'area_id', 'fy_id', 'created_at',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'amount' => 'decimal:2',
        'rate_value' => 'decimal:2',
        'sort_order' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function breakdown()
    {
        return $this->belongsTo(BookingPriceBreakdown::class, 'breakdown_id', 'breakdown_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }
}
