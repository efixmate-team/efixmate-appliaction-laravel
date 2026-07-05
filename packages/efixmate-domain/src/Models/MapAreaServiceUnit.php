<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapAreaServiceUnit extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_area_service_unit';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'service_id',
        'unit_id',
        'price_per_unit',
        'flat_price',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'area_id' => 'integer',
        'service_id' => 'integer',
        'unit_id' => 'integer',
        'price_per_unit' => 'decimal:2',
        'flat_price' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
