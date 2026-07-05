<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class BookingMedia extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_booking_media';
    protected $primaryKey = 'media_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'customer_id',
        'media_type',
        'url',
        'uploader_type',
        'created_at',
    ];

    protected $casts = [
        'media_id' => 'integer',
        'booking_id' => 'integer',
        'customer_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
