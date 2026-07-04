<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpPaymentModes extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_payment_modes';
    protected $primaryKey = 'payment_mode_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq', 'payment_mode', 'description', 'is_active', 'created_by', 'created_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'order_seq' => 'integer',
        'created_at' => 'datetime',
    ];
}
