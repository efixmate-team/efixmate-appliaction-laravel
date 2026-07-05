<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminSecurityEvent extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_security_events';
    protected $primaryKey = 'event_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'event_type',
        'severity',
        'description',
        'meta',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'event_id' => 'integer',
        'admin_id' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
