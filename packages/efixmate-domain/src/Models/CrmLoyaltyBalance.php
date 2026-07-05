<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmLoyaltyBalance extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_loyalty_balance';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = [
        'points_balance',
        'tier',
        'updated_at',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'points_balance' => 'integer',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
