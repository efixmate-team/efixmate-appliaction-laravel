<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Model
{
    use HasApiTokens, HasIsDeletedFlag;

    protected $table = 'efm_customers';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_uid', 'customer_code', 'first_name', 'last_name', 'mobile_number',
        'email', 'email_verified', 'mobile_verified', 'is_active', 'profile_pitcher',
        'is_blocked', 'blocked_at', 'blocked_reason', 'blocked_by', 'spam_score',
        'spam_flag', 'referral_code', 'referred_by_customer_id', 'created_by',
        'created_at', 'updated_by', 'updated_at', 'last_retention_nudge_at',
    ];

    protected $casts = [
        'email_verified' => 'boolean',
        'mobile_verified' => 'boolean',
        'is_active' => 'boolean',
        'is_blocked' => 'boolean',
        'spam_flag' => 'boolean',
        'is_deleted' => 'boolean',
        'spam_score' => 'integer',
        'blocked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'last_retention_nudge_at' => 'datetime',
    ];

    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id', 'customer_id');
    }

    public function sessions()
    {
        return $this->hasMany(CustomerSession::class, 'customer_id', 'customer_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'customer_id', 'customer_id');
    }
}
