<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapAreaCategory extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_area_category';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'area_id',
        'category_id',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'area_id' => 'integer',
        'category_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
