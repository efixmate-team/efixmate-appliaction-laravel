<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminTicketSlaPolicy extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_ticket_sla_policies';
    protected $primaryKey = 'policy_id';
    public $timestamps = false;

    protected $fillable = [
        'priority',
        'first_response_minutes',
        'resolution_minutes',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'policy_id' => 'integer',
        'first_response_minutes' => 'integer',
        'resolution_minutes' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
