<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianLoginOtp extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_login_otp';
    protected $primaryKey = 'login_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id', 'mobile_number', 'otp', 'ip_address', 'attempts',
        'is_registered', 'generated_at', 'expired_at', 'created_at', 'created_by',
    ];

    protected $casts = [
        'is_registered' => 'boolean',
        'is_deleted' => 'boolean',
        'otp' => 'integer',
        'attempts' => 'integer',
        'generated_at' => 'datetime',
        'expired_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
