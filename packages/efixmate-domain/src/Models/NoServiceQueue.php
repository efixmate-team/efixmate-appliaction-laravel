<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class NoServiceQueue extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_no_service_queue';
    protected $primaryKey = 'queue_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'status',
        'note',
        'enqueued_at',
        'resolved_at',
        'resolved_by',
    ];

    protected $casts = [
        'queue_id' => 'integer',
        'booking_id' => 'integer',
        'enqueued_at' => 'datetime',
        'resolved_at' => 'datetime',
        'resolved_by' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
