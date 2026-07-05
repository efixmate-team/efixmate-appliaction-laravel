<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class ModuleQueueFailure extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_module_queue_failures';
    protected $primaryKey = 'failure_id';
    public $timestamps = false;

    protected $fillable = [
        'module',
        'queue_name',
        'job_name',
        'payload',
        'error_message',
        'attempts',
        'replay_count',
        'dead_letter_at',
        'created_at',
    ];

    protected $casts = [
        'failure_id' => 'integer',
        'payload' => 'array',
        'attempts' => 'integer',
        'replay_count' => 'integer',
        'dead_letter_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
