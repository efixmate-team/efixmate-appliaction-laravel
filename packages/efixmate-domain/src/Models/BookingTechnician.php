<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

/** Table's own primary key is spelled "asignment_id" (typo preserved from the source schema). */
class BookingTechnician extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_technicians';
    protected $primaryKey = 'asignment_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id', 'booking_id', 'assignment_role', 'is_primary', 'assigned_at',
        'started_at', 'completed_at', 'is_active', 'created_by', 'created_at',
        'updated_by', 'updated_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'booking_id');
    }

    public function technician()
    {
        return $this->belongsTo(Technician::class, 'technician_id', 'technician_id');
    }
}
