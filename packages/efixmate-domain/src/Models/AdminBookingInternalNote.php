<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminBookingInternalNote extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_booking_internal_notes';
    protected $primaryKey = 'note_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'admin_id',
        'note',
        'created_at',
    ];

    protected $casts = [
        'note_id' => 'integer',
        'booking_id' => 'integer',
        'admin_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
