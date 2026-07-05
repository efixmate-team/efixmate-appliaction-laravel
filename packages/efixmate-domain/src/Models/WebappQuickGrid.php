<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class WebappQuickGrid extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_webapp_quick_grids';
    protected $primaryKey = 'grid_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'subtitle',
        'badge',
        'accent',
        'items',
        'sort_order',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'grid_id' => 'integer',
        'items' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
