<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Payout extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_payouts';
    protected $primaryKey = 'payout_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'amount',
        'payout_method',
        'status',
        'vendor_type',
        'vendor_id',
        'settlement_batch_id',
        'reference_no',
        'tds_amount',
        'booking_id',
        'gross_amount',
        'net_amount',
        'commission_amount',
        'gst_amount',
        'meta',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'processed_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'payout_id' => 'integer',
        'technician_id' => 'integer',
        'amount' => 'decimal:2',
        'vendor_id' => 'integer',
        'settlement_batch_id' => 'integer',
        'tds_amount' => 'decimal:2',
        'booking_id' => 'integer',
        'gross_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'meta' => 'array',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
