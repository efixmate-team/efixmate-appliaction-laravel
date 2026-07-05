<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminNotificationSchedule extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_notification_schedules';
    protected $primaryKey = 'schedule_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'channel',
        'template_id',
        'audience',
        'payload',
        'scheduled_at',
        'status',
        'campaign_id',
        'retry_count',
        'error_message',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'schedule_id' => 'integer',
        'template_id' => 'integer',
        'audience' => 'array',
        'payload' => 'array',
        'scheduled_at' => 'datetime',
        'campaign_id' => 'integer',
        'retry_count' => 'integer',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
