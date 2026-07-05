<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpUnit extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_units';
    protected $primaryKey = 'unit_id';
    public $timestamps = false;

    protected $fillable = [
        'unit_name',
        'unit_symbol',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'unit_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
