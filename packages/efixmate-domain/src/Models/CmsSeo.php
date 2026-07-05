<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CmsSeo extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cms_seo';
    protected $primaryKey = 'seo_id';
    public $timestamps = false;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'slug',
        'meta_title',
        'meta_description',
        'deleted_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'seo_id' => 'integer',
        'entity_id' => 'integer',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
