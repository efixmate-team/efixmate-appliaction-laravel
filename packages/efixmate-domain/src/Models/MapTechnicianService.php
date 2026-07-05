<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapTechnicianService extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_technician_services';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'service_id',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'technician_id' => 'integer',
        'service_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
