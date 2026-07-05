<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmComplaint extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_complaints';
    protected $primaryKey = 'complaint_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'booking_id',
        'ticket_id',
        'category',
        'subject',
        'description',
        'status',
        'priority',
        'assigned_to',
        'resolution',
        'created_by',
        'resolved_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'complaint_id' => 'integer',
        'customer_id' => 'integer',
        'booking_id' => 'integer',
        'ticket_id' => 'integer',
        'assigned_to' => 'integer',
        'created_by' => 'integer',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
