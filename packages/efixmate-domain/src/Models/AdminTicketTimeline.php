<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminTicketTimeline extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_ticket_timeline';
    protected $primaryKey = 'timeline_id';
    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'ticket_source',
        'event_type',
        'event_label',
        'actor_type',
        'actor_id',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'timeline_id' => 'integer',
        'ticket_id' => 'integer',
        'actor_id' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
