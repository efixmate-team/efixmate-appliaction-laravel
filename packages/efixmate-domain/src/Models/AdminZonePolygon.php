<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminZonePolygon extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_zone_polygons';
    protected $primaryKey = 'zone_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'zone_name',
        'polygon',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'zone_id' => 'integer',
        'area_id' => 'integer',
        'polygon' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
