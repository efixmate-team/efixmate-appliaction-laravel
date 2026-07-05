<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrDiscount extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_discounts';
    protected $primaryKey = 'discount_id';
    public $timestamps = false;

    protected $fillable = [
        'discount_title',
        'discount_type',
        'discount_value',
        'is_active',
        'created_at',
        'updated_at',
        'target_id',
        'target_type',
    ];

    protected $casts = [
        'discount_id' => 'integer',
        'discount_value' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'target_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
