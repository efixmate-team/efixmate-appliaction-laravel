<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class ServicePricing extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_service_pricing';
    protected $primaryKey = 'pricing_id';
    public $timestamps = false;

    protected $fillable = [
        'service_id',
        'booking_type_id',
        'city_id',
        'price',
        'unit_price',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'pricing_id' => 'integer',
        'service_id' => 'integer',
        'booking_type_id' => 'integer',
        'city_id' => 'integer',
        'price' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
