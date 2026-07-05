<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianAvailability extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_availability';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'area_id',
        'slot_id',
        'is_available',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'technician_id' => 'integer',
        'area_id' => 'integer',
        'slot_id' => 'integer',
        'is_available' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
