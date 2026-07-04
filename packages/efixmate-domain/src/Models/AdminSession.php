<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminSession extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_sessions';
    protected $primaryKey = 'session_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id', 'device_id', 'device_name', 'platform', 'ip_address', 'user_agent',
        'token_jti', 'is_active', 'last_seen_at', 'created_at', 'revoked_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'last_seen_at' => 'datetime',
        'created_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id', 'admin_id');
    }
}
