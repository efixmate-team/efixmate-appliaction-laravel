<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianDocument extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_documents';
    protected $primaryKey = 'document_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'document_type_id',
        'document_number',
        'attachement',
        'status_id',
        'is_verified',
        'reject_remark',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'efm_techniciansTechnician_id',
    ];

    protected $casts = [
        'document_id' => 'integer',
        'technician_id' => 'integer',
        'document_type_id' => 'integer',
        'status_id' => 'integer',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'efm_techniciansTechnician_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
