<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobStartOtp extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_start_otp';
    protected $primaryKey = 'booking_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'otp_hash',
        'expires_at',
        'verified_at',
        'created_at',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
