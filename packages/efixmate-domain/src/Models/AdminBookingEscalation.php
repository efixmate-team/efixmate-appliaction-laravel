<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminBookingEscalation extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_booking_escalations';
    protected $primaryKey = 'escalation_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'level',
        'reason',
        'status',
        'escalated_by',
        'resolved_at',
        'created_at',
    ];

    protected $casts = [
        'escalation_id' => 'integer',
        'booking_id' => 'integer',
        'escalated_by' => 'integer',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
