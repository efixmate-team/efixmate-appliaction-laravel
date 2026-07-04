<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminPrivilege extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_privileges';
    protected $primaryKey = 'privilege_id';
    public $timestamps = false;

    protected $fillable = [
        'menu_id', 'privilege_name', 'is_active', 'created_by', 'created_at',
        'updated_by', 'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function menu()
    {
        return $this->belongsTo(AdminMenu::class, 'menu_id', 'menu_id');
    }
}
