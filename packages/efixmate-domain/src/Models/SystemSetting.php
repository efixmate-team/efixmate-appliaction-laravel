<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_system_settings';
    protected $primaryKey = 'setting_key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'setting_key',
        'setting_value',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'setting_value' => 'array',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
