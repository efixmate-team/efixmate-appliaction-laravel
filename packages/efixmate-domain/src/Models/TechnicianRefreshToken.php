<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianRefreshToken extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_refresh_tokens';
    protected $primaryKey = 'token_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'session_id',
        'token_hash',
        'expires_at',
        'is_revoked',
        'created_at',
    ];

    protected $casts = [
        'token_id' => 'integer',
        'technician_id' => 'integer',
        'session_id' => 'integer',
        'expires_at' => 'datetime',
        'is_revoked' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
