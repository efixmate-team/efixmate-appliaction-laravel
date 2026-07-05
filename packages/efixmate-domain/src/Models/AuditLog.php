<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_audit_log';
    protected $primaryKey = 'audit_id';
    public $timestamps = false;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'action',
        'old_value',
        'new_value',
        'performed_by_type',
        'performed_by_id',
        'ip',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'audit_id' => 'integer',
        'old_value' => 'array',
        'new_value' => 'array',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
