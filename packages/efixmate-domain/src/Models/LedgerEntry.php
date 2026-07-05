<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_ledger_entries';
    protected $primaryKey = 'entry_id';
    public $timestamps = false;

    protected $fillable = [
        'transaction_id',
        'debit_account',
        'credit_account',
        'amount',
        'currency',
        'reference_type',
        'reference_id',
        'transaction_type',
        'meta',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
    ];

    protected $casts = [
        'entry_id' => 'integer',
        'amount' => 'decimal:2',
        'meta' => 'array',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
