<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapAreaServiceCharge extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_area_service_charge';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'service_id',
        'charge_id',
        'charge_type',
        'charge_value',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'area_id' => 'integer',
        'service_id' => 'integer',
        'charge_id' => 'integer',
        'charge_value' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
