<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerWalletLedger extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_wallet_ledger';
    protected $primaryKey = 'ledger_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'booking_id',
        'entry_type',
        'amount',
        'balance_after',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'ledger_id' => 'integer',
        'customer_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
