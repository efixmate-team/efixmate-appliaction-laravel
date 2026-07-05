<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LogTechnicianAssignment extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_log_technician_assignments';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'type',
        'attempt_no',
        'action',
        'reason',
        'payload',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'attempt_no' => 'integer',
        'payload' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
