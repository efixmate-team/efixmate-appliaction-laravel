<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmLoyaltyLedger extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_loyalty_ledger';
    protected $primaryKey = 'ledger_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'points_delta',
        'balance_after',
        'entry_type',
        'ref_type',
        'ref_id',
        'note',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'ledger_id' => 'integer',
        'customer_id' => 'integer',
        'points_delta' => 'integer',
        'balance_after' => 'integer',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
