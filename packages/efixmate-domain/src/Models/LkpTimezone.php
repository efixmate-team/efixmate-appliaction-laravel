<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpTimezone extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_timezones';
    protected $primaryKey = 'timezone_id';
    public $timestamps = false;

    protected $fillable = [
        'timezone_name',
        'utc_offset',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'timezone_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
