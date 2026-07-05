<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CmsSection extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cms_sections';
    protected $primaryKey = 'section_id';
    public $timestamps = false;

    protected $fillable = [
        'page_id',
        'section_key',
        'label',
        'section_type',
        'is_global',
        'content',
        'draft_content',
        'status',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'published_at',
    ];

    protected $casts = [
        'section_id' => 'integer',
        'page_id' => 'integer',
        'is_global' => 'boolean',
        'content' => 'array',
        'draft_content' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'published_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
