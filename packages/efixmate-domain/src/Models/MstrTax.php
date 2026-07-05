<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrTax extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_taxes';
    protected $primaryKey = 'tax_id';
    public $timestamps = false;

    protected $fillable = [
        'tax_name',
        'tax_percentage',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'tax_id' => 'integer',
        'tax_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
