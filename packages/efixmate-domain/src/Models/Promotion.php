<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_promotions';
    protected $primaryKey = 'announcement_id';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'message',
        'trigger_type',
        'scope',
        'is_active',
        'created_at',
        'updated_at',
        'subtitle',
        'description',
        'announcement_type',
        'scope_type',
        'scope_ids',
        'desktop_image_url',
        'mobile_image_url',
        'background_color',
        'cta_text',
        'cta_action_type',
        'cta_value',
        'coupon_code',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount',
        'usage_limit',
        'per_user_limit',
        'timezone',
        'start_at',
        'end_at',
        'priority',
        'is_scheduled',
        'is_disabled',
        'target_audience',
        'target_screen',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'announcement_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'discount_value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'per_user_limit' => 'integer',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'priority' => 'integer',
        'is_scheduled' => 'boolean',
        'is_disabled' => 'boolean',
        'is_deleted' => 'boolean',
    ];
}
