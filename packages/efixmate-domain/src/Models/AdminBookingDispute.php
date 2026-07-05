<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminBookingDispute extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_booking_disputes';
    protected $primaryKey = 'dispute_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'customer_id',
        'technician_id',
        'dispute_type',
        'status',
        'description',
        'resolution',
        'assigned_admin',
        'meta',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'dispute_id' => 'integer',
        'booking_id' => 'integer',
        'customer_id' => 'integer',
        'technician_id' => 'integer',
        'assigned_admin' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
