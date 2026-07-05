<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianMobileChangeOtp extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_mobile_change_otp';
    protected $primaryKey = 'otp_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'new_mobile',
        'otp',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'otp_id' => 'integer',
        'technician_id' => 'integer',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
