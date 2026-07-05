<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpAreaType extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_area_type';
    protected $primaryKey = 'area_type_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq',
        'area_type',
        'description',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'area_type_id' => 'integer',
        'order_seq' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
