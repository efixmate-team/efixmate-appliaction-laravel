<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminCmsContent extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_cms_content';
    protected $primaryKey = 'content_id';
    public $timestamps = false;

    protected $fillable = [
        'content_key',
        'content_type',
        'title',
        'body',
        'meta',
        'is_active',
        'updated_at',
    ];

    protected $casts = [
        'content_id' => 'integer',
        'meta' => 'array',
        'is_active' => 'boolean',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
