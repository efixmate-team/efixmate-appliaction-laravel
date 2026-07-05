<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianArea extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_areas';
    // Composite primary key (technician_id, area_id) — Eloquent has no native support;
    // query via the builder rather than find(). Not auto-incrementing.
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'technician_id' => 'integer',
        'area_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
