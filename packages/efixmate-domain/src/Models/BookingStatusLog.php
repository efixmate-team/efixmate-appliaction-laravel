<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingStatusLog extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_status_logs';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'old_status',
        'new_status',
        'changed_by',
        'user_type',
        'remark',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'booking_id' => 'integer',
        'old_status' => 'integer',
        'new_status' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
