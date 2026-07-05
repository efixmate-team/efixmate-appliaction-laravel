<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerWallet extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_wallet';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = [
        'balance',
        'updated_at',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'balance' => 'decimal:2',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
