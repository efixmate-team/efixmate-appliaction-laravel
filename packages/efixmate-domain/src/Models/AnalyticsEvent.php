<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_analytics_events';
    protected $primaryKey = 'event_id';
    public $timestamps = false;

    protected $fillable = [
        'event_name',
        'entity_type',
        'entity_id',
        'payload',
        'created_at',
    ];

    protected $casts = [
        'event_id' => 'integer',
        'payload' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
