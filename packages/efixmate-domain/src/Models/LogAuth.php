<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LogAuth extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_log_auth';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'user_type',
        'user_id',
        'action',
        'ip_address',
        'device_info',
        'status',
        'remark',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'user_id' => 'integer',
        'device_info' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
