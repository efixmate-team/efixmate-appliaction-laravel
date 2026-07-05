<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmBlockHistory extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_block_history';
    protected $primaryKey = 'history_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'action',
        'reason',
        'admin_id',
        'created_at',
    ];

    protected $casts = [
        'history_id' => 'integer',
        'customer_id' => 'integer',
        'admin_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
