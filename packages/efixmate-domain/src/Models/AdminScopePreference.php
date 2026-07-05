<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminScopePreference extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_scope_preferences';
    protected $primaryKey = 'pref_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'updated_at',
    ];

    protected $casts = [
        'pref_id' => 'integer',
        'admin_id' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
