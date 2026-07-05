<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmClvMetric extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_clv_metrics';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = [
        'lifetime_value',
        'total_bookings',
        'completed_bookings',
        'total_paid',
        'avg_order_value',
        'first_booking_at',
        'last_booking_at',
        'computed_at',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'lifetime_value' => 'decimal:2',
        'total_bookings' => 'integer',
        'completed_bookings' => 'integer',
        'total_paid' => 'decimal:2',
        'avg_order_value' => 'decimal:2',
        'first_booking_at' => 'datetime',
        'last_booking_at' => 'datetime',
        'computed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
