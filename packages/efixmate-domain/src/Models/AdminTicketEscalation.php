<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminTicketEscalation extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_ticket_escalations';
    protected $primaryKey = 'escalation_id';
    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'ticket_source',
        'from_level',
        'to_level',
        'reason',
        'escalated_by',
        'created_at',
    ];

    protected $casts = [
        'escalation_id' => 'integer',
        'ticket_id' => 'integer',
        'from_level' => 'integer',
        'to_level' => 'integer',
        'escalated_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
