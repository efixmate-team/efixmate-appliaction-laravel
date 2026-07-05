<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class PartnerAgreementAcceptanceLog extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_partner_agreement_acceptance_logs';
    protected $primaryKey = 'acceptance_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
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
        'technician_id' => 'integer',
        'policy_version_id' => 'integer',
        'accepted_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
