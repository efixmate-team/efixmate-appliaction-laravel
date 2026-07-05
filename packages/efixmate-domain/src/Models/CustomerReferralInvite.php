<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerReferralInvite extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_referral_invites';
    protected $primaryKey = 'invite_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'invitee_mobile',
        'invitee_name',
        'status',
        'created_at',
    ];

    protected $casts = [
        'invite_id' => 'integer',
        'customer_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
