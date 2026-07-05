<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminSupportAssignment extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_support_assignments';
    protected $primaryKey = 'assignment_id';
    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'ticket_source',
        'admin_id',
        'priority',
        'status',
        'note',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'assignment_id' => 'integer',
        'ticket_id' => 'integer',
        'admin_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
