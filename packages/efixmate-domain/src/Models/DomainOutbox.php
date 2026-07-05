<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class DomainOutbox extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_domain_outbox';
    protected $primaryKey = 'outbox_id';
    public $timestamps = false;

    protected $fillable = [
        'event_type',
        'aggregate_type',
        'aggregate_id',
        'payload',
        'status',
        'published_at',
        'created_at',
    ];

    protected $casts = [
        'outbox_id' => 'integer',
        'payload' => 'array',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
