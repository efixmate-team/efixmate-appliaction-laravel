<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapDiscountService extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_discount_service';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'discount_id',
        'service_id',
        'category_id',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'discount_id' => 'integer',
        'service_id' => 'integer',
        'category_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
