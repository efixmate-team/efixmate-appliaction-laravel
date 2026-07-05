<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminBookingTag extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_booking_tags';
    protected $primaryKey = 'tag_id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'color',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'tag_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
