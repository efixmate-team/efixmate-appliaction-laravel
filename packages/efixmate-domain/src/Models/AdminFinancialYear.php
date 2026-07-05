<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminFinancialYear extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_financial_years';
    protected $primaryKey = 'fy_id';
    public $timestamps = false;

    protected $fillable = [
        'fy_label',
        'start_date',
        'end_date',
        'is_current',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'fy_id' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_current' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
