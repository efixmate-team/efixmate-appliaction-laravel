<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminNotificationInbox extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_notification_inbox';
    protected $primaryKey = 'inbox_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'title',
        'body',
        'channel',
        'category',
        'is_read',
        'read_at',
        'reference_type',
        'reference_id',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'inbox_id' => 'integer',
        'admin_id' => 'integer',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
