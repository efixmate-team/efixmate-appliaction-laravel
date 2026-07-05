<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobExtraCharge extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_extra_charges';
    protected $primaryKey = 'charge_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'amount',
        'reason',
        'status',
        'created_at',
    ];

    protected $casts = [
        'charge_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
