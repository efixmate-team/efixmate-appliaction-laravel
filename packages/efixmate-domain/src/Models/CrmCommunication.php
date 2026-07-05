<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmCommunication extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_communications';
    protected $primaryKey = 'comm_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'channel',
        'direction',
        'subject',
        'body',
        'status',
        'ref_type',
        'ref_id',
        'admin_id',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'comm_id' => 'integer',
        'customer_id' => 'integer',
        'admin_id' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
