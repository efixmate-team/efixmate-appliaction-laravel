<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BookingLock extends Model
{
    use HasIsDeletedFlag, HasUuids;

    protected $table = 'efm_booking_locks';
    protected $primaryKey = 'lock_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'lock_id', 'customer_id', 'area_id', 'service_id', 'slot_id', 'scheduled_date',
        'locked_price', 'coupon_code', 'status', 'lock_status', 'expires_at',
        'is_active', 'created_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'locked_price' => 'decimal:2',
        'scheduled_date' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}
