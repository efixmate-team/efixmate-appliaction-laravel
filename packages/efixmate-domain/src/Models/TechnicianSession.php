<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianSession extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_sessions';
    protected $primaryKey = 'session_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id', 'device_id', 'device_name', 'platform', 'ip_address',
        'user_agent', 'refresh_token_hash', 'is_active', 'last_seen_at', 'created_at',
        'revoked_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'last_seen_at' => 'datetime',
        'created_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function technician()
    {
        return $this->belongsTo(Technician::class, 'technician_id', 'technician_id');
    }
}
