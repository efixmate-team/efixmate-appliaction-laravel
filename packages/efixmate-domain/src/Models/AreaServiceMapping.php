<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AreaServiceMapping extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_area_service_mapping';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'service_id',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'area_id' => 'integer',
        'service_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
