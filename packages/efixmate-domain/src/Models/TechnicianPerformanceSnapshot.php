<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianPerformanceSnapshot extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_performance_snapshots';
    protected $primaryKey = 'technician_id';
    public $timestamps = false;

    protected $fillable = [
        'acceptance_ratio',
        'completion_ratio',
        'avg_rating',
        'complaints_count',
        'updated_at',
    ];

    protected $casts = [
        'technician_id' => 'integer',
        'acceptance_ratio' => 'decimal:2',
        'completion_ratio' => 'decimal:2',
        'avg_rating' => 'decimal:2',
        'complaints_count' => 'integer',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
