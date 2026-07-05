<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TransactionTax extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_transaction_taxes';
    protected $primaryKey = 'tax_log_id';
    public $timestamps = false;

    protected $fillable = [
        'transaction_id',
        'tax_amount',
        'tax_type',
        'is_active',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
    ];

    protected $casts = [
        'tax_log_id' => 'integer',
        'tax_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
