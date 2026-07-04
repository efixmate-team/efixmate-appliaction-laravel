<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpStatus extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_status';
    protected $primaryKey = 'status_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq', 'status_type_id', 'status', 'description', 'is_active',
        'created_by', 'created_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'order_seq' => 'integer',
        'status_type_id' => 'integer',
        'created_at' => 'datetime',
    ];
}
