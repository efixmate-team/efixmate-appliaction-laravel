<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrAdminSetting extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_admin_settings';
    protected $primaryKey = 'admin_id';
    public $timestamps = false;

    protected $fillable = [
        'settings',
        'updated_at',
    ];

    protected $casts = [
        'admin_id' => 'integer',
        'settings' => 'array',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
