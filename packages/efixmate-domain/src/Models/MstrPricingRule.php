<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrPricingRule extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_pricing_rules';
    protected $primaryKey = 'rule_id';
    public $timestamps = false;

    protected $fillable = [
        'rule_name',
        'service_id',
        'rule_type',
        'adjustment_mode',
        'adjustment_value',
        'price',
        'discount_type',
        'discount_value',
        'area_id',
        'city_id',
        'state_id',
        'slot_id',
        'is_emergency',
        'schedule_days',
        'schedule_start_time',
        'schedule_end_time',
        'start_date',
        'end_date',
        'priority',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'rule_id' => 'integer',
        'service_id' => 'integer',
        'adjustment_value' => 'decimal:2',
        'price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'area_id' => 'integer',
        'city_id' => 'integer',
        'state_id' => 'integer',
        'slot_id' => 'integer',
        'is_emergency' => 'boolean',
        'schedule_days' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'priority' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
