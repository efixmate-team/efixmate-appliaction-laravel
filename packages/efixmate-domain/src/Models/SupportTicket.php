<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_support_tickets';
    protected $primaryKey = 'ticket_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'booking_id',
        'ticket_number',
        'subject',
        'description',
        'status',
        'priority',
        'category_id',
        'assigned_admin_id',
        'sla_due_at',
        'first_response_at',
        'resolved_at',
        'closed_at',
        'escalation_level',
        'attachment_urls',
        'created_at',
        'updated_at',
        'requester_type',
    ];

    protected $casts = [
        'ticket_id' => 'integer',
        'customer_id' => 'integer',
        'booking_id' => 'integer',
        'category_id' => 'integer',
        'assigned_admin_id' => 'integer',
        'sla_due_at' => 'datetime',
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'escalation_level' => 'integer',
        'attachment_urls' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
