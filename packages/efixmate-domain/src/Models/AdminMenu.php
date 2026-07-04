<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminMenu extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_menus';
    protected $primaryKey = 'menu_id';
    public $timestamps = false;

    protected $fillable = [
        'menu_name', 'menu_path', 'menu_icon', 'menu_parent_id', 'menu_group_id',
        'menu_group', 'sort_order', 'menu_type', 'is_active', 'created_by', 'created_at',
        'updated_by', 'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function privileges()
    {
        return $this->hasMany(AdminPrivilege::class, 'menu_id', 'menu_id');
    }
}
