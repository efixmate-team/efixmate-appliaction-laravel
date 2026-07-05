<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianLiveLocation extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_live_locations';
    protected $primaryKey = 'technician_id';
    public $timestamps = false;

    protected $fillable = [
        'lat',
        'lng',
        'updated_at',
    ];

    protected $casts = [
        'technician_id' => 'integer',
        'lat' => 'decimal:2',
        'lng' => 'decimal:2',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
