<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpBookingType extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_booking_type';
    protected $primaryKey = 'booking_type_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq', 'booking_type', 'description', 'is_active', 'created_by', 'created_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'order_seq' => 'integer',
        'created_at' => 'datetime',
    ];
}
