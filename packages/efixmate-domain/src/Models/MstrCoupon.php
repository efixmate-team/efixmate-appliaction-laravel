<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrCoupon extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_coupons';
    protected $primaryKey = 'coupon_id';
    public $timestamps = false;

    protected $fillable = [
        'coupon_code',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'valid_from',
        'valid_until',
        'is_active',
        'created_at',
        'updated_at',
        'buy_x',
        'coupon_type',
        'get_y',
        'usage_limit',
        'usage_type',
        'max_uses',
        'max_uses_per_user',
    ];

    protected $casts = [
        'coupon_id' => 'integer',
        'discount_value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'buy_x' => 'integer',
        'get_y' => 'integer',
        'usage_limit' => 'integer',
        'max_uses' => 'integer',
        'max_uses_per_user' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
