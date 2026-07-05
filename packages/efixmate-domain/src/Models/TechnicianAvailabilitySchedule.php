<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianAvailabilitySchedule extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_availability_schedule';
    protected $primaryKey = 'schedule_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'schedule_id' => 'integer',
        'technician_id' => 'integer',
        'day_of_week' => 'integer',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
    ];
}
