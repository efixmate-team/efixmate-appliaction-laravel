<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapBookingTag extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_booking_tag';
    // Composite primary key (booking_id, tag_id) — Eloquent has no native support;
    // query via the builder rather than find(). Not auto-incrementing.
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'tagged_by',
        'created_at',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'tag_id' => 'integer',
        'tagged_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
