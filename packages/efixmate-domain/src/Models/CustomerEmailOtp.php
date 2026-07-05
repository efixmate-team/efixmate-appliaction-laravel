<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerEmailOtp extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_email_otp';
    protected $primaryKey = 'otp_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'email',
        'otp',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'otp_id' => 'integer',
        'customer_id' => 'integer',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
