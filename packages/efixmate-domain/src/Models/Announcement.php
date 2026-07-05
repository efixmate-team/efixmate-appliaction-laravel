<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_announcements';
    protected $primaryKey = 'text_announcement_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'message',
        'target_audience',
        'target_screen',
        'scope_type',
        'scope_ids',
        'priority',
        'start_at',
        'end_at',
        'is_active',
        'is_disabled',
        'is_scheduled',
        'timezone',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'text_announcement_id' => 'integer',
        'priority' => 'integer',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_active' => 'boolean',
        'is_disabled' => 'boolean',
        'is_scheduled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
