<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminFailedLogin extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_failed_logins';
    protected $primaryKey = 'attempt_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'email',
        'ip_address',
        'user_agent',
        'reason',
        'created_at',
    ];

    protected $casts = [
        'attempt_id' => 'integer',
        'admin_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
