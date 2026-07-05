<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminFinanceReportRun extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_finance_report_runs';
    protected $primaryKey = 'run_id';
    public $timestamps = false;

    protected $fillable = [
        'report_type',
        'format',
        'date_from',
        'date_to',
        'row_count',
        'filters',
        'generated_by',
        'created_at',
    ];

    protected $casts = [
        'run_id' => 'integer',
        'date_from' => 'datetime',
        'date_to' => 'datetime',
        'row_count' => 'integer',
        'filters' => 'array',
        'generated_by' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
