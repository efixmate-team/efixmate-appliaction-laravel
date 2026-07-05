<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_idempotency_keys';
    protected $primaryKey = 'idempotency_key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'idempotency_key',
        'route',
        'response_status',
        'response_body',
        'created_at',
        'expires_at',
    ];

    protected $casts = [
        'response_status' => 'integer',
        'response_body' => 'array',
        'created_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
