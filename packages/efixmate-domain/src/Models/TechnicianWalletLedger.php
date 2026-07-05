<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianWalletLedger extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_wallet_ledger';
    protected $primaryKey = 'ledger_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'booking_id',
        'entry_type',
        'amount',
        'balance_after',
        'meta',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
    ];

    protected $casts = [
        'ledger_id' => 'integer',
        'technician_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
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
