<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AreaServicePricing extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_area_service_pricing';
    // Composite primary key (area_id, service_id) — Eloquent has no native support;
    // query via the builder rather than find(). Not auto-incrementing.
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'price',
        'discount',
        'final_price',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'area_id' => 'integer',
        'service_id' => 'integer',
        'price' => 'decimal:2',
        'discount' => 'decimal:2',
        'final_price' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
