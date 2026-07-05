<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerSavedPaymentMethod extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_saved_payment_methods';
    protected $primaryKey = 'method_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'provider',
        'method_type',
        'token_ref',
        'label',
        'meta',
        'is_default',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'method_id' => 'integer',
        'customer_id' => 'integer',
        'meta' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
