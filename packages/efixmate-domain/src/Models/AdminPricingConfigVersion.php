<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminPricingConfigVersion extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_pricing_config_versions';
    protected $primaryKey = 'version_id';
    public $timestamps = false;

    protected $fillable = [
        'config_type',
        'area_id',
        'config',
        'version_no',
        'is_active',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'version_id' => 'integer',
        'area_id' => 'integer',
        'config' => 'array',
        'version_no' => 'integer',
        'is_active' => 'boolean',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
