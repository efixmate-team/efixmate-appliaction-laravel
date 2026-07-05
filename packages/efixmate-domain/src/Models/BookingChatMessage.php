<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingChatMessage extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_chat_messages';
    protected $primaryKey = 'message_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'sender_type',
        'customer_id',
        'technician_id',
        'message_type',
        'content',
        'media_url',
        'is_read',
        'created_at',
    ];

    protected $casts = [
        'message_id' => 'integer',
        'booking_id' => 'integer',
        'customer_id' => 'integer',
        'technician_id' => 'integer',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
