<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingCommissionSnapshot extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_commission_snapshot';
    protected $primaryKey = 'snapshot_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'breakdown_id',
        'gross_basis',
        'matched_rules',
        'base_commission_amount',
        'surge_commission_amount',
        'promo_adjustment',
        'total_commission_amount',
        'gst_on_commission',
        'gst_rate',
        'technician_gross_earning',
        'tds_rate',
        'tds_accrued',
        'tds_section',
        'technician_net_earning',
        'platform_net_revenue',
        'calculation_meta',
        'engine_version',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
    ];

    protected $casts = [
        'snapshot_id' => 'integer',
        'booking_id' => 'integer',
        'breakdown_id' => 'integer',
        'gross_basis' => 'decimal:2',
        'matched_rules' => 'array',
        'base_commission_amount' => 'decimal:2',
        'surge_commission_amount' => 'decimal:2',
        'promo_adjustment' => 'decimal:2',
        'total_commission_amount' => 'decimal:2',
        'gst_on_commission' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'technician_gross_earning' => 'decimal:2',
        'tds_rate' => 'decimal:2',
        'tds_accrued' => 'decimal:2',
        'technician_net_earning' => 'decimal:2',
        'platform_net_revenue' => 'decimal:2',
        'calculation_meta' => 'array',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
