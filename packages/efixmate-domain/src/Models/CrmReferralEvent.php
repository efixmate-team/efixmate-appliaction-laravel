<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmReferralEvent extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_referral_events';
    protected $primaryKey = 'referral_id';
    public $timestamps = false;

    protected $fillable = [
        'referrer_customer_id',
        'referred_customer_id',
        'invite_id',
        'event_type',
        'reward_points',
        'status',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'referral_id' => 'integer',
        'referrer_customer_id' => 'integer',
        'referred_customer_id' => 'integer',
        'invite_id' => 'integer',
        'reward_points' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
