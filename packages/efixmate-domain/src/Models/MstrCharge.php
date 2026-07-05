<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrCharge extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_charges';
    protected $primaryKey = 'charge_id';
    public $timestamps = false;

    protected $fillable = [
        'charge_name',
        'charge_type',
        'charge_value',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'charge_id' => 'integer',
        'charge_value' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
