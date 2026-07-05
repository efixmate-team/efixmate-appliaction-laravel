<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrTimeSlot extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_time_slots';
    protected $primaryKey = 'slot_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'service_id',
        'name',
        'start_time',
        'end_time',
        'surge_multiplier',
        'max_capacity',
        'is_instant',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'slot_id' => 'integer',
        'area_id' => 'integer',
        'service_id' => 'integer',
        'surge_multiplier' => 'decimal:2',
        'max_capacity' => 'integer',
        'is_instant' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
