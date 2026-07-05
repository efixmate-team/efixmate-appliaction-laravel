<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LogError extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_log_errors';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'error_type',
        'message',
        'stack_trace',
        'api_endpoint',
        'payload',
        'user_id',
        'user_type',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'payload' => 'array',
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
