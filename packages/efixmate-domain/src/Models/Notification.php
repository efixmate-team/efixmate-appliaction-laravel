<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_notifications';
    protected $primaryKey = 'notification_id';
    public $timestamps = false;

    protected $fillable = [
        'recipient_type',
        'recipient_id',
        'title',
        'body',
        'type',
        'ref_type',
        'ref_id',
        'is_read',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'notification_id' => 'integer',
        'recipient_id' => 'integer',
        'is_read' => 'boolean',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
