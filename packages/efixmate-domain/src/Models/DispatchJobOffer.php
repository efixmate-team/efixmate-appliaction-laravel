<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class DispatchJobOffer extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_dispatch_job_offers';
    protected $primaryKey = 'offer_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'wave',
        'status',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'offer_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'wave' => 'integer',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
