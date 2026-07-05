<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class UserPolicyAcceptanceLog extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_user_policy_acceptance_logs';
    protected $primaryKey = 'acceptance_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'policy_type',
        'policy_version_id',
        'version_label',
        'accepted_at',
        'ip_address',
        'user_agent',
        'source',
        'created_at',
    ];

    protected $casts = [
        'acceptance_id' => 'integer',
        'customer_id' => 'integer',
        'policy_version_id' => 'integer',
        'accepted_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
