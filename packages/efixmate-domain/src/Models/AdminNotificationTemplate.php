<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminNotificationTemplate extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_notification_templates';
    protected $primaryKey = 'template_id';
    public $timestamps = false;

    protected $fillable = [
        'channel',
        'template_key',
        'title',
        'body',
        'variables',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'template_id' => 'integer',
        'variables' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
