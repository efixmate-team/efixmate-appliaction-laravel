<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpStatusType extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_status_type';
    protected $primaryKey = 'status_type_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq',
        'status_type',
        'description',
        'is_active',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'status_type_id' => 'integer',
        'order_seq' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
