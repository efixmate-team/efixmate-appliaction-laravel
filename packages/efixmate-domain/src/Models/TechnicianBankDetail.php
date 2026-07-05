<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianBankDetail extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_bank_details';
    protected $primaryKey = 'details_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'acount_holder_name',
        'account_number',
        'ifsc_number',
        'account_type',
        'status_id',
        'is_verified',
        'reject_remark',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'details_id' => 'integer',
        'technician_id' => 'integer',
        'status_id' => 'integer',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
