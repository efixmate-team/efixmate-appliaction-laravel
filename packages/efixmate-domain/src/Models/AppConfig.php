<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AppConfig extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_app_config';
    protected $primaryKey = 'config_key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'config_key',
        'config_value',
        'updated_at',
    ];

    protected $casts = [
        'config_value' => 'array',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
