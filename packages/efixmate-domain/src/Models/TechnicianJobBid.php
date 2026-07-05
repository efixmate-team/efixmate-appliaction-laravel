<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobBid extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_bids';
    protected $primaryKey = 'bid_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'bid_amount',
        'message',
        'status',
        'created_at',
    ];

    protected $casts = [
        'bid_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'bid_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
