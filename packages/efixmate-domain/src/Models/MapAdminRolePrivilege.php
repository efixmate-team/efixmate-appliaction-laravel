<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapAdminRolePrivilege extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_admin_role_privilege';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'privilege_id', 'role_id', 'permission_type', 'is_active', 'created_by',
        'created_at', 'updated_by', 'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function privilege()
    {
        return $this->belongsTo(AdminPrivilege::class, 'privilege_id', 'privilege_id');
    }

    public function role()
    {
        return $this->belongsTo(AdminRole::class, 'role_id', 'role_id');
    }
}
