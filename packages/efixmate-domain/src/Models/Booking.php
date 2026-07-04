<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_bookings';
    protected $primaryKey = 'booking_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_uid', 'customer_id', 'address_id', 'service_category_id', 'service_id',
        'booking_type_id', 'quantity', 'base_price', 'unit_price', 'inspection_fee',
        'estimated_price', 'final_price', 'booking_status_id', 'payment_status_id',
        'payment_mode_id', 'problem_description', 'scheduled_date', 'scheduled_time',
        'assigned_at', 'started_at', 'completed_at', 'cancelled_at', 'is_active',
        'created_by', 'created_at', 'updated_by', 'updated_at', 'area_id', 'fy_id',
        'slot_id', 'technician_id', 'country_id', 'state_id', 'city_id',
        'lifecycle_state', 'is_emergency', 'priority', 'sla_due_at', 'fraud_score',
        'fraud_flags', 'duplicate_of_booking_id', 'assigned_admin_id', 'no_service_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_emergency' => 'boolean',
        'is_deleted' => 'boolean',
        'base_price' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'inspection_fee' => 'decimal:2',
        'estimated_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'fraud_score' => 'integer',
        'fraud_flags' => 'array',
        'scheduled_date' => 'datetime',
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'sla_due_at' => 'datetime',
        'no_service_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function service()
    {
        return $this->belongsTo(MstrService::class, 'service_id', 'service_id');
    }

    public function serviceCategory()
    {
        return $this->belongsTo(MstrServiceCategory::class, 'service_category_id', 'category_id');
    }

    public function assignments()
    {
        return $this->hasMany(BookingTechnician::class, 'booking_id', 'booking_id');
    }

    public function pricingSnapshot()
    {
        return $this->hasOne(BookingPricingSnapshot::class, 'booking_id', 'booking_id');
    }

    public function priceBreakdown()
    {
        return $this->hasOne(BookingPriceBreakdown::class, 'booking_id', 'booking_id');
    }
}
