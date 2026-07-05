<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_referrals';
    protected $primaryKey = 'referral_id';
    public $timestamps = false;

    protected $fillable = [
        'referrer_id',
        'referrer_type',
        'referred_id',
        'referred_type',
        'referral_code',
        'status',
        'trigger_event',
        'referrer_reward',
        'referred_reward',
        'rewarded_at',
        'is_active',
        'created_at',
        'applied_ip',
        'is_flagged',
        'flag_reason',
    ];

    protected $casts = [
        'referral_id' => 'integer',
        'referrer_id' => 'integer',
        'referred_id' => 'integer',
        'referrer_reward' => 'decimal:2',
        'referred_reward' => 'decimal:2',
        'rewarded_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_flagged' => 'boolean',
        'is_deleted' => 'boolean',
    ];
}
