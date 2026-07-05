<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminBookingSlaPolicy extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_booking_sla_policies';
    protected $primaryKey = 'policy_id';
    public $timestamps = false;

    protected $fillable = [
        'priority',
        'assignment_minutes',
        'completion_minutes',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'policy_id' => 'integer',
        'assignment_minutes' => 'integer',
        'completion_minutes' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
