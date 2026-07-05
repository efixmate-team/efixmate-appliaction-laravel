<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapCouponService extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_coupon_service';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'coupon_id',
        'service_id',
        'category_id',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'coupon_id' => 'integer',
        'service_id' => 'integer',
        'category_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
