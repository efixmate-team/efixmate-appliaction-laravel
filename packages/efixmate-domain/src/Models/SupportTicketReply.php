<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class SupportTicketReply extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_support_ticket_replies';
    protected $primaryKey = 'reply_id';
    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'sender_type',
        'message',
        'attachment_urls',
        'created_at',
        'ticket_source',
    ];

    protected $casts = [
        'reply_id' => 'integer',
        'ticket_id' => 'integer',
        'attachment_urls' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
