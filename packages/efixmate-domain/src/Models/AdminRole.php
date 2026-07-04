<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminRole extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_roles';
    protected $primaryKey = 'role_id';
    public $timestamps = false;

    protected $fillable = [
        'role_name', 'role_code', 'is_active', 'created_by', 'created_at',
        'updated_by', 'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function privilegeMappings()
    {
        return $this->hasMany(MapAdminRolePrivilege::class, 'role_id', 'role_id');
    }
}
