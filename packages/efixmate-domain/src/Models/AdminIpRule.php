<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminIpRule extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_ip_rules';
    protected $primaryKey = 'rule_id';
    public $timestamps = false;

    protected $fillable = [
        'scope',
        'admin_id',
        'ip_address',
        'cidr',
        'label',
        'is_active',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'rule_id' => 'integer',
        'admin_id' => 'integer',
        'is_active' => 'boolean',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
