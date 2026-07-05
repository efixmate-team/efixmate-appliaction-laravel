<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobPause extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_pause';
    protected $primaryKey = 'booking_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'paused_at',
        'resumed_at',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'paused_at' => 'datetime',
        'resumed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
