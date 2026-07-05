<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpCurrency extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_currencies';
    protected $primaryKey = 'currency_id';
    public $timestamps = false;

    protected $fillable = [
        'currency_name',
        'currency_code',
        'currency_symbol',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'currency_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
