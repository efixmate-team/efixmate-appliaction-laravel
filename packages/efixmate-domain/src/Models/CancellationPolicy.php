<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CancellationPolicy extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_cancellation_policies';
    protected $primaryKey = 'policy_id';
    public $timestamps = false;

    protected $fillable = [
        'window_hours',
        'fee_type',
        'fee_value',
        'description',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'policy_id' => 'integer',
        'window_hours' => 'integer',
        'fee_value' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
