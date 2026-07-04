<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerLoginOtp extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_login_otp';
    protected $primaryKey = 'login_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id', 'mobile_number', 'otp', 'ip_address', 'is_registered',
        'generated_at', 'expired_at', 'created_at', 'created_by', 'attempts',
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
