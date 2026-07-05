<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobMaterial extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_materials';
    protected $primaryKey = 'material_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'name',
        'quantity',
        'unit_cost',
        'created_at',
    ];

    protected $casts = [
        'material_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
