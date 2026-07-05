<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminNotificationCampaign extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_notification_campaigns';
    protected $primaryKey = 'campaign_id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'channel',
        'template_id',
        'audience',
        'message_body',
        'status',
        'is_broadcast',
        'scheduled_at',
        'sent_at',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'campaign_id' => 'integer',
        'template_id' => 'integer',
        'audience' => 'array',
        'is_broadcast' => 'boolean',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
