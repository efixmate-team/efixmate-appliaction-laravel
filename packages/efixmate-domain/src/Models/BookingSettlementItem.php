<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingSettlementItem extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_settlement_item';
    protected $primaryKey = 'item_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'item_type',
        'direction',
        'amount',
        'currency',
        'status',
        'settlement_batch_id',
        'payout_id',
        'ref_type',
        'ref_id',
        'meta',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
        'settled_at',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'amount' => 'decimal:2',
        'settlement_batch_id' => 'integer',
        'payout_id' => 'integer',
        'meta' => 'array',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'settled_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
