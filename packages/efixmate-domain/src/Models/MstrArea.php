<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrArea extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_areas';
    protected $primaryKey = 'area_id';
    public $timestamps = false;

    protected $fillable = [
        'area_name',
        'city_id',
        'area_type_id',
        'latitude',
        'longitude',
        'radius_km',
        'polygon_coordinates',
        'max_active_bookings',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'area_id' => 'integer',
        'city_id' => 'integer',
        'area_type_id' => 'integer',
        'latitude' => 'decimal:2',
        'longitude' => 'decimal:2',
        'radius_km' => 'decimal:2',
        'polygon_coordinates' => 'array',
        'max_active_bookings' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
