<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapAreaServiceBookingType extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_area_service_booking_type';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'service_id',
        'booking_type_id',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'area_id' => 'integer',
        'service_id' => 'integer',
        'booking_type_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
