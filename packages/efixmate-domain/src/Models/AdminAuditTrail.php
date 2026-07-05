<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminAuditTrail extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_audit_trail';
    protected $primaryKey = 'audit_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'module',
        'action',
        'entity_type',
        'entity_id',
        'payload',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'audit_id' => 'integer',
        'admin_id' => 'integer',
        'payload' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
