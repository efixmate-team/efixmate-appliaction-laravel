<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrCommissionRule extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_commission_rules';
    protected $primaryKey = 'rule_id';
    public $timestamps = false;

    protected $fillable = [
        'rule_name',
        'rule_type',
        'commission_mode',
        'commission_value',
        'min_commission',
        'max_commission',
        'service_id',
        'area_id',
        'city_id',
        'technician_id',
        'campaign_code',
        'applies_to_surge',
        'surge_rate_addon',
        'formula',
        'stack_group',
        'priority',
        'valid_from',
        'valid_until',
        'gst_applicable',
        'gst_rate',
        'tds_applicable',
        'tds_section',
        'tds_rate',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'rule_id' => 'integer',
        'commission_value' => 'decimal:2',
        'min_commission' => 'decimal:2',
        'max_commission' => 'decimal:2',
        'service_id' => 'integer',
        'area_id' => 'integer',
        'city_id' => 'integer',
        'technician_id' => 'integer',
        'applies_to_surge' => 'boolean',
        'surge_rate_addon' => 'decimal:2',
        'formula' => 'array',
        'priority' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'gst_applicable' => 'boolean',
        'gst_rate' => 'decimal:2',
        'tds_applicable' => 'boolean',
        'tds_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
