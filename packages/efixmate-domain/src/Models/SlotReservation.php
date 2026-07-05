<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SlotReservation extends Model
{
    use HasIsDeletedFlag, HasUuids;

    protected $table = 'efm_slot_reservations';
    protected $primaryKey = 'reservation_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'slot_id',
        'scheduled_date',
        'scheduled_time',
        'customer_id',
        'lock_id',
        'reserved_units',
        'reserved_until',
        'status',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'area_id' => 'integer',
        'slot_id' => 'integer',
        'scheduled_date' => 'datetime',
        'customer_id' => 'integer',
        'reserved_units' => 'integer',
        'reserved_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
