<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class NotificationPref extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_notification_prefs';
    // Composite primary key (user_type, user_id) — Eloquent has no native support;
    // query via the builder rather than find(). Not auto-incrementing.
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'push_enabled',
        'sms_enabled',
        'email_enabled',
        'booking_alerts',
        'promo_alerts',
        'job_alerts',
        'earnings_alerts',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'push_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'email_enabled' => 'boolean',
        'booking_alerts' => 'boolean',
        'promo_alerts' => 'boolean',
        'job_alerts' => 'boolean',
        'earnings_alerts' => 'boolean',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
