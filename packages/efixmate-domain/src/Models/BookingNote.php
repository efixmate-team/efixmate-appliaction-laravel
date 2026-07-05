<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingNote extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_notes';
    protected $primaryKey = 'note_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'customer_id',
        'note',
        'author_type',
        'created_at',
    ];

    protected $casts = [
        'note_id' => 'integer',
        'booking_id' => 'integer',
        'customer_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
