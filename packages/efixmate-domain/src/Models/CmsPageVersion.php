<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CmsPageVersion extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cms_page_versions';
    protected $primaryKey = 'version_id';
    public $timestamps = false;

    protected $fillable = [
        'page_id',
        'version_no',
        'title',
        'slug',
        'content',
        'status',
        'created_by',
        'created_at',
        'published_at',
    ];

    protected $casts = [
        'version_id' => 'integer',
        'page_id' => 'integer',
        'version_no' => 'integer',
        'content' => 'array',
        'created_at' => 'datetime',
        'published_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
