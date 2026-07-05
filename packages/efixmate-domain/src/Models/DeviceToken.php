<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class DeviceToken extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_device_tokens';
    protected $primaryKey = 'token_id';
    public $timestamps = false;

    protected $fillable = [
        'user_type',
        'user_id',
        'fcm_token',
        'device_id',
        'platform',
        'is_active',
        'updated_at',
    ];

    protected $casts = [
        'token_id' => 'integer',
        'user_id' => 'integer',
        'is_active' => 'boolean',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
