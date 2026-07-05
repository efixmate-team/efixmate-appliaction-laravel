<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminCmsBanner extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_cms_banners';
    protected $primaryKey = 'banner_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'image_url',
        'link_url',
        'redirect_url',
        'placement',
        'banner_type',
        'sort_order',
        'priority',
        'visible_from',
        'visible_until',
        'is_active',
        'deleted_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'banner_id' => 'integer',
        'sort_order' => 'integer',
        'priority' => 'integer',
        'visible_from' => 'datetime',
        'visible_until' => 'datetime',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
