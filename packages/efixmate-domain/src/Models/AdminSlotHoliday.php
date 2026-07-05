<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminSlotHoliday extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_slot_holidays';
    protected $primaryKey = 'holiday_id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'holiday_date',
        'reason',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'holiday_id' => 'integer',
        'area_id' => 'integer',
        'holiday_date' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
