<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmActivityEvent extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_activity_events';
    protected $primaryKey = 'event_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'event_type',
        'title',
        'description',
        'ref_type',
        'ref_id',
        'actor_type',
        'actor_id',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'event_id' => 'integer',
        'customer_id' => 'integer',
        'actor_id' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
