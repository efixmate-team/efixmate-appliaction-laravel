<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingLine extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_lines';
    protected $primaryKey = 'line_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'service_id',
        'quantity',
        'unit_price',
        'line_total',
        'booking_type_id',
        'created_at',
    ];

    protected $casts = [
        'line_id' => 'integer',
        'booking_id' => 'integer',
        'service_id' => 'integer',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'booking_type_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
