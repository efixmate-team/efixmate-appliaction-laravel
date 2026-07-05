<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_activity_logs';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'actor_type',
        'actor_id',
        'http_method',
        'request_path',
        'status_code',
        'ip_address',
        'user_agent',
        'summary',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'actor_id' => 'integer',
        'status_code' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
