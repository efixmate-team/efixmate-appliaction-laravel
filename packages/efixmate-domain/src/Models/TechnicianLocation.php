<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianLocation extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_location';
    protected $primaryKey = 'location_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'city',
        'state',
        'country',
        'address',
        'pincode',
        'latitude',
        'longitude',
        'status_id',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'efm_techniciansTechnician_id',
    ];

    protected $casts = [
        'location_id' => 'integer',
        'technician_id' => 'integer',
        'pincode' => 'integer',
        'status_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'efm_techniciansTechnician_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
