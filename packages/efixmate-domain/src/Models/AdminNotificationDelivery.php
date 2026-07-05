<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminNotificationDelivery extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_notification_delivery';
    protected $primaryKey = 'delivery_id';
    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'recipient_type',
        'recipient_id',
        'channel',
        'status',
        'subject',
        'recipient_address',
        'message_body',
        'template_id',
        'scheduled_at',
        'sent_at',
        'failed_at',
        'retry_count',
        'max_retries',
        'error_message',
        'provider',
        'provider_ref',
        'meta',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'delivery_id' => 'integer',
        'campaign_id' => 'integer',
        'recipient_id' => 'integer',
        'template_id' => 'integer',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'failed_at' => 'datetime',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
