<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianSuspension extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_suspensions';
    protected $primaryKey = 'suspension_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'reason',
        'suspended_by',
        'suspended_at',
        'reinstated_by',
        'reinstated_at',
        'is_active',
    ];

    protected $casts = [
        'suspension_id' => 'integer',
        'technician_id' => 'integer',
        'suspended_by' => 'integer',
        'suspended_at' => 'datetime',
        'reinstated_by' => 'integer',
        'reinstated_at' => 'datetime',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
    ];
}
