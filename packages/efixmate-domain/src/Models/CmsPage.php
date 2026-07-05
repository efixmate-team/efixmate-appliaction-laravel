<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CmsPage extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cms_pages';
    protected $primaryKey = 'page_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'meta_title',
        'meta_description',
        'status',
        'published_at',
        'deleted_at',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'name',
        'description',
        'display_order',
        'is_active',
        'page_type',
        'draft_content',
        'published_content',
        'last_updated_at',
    ];

    protected $casts = [
        'page_id' => 'integer',
        'published_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'draft_content' => 'array',
        'published_content' => 'array',
        'last_updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
