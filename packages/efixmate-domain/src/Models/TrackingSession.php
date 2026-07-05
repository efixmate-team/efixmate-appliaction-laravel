<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TrackingSession extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_tracking_sessions';
    protected $primaryKey = 'session_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'is_active',
        'last_lat',
        'last_lng',
        'last_updated',
    ];

    protected $casts = [
        'session_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'is_active' => 'boolean',
        'last_lat' => 'decimal:2',
        'last_lng' => 'decimal:2',
        'last_updated' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
