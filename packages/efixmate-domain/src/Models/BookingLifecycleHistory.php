<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingLifecycleHistory extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_lifecycle_history';
    protected $primaryKey = 'history_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'from_state',
        'to_state',
        'changed_by',
        'user_type',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'history_id' => 'integer',
        'booking_id' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
