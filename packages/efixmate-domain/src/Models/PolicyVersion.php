<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class PolicyVersion extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_policy_versions';
    protected $primaryKey = 'policy_version_id';
    public $timestamps = false;

    protected $fillable = [
        'policy_type',
        'page_slug',
        'version_label',
        'title',
        'effective_from',
        'published_at',
        'is_published',
        'content_snapshot',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'policy_version_id' => 'integer',
        'effective_from' => 'datetime',
        'published_at' => 'datetime',
        'is_published' => 'boolean',
        'content_snapshot' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
